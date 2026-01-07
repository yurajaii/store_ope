import express from 'express'

const router = express.Router()

export default function ItemList(db) {
  router.get('/', async (req, res) => {
    try {
      const result = await db.query(`SELECT *
      FROM inventories AS inv
      LEFT JOIN items AS i ON inv.item_id = i.id
      LEFT JOIN categories AS c ON i.category_id = c.id`)

      return res.json({
        success: true,
        items: result.rows,
      })
    } catch (error) {
      console.log('Get item error:', error)
      return res.status(500).json({
        success: false,
        message: 'Database Error',
      })
    }
  })

  router.post('/', async (req, res) => {
    const { category_id, name, unit } = req.body
    const createdBy = req.user?.id ?? 1

    if (!category_id || !name || !unit) {
      return res.status(400).json({
        success: false,
        message: 'category_id, name, unit are required',
      })
    }

    const client = await db.connect()

    try {
      await client.query('BEGIN')

      const categoryRes = await client.query('SELECT id FROM categories WHERE id = $1', [
        category_id,
      ])

      if (categoryRes.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        })
      }

      const itemRes = await client.query(
        `
      INSERT INTO items (category_id, name, unit, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
        [category_id, name, unit, createdBy]
      )

      const itemId = itemRes.rows[0].id

      await client.query(
        `
      INSERT INTO inventories (item_id,location_id, quantity)
      VALUES ($1, 1, 0)
      `,
        [itemId]
      )

      await client.query('COMMIT')

      return res.status(201).json({
        success: true,
        item_id: itemId,
      })
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Create item error:', error)

      return res.status(500).json({
        success: false,
        message: 'Database Error',
      })
    } finally {
      client.release()
    }
  })

  router.patch('/:id/delete', async (req, res) => {
    const id = req.params.id

    try {
      const result = await db.query(`SELECT COUNT(*) FROM items WHERE id = $1 AND is_active`, [id])

      if (result.rows[0].count == 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        })
      }

      await db.query(
        `
        UPDATE items
        SET is_active = false
        WHERE id = $1
        `,
        [id]
      )

      return res.json({ success: true, message: `Completely Delete item NO.${id}` })
    } catch (error) {
      console.error('Create item error:', error)
      return res.status(500).json({
        success: false,
        message: 'Database Error',
      })
    }
  })

  router.patch('/:id/restore', async (req, res) => {
    const id = req.params.id

    try {
      const result = await db.query(
        `SELECT COUNT(*) FROM items WHERE id = $1 AND is_active = false `,
        [id]
      )
      if (result.rows[0].count == 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        })
      }

      await db.query(
        `
        UPDATE items
        SET is_active = true
        WHERE id = $1
        `,
        [id]
      )

      return res.json({ success: true, message: `Completely Delete item NO.${id}` })
    } catch (error) {
      console.error('Create item error:', error)
      return res.status(500).json({
        success: false,
        message: 'Database Error',
      })
    }
  })
  return router
}
