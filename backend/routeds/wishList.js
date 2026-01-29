import express from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

export default function WishList(db) {
  router.get('/', requireAuth, async (req, res) => {
    console.log('User object from Passport:', req.user)
    const userId = req.user?.oid

    if (!userId) {
      return res.status(401).json({ message: 'User identity not found in token' })
    }
    const result = await db.query(
      `
      SELECT 
        f.item_id,
        f.default_quantity,
        i.name,
        i.unit
      FROM item_favorites f
      JOIN items i ON i.id = f.item_id
      WHERE f.user_id = $1
      ORDER BY i.name
      `,
      [userId]
    )

    res.json(result.rows)
  })

  router.post('/', async (req, res) => {
    const { item_id, user_id, quantity } = req.body

    try {
      await db.query(
        `
      INSERT INTO item_favorites (user_id, item_id, default_quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, item_id)
      DO UPDATE
      SET default_quantity =
        item_favorites.default_quantity + EXCLUDED.default_quantity
      `,
        [user_id, item_id, quantity]
      )

      return res.status(201).json({ success: true })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ success: false })
    }
  })

  router.patch('/:itemId', async (req, res) => {
    const itemId = req.params.itemId
    const { user_id, default_quantity } = req.body

    await db.query(
      `
      UPDATE item_favorites
      SET default_quantity = $1
      WHERE user_id = $2 AND item_id = $3
      `,
      [default_quantity, user_id, itemId]
    )

    res.json({ success: true })
  })

  router.delete('/:itemId', async (req, res) => {
    const user_id = req.body?.user_id || 2
    const itemId = req.params.itemId

    await db.query(
      `
      DELETE FROM item_favorites
      WHERE user_id = $1 AND item_id = $2
      `,
      [user_id, itemId]
    )

    res.json({ success: true })
  })

  return router
}
