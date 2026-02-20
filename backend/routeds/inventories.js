import express from 'express'

const router = express.Router()

export default function InventoryList(db) {
  router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit

    try {
      const inv = await db.query(
        `
      SELECT i.item_id, items."name", i.quantity, items.unit
      FROM inventories AS i
      LEFT JOIN items ON items.id = i.item_id
      LEFT JOIN categories AS c ON c.id = items.category_id
      WHERE items.is_active = true
      ORDER BY i.item_id DESC
      LIMIT $1 OFFSET $2
    `,
        [limit, offset]
      )

      const count = await db.query(`
      SELECT COUNT(*) 
      FROM inventories AS i
      LEFT JOIN items ON items.id = i.item_id
      WHERE items.is_active = true
    `)

      const totalItems = parseInt(count.rows[0].count)
      const totalPages = Math.ceil(totalItems / limit)

      return res.json({
        success: true,
        inventory: inv.rows,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
        },
      })
    } catch (error) {
      console.log('Get item error:', error)
      return res.status(500).json({
        success: false,
        message: 'Database Error',
      })
    }
  })

  router.post('/log', async (req, res) => {
    const { item_id, type, quantity, reference_id, remark } = req.body
    const createdBy = req.user?.id ?? 2

    if (!item_id || !type || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'item_id, type, quantity are required',
      })
    }

    if (!['IN', 'OUT', 'RETURN', 'ADJUST'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory log type',
      })
    }

    if (type !== 'ADJUST' && quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be positive',
      })
    }

    const client = await db.connect()

    try {
      await client.query('BEGIN')
      const itemRes = await client.query(
        `
        SELECT inv.quantity
        FROM inventories inv
        JOIN items i ON i.id = inv.item_id
        WHERE i.id = $1 AND i.is_active = true
        FOR UPDATE
        `,
        [item_id]
      )

      if (itemRes.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({
          success: false,
          message: 'ไม่พบพัสดุหมายเลขนี้',
        })
      }

      const currentQty = itemRes.rows[0].quantity
      let delta = 0

      if (type === 'IN' || type === 'RETURN') {
        delta = quantity
      } else if (type === 'OUT') {
        delta = -quantity
      } else if (type === 'ADJUST') {
        delta = quantity
      }

      const newBalance = currentQty + delta

      if (newBalance < 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock',
        })
      }

      await client.query(
        `
        INSERT INTO inventory_logs 
        (item_id, type, quantity, created_by, reference_id, balance_after, remark)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [item_id, type, quantity, createdBy, reference_id, newBalance, remark]
      )

      await client.query(
        `
        UPDATE inventories
        SET quantity = $1
        WHERE item_id = $2
        `,
        [newBalance, item_id]
      )

      if (type === 'RETURN' && reference_id.startsWith('WITHDRAW-#')) {
        const withdrawId = reference_id.replace('WITHDRAW-#', '')

        await client.query(
          `UPDATE withdraw_items 
             SET returned_quantity = returned_quantity + $1
             WHERE withdraw_id = $2 AND item_id = $3`,
          [quantity, withdrawId, item_id]
        )

        await client.query(
          `UPDATE withdraw_items 
             SET status = 'returned' 
             WHERE withdraw_id = $1 AND item_id = $2 AND returned_quantity >= approved_quantity`,
          [withdrawId, item_id]
        )
      }
      await client.query('COMMIT')

      return res.json({
        success: true,
        message: 'Inventory log saved',
        newBalance: newBalance,
      })
    } catch (err) {
      await client.query('ROLLBACK')
      console.error(err)
      return res.status(500).json({ success: false })
    } finally {
      client.release()
    }
  })

  router.get('/log', async (req, res) => {
    const { start_date, end_date, category_id, item_id } = req.query
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit

    try {
      let query = `
      SELECT 
        l.*, 
        i.name AS item_name, 
        c.category AS category_name,
        c.subcategory AS subcategory_name,
		users.email, users.display_name, users.role ,users.job_title , users.office_location,
		COUNT(*) OVER() AS total_count
      FROM inventory_logs l
      JOIN items i ON l.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
	  LEFT JOIN users ON l.created_by = users.id
      WHERE 1=1
    `
      const params = []

      if (item_id) {
        params.push(item_id)
        query += ` AND l.item_id = $${params.length}`
      }
      if (category_id) {
        params.push(category_id)
        query += ` AND i.category_id = $${params.length}`
      }
      if (start_date) {
        params.push(start_date)
        query += ` AND l.created_at >= $${params.length}`
      }
      if (end_date) {
        params.push(`${end_date} 23:59:59`)
        query += ` AND l.created_at <= $${params.length}`
      }

      query += ` ORDER BY l.created_at DESC, l.id DESC `

      params.push(limit)
      query += ` LIMIT $${params.length}`

      params.push(offset)
      query += ` OFFSET $${params.length}`

      const result = await db.query(query, params)

      const totalItems = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0
      const totalPages = Math.ceil(totalItems / limit)
      const logs = result.rows.map((row) => {
        const { ...data } = row
        return data
      })

      return res.json({
        success: true,
        inventory_log: logs,
        pagination: {
          total_items: totalItems,
          total_pages: totalPages,
          current_page: page,
          limit: limit,
        },
      })
    } catch (error) {
      console.log('Get inventory log error:', error)
      return res.status(500).json({
        success: false,
        message: 'Database Error',
      })
    }
  })
  return router
}
