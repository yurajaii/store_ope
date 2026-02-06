import express from 'express'

const router = express.Router()

export default function Withdraw(db) {
  router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const search = req.query.search || ''
    const offset = (page - 1) * limit

    try {
      let query = `SELECT * FROM withdraws WHERE status != 'CANCELED'`
      let countQuery = `SELECT COUNT(*) FROM withdraws WHERE status != 'CANCELED'`

      let rows = []
      let totalItems = 0

      if (search) {
        const filter = ` AND (
        id::text ILIKE $1 
        OR topic->>'fullname' ILIKE $1 
        OR topic->>'purpose' ILIKE $1 
        OR topic->>'project' ILIKE $1
      )`

        const result = await db.query(
          `${query} ${filter} ORDER BY created_at DESC LIMIT $2::int OFFSET $3::int`,
          [`%${search}%`, limit, offset]
        )
        const countResult = await db.query(`${countQuery} ${filter}`, [`%${search}%`])

        // 2. กำหนดค่าเข้าไป (ไม่ต้องใส่ var/let/const ข้างหน้าแล้ว)
        rows = result.rows
        totalItems = parseInt(countResult.rows[0].count)
      } else {
        const result = await db.query(
          `${query} ORDER BY created_at DESC LIMIT $1::int OFFSET $2::int`,
          [limit, offset]
        )
        const countResult = await db.query(countQuery)

        rows = result.rows
        totalItems = parseInt(countResult.rows[0].count)
      }

      const totalPages = Math.ceil(totalItems / limit)

      return res.json({
        success: true,
        withdrawn: rows,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
        },
      })
    } catch (error) {
      console.error('Get withdraw error:', error)
      return res.status(500).json({ success: false, message: 'Database Error' })
    }
  })

  router.post('/', async (req, res) => {
    const { items, topic } = req.body
    const requestedBy = req.user?.id ?? 2

    if (!requestedBy) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required',
      })
    }

    const client = await db.connect()

    try {
      await client.query('BEGIN')

      const withdrawRes = await client.query(
        `
      INSERT INTO withdraws (requested_by, status,topic)
      VALUES ($1, 'REQUESTED',$2)
      RETURNING id
      `,
        [requestedBy, topic]
      )

      const withdrawId = withdrawRes.rows[0].id

      for (const item of items) {
        if (!item.item_id || item.quantity <= 0) {
          throw new Error('Invalid item data')
        }

        await client.query(
          `
        INSERT INTO withdraw_items (withdraw_id, item_id, quantity)
        VALUES ($1, $2, $3)
        `,
          [withdrawId, item.item_id, item.quantity]
        )
      }

      await client.query('COMMIT')

      return res.status(201).json({
        success: true,
        withdraw_id: withdrawId,
        item: items,
      })
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Create withdraw error:', error.message)

      return res.status(500).json({
        success: false,
        message: 'Database Error',
      })
    } finally {
      client.release()
    }
  })

  router.post('/:withdrawId/approve', async (req, res) => {
    const { withdrawId } = req.params
    const { items, note } = req.body
    const approved_by = req.user?.id || 1

    /*
  items: [
    { withdraw_item_id: 8, approved_quantity: 9, reject_reason: null },
    { withdraw_item_id: 9, approved_quantity: 3, reject_reason: 'สต็อกไม่เพียงพอ' },
    { withdraw_item_id: 10, approved_quantity: 10, reject_reason: null }
  ]
  */

    const client = await db.connect()

    try {
      await client.query('BEGIN')

      const itemsToDeduct = []

      for (const item of items) {
        const withdrawItemRes = await client.query(
          `SELECT quantity, withdraw_id, item_id
         FROM withdraw_items
         WHERE id = $1 AND withdraw_id = $2
         FOR UPDATE`,
          [item.withdraw_item_id, withdrawId]
        )

        if (withdrawItemRes.rows.length === 0) {
          throw new Error(`Item ${item.withdraw_item_id} not found in withdraw ${withdrawId}`)
        }

        const withdrawItemRow = withdrawItemRes.rows[0]
        const requestedQty = withdrawItemRow.quantity
        const rejectedQty = requestedQty - item.approved_quantity

        let status = 'approved'
        if (item.approved_quantity === 0) {
          status = 'rejected'
        } else if (item.approved_quantity < requestedQty) {
          status = 'partial'
        }

        await client.query(
          `UPDATE withdraw_items
         SET status = $1,
             approved_quantity = $2,
             rejected_quantity = $3,
             approved_at = NOW(),
             approved_by = $4,
             reject_reason = $5
         WHERE id = $6`,
          [
            status,
            item.approved_quantity,
            rejectedQty,
            approved_by,
            item.reject_reason,
            item.withdraw_item_id,
          ]
        )

        if (item.approved_quantity > 0) {
          itemsToDeduct.push({
            withdraw_item_id: item.withdraw_item_id,
            item_id: withdrawItemRow.item_id,
            approved_quantity: item.approved_quantity,
          })
        }
      }

      const summary = await client.query(
        `SELECT
         COUNT(*) as total,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
         COALESCE(SUM(approved_quantity), 0) as total_approved
       FROM withdraw_items
       WHERE withdraw_id = $1`,
        [withdrawId]
      )

      const { pending_count, total_approved } = summary.rows[0]

      if (parseInt(pending_count) === 0) {
        const withdrawStatus = parseInt(total_approved) > 0 ? 'APPROVED' : 'REJECTED'

        await client.query(
          `UPDATE withdraws
         SET status = $1,
             approved_by = $2,
             approved_at = NOW(),
             approved_note = $3
         WHERE id = $4`,
          [withdrawStatus, approved_by, note, withdrawId]
        )

        if (withdrawStatus === 'APPROVED') {
          for (const it of itemsToDeduct) {
            const { item_id, approved_quantity } = it

            const invUpdate = await client.query(
              `UPDATE inventories
               SET quantity = quantity - $1
               WHERE item_id = $2 AND quantity >= $1
               RETURNING quantity`,
              [approved_quantity, item_id]
            )

            if (invUpdate.rowCount === 0) {
              throw new Error(
                `สต็อกสินค้า ID ${item_id} ไม่เพียงพอ (ต้องการหักออก ${approved_quantity})`
              )
            }

            const newBalance = invUpdate.rows[0].quantity

            await client.query(
              `INSERT INTO inventory_logs 
               (item_id, type, quantity, created_at, created_by, reference_id, balance_after, remark)
               VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7)`,
              [
                item_id,
                'OUT',
                approved_quantity,
                approved_by,
                `ใบเบิกหมายเลข-#${withdrawId}`,
                newBalance,
                note || '',
              ]
            )
          }
        }

        await client.query('COMMIT')

        return res.json({
          success: true,
          withdraw_status: withdrawStatus,
          items_processed: items.length,
          message: `ใบเบิก #${withdrawId} ได้รับการพิจารณาครบถ้วนแล้ว (${withdrawStatus})`,
        })
      } else {
        await client.query('COMMIT')

        return res.json({
          success: true,
          withdraw_status: 'REQUESTED',
          items_processed: items.length,
          items_remaining: parseInt(pending_count),
          message: `ยังมี ${pending_count} รายการที่ต้องพิจารณา`,
        })
      }
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Approval error:', error.message)

      return res.status(500).json({
        success: false,
        message: 'Database Error',
        error: error.message,
      })
    } finally {
      client.release()
    }
  })

  // GET /api/withdraw/:id - รายละเอียดใบเบิก
  router.get('/:id', async (req, res) => {
    const { id } = req.params

    try {
      const withdrawResult = await db.query('SELECT * FROM withdraws WHERE id = $1', [id])

      if (withdrawResult.rows.length === 0) {
        return res.status(404).json({ error: 'Withdraw not found' })
      }

      const withdraw = withdrawResult.rows[0]
      const itemsResult = await db.query(
        `
      SELECT 
        wi.id AS withdraw_item_id,
        wi.item_id,
        wi.quantity AS requested_quantity,
        wi.approved_quantity,
        wi.rejected_quantity,
        wi.returned_quantity,
        wi.status,
        wi.reject_reason,
        
        i.name,
        i.unit,
       
        
        c.category,
        
        COALESCE(SUM(inv.quantity), 0) AS stock_quantity
        
      FROM withdraw_items wi
      JOIN items i ON wi.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN inventories inv ON i.id = inv.item_id
      WHERE wi.withdraw_id = $1
      GROUP BY wi.id, i.id, c.id
      ORDER BY wi.id
    `,
        [id]
      )

      withdraw.items = itemsResult.rows

      res.json({ withdraw })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Database error' })
    }
  })

  router.patch('/:id/cancel', async (req, res) => {
    const { id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const client = await db.connect()

    try {
      await client.query('BEGIN')

      const checkQuery = 'SELECT status FROM withdraws WHERE id = $1'
      const result = await client.query(checkQuery, [id])

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'ไม่พบรายการเบิกนี้' })
      }

      const currentStatus = result.rows[0].status

      if (currentStatus === 'APPROVED') {
        return res
          .status(400)
          .json({ success: false, message: 'ไม่สามารถยกเลิกรายการที่อนุมัติแล้วได้' })
      }

      if (currentStatus === 'CANCLED') {
        return res
          .status(400)
          .json({ success: false, message: 'รายการนี้ถูกยกเลิกไปก่อนหน้านี้แล้ว' })
      }

      const updateQuery = `
      UPDATE withdraws 
      SET 
        status = 'CANCELED',
        approved_by = $2,
        approved_at = NOW(),
        approved_note = 'ยกเลิกใบเบิกโดยผู้ใช้งาน'
      WHERE id = $1 
      RETURNING id, status, approved_at;
    `
      const updatedResult = await client.query(updateQuery, [id, userId])

      const updateItemsQuery = `
      UPDATE withdraw_items 
      SET 
        status = 'cancelled', 
        reject_reason = 'ใบเบิกถูกยกเลิกโดยผู้ใช้งาน',
        approved_by = $2,
        approved_at = NOW()
      WHERE withdraw_id = $1 AND status = 'pending'; 
    `
      await client.query(updateItemsQuery, [id, userId])
      const itemsResult = await client.query(
        'SELECT * FROM withdraw_items WHERE withdraw_id = $1',
        [id]
      )
      await client.query('COMMIT')

      return res.status(200).json({
        success: true,
        message: 'ยกเลิกรายการเบิกและรายการสินค้าที่ค้างอยู่เรียบร้อยแล้ว',
        data: updatedResult.rows[0],
        items: itemsResult.rows,
      })
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Cancel withdraw error:', error.message)
      return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล' })
    } finally {
      client.release()
    }
  })
  return router
}
