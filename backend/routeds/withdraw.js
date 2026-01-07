import express from 'express'

const router = express.Router()

export default function Withdraw(db) {
  // ==============================================================================================================
  router.get('/', async (req, res) => {
    const result = await db.query(` 
      SELECT * FROM withdraws`)
    return res.json({
      success: true,
      withdrawn: result.rows,
    })
  })
  // ==============================================================================================================
  router.post('/', async (req, res) => {
    const { items, requestedBy, topic } = req.body

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

      // 1️⃣ create withdraw
      const withdrawRes = await client.query(
        `
      INSERT INTO withdraws (requested_by, status,topic)
      VALUES ($1, 'REQUESTED',$2)
      RETURNING id
      `,
        [requestedBy, topic]
      )

      const withdrawId = withdrawRes.rows[0].id

      // 2️⃣ insert withdraw_items
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

  return router
}
