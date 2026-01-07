import express from 'express'

const router = express.Router()

export default function Category(db) {
  router.get('/', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM categories')
      return res.json({
        success: true,
        categories: result.rows,
      })
    } catch (error) {
      console.error('Get category error:', error)

      return res.status(500).json({
        success: false,
        message: 'Database Error',
      })
    }
  })

  router.post('/', async (req, res) => {
    const { category, subcategory, created_by, icon } = req.body
    const date = new Date().toISOString().split('T')
    if (!category || !subcategory) {
      return res.status(400).json({
        success: false,
        message: 'category and subcategory are required',
      })
    }

    try {
      const result = await db.query(
        `
      INSERT INTO categories (category, subcategory, created_at, created_by,icon)
      VALUES ($1, $2,$3,$4, $5)
      RETURNING *
      `,
        [category, subcategory, date, created_by, icon]
      )

      return res.status(201).json({
        success: true,
        category: result.rows[0],
      })
    } catch (error) {
      console.error('Create category error:', error)

      return res.status(500).json({
        success: false,
        message: 'Database Error',
      })
    }
  })

  router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { category, subcategory, icon, updated_by } = req.body
    const updated_at = new Date().toISOString().split('T')

    if (!category || !subcategory) {
      return res.status(400).json({
        success: false,
        message: 'category and subcategory are required',
      })
    }

    try {
      const check = await db.query('SELECT id FROM categories WHERE id = $1', [id])

      if (check.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        })
      }

      const result = await db.query(
        `
      UPDATE categories
      SET
        category = $1,
        subcategory = $2,
        icon = $3,
        updated_at = $4,
        updated_by = $5
      WHERE id = $6
      RETURNING *
      `,
        [category, subcategory, icon, updated_at, updated_by, id]
      )

      return res.json({
        success: true,
        category: result.rows[0],
      })
    } catch (error) {
      console.error('Update category error:', error)

      return res.status(500).json({
        success: false,
        message: 'Database Error',
      })
    }
  })

  return router
}
