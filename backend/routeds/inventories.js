import express from 'express'

const router = express.Router()

export default function InventoryList(db) {
  router.get('/', async (req, res) => {
    try {
      const inv = await db.query(`
      SELECT i.item_id,items."name",i.quantity,items.unit
      FROM inventories AS i
      LEFT JOIN items ON items.id = i.item_id
      LEFT JOIN categories AS c ON c.id = items.category_id
      WHERE items.is_active = true
      `)
      return res.json({
        success: true,
        inventory: inv.rows,
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
  const { item_id, type, quantity } = req.body
  const createdBy = req.user?.id ?? null

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

  // quantity rule
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
        message: 'Item not found',
      })
    }

    const currentQty = itemRes.rows[0].quantity
    let delta = 0

    // ===== inventory effect =====
    if (type === 'IN') {
      delta = quantity
    }

    if (type === 'OUT') {
      if (currentQty < quantity) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock',
        })
      }
      delta = -quantity
    }

    if (type === 'RETURN') {
      // คืนของ = เพิ่ม stock
      delta = quantity
    }

    if (type === 'ADJUST') {
      // quantity เป็น signed (+ / -)
      if (currentQty + quantity < 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock',
        })
      }
      delta = quantity
    }
    // ============================

    await client.query(
      `
      INSERT INTO inventory_logs (item_id, type, quantity, created_by)
      VALUES ($1, $2, $3, $4)
      `,
      [item_id, type, quantity, createdBy]
    )

    await client.query(
      `
      UPDATE inventories
      SET quantity = quantity + $1
      WHERE item_id = $2
      `,
      [delta, item_id]
    )

    await client.query('COMMIT')

    return res.json({
      success: true,
      message: 'Inventory log saved',
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return res.status(500).json({ success: false })
  } finally {
    client.release()
  }
})


  return router
}
