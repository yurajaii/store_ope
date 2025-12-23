import express from 'express'

const router = express.Router()

export default function Category(db) {
  router.get('/', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM categories')
      for (let index = 0; index < result.length; index++) {
        console.log(result.rows[index]);
        
      }

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
    const { category, subcategory, created_by } = req.body
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
      INSERT INTO categories (category, subcategory, created_at, created_by)
      VALUES ($1, $2,$3,$4)
      RETURNING *
      `,
        [category, subcategory, date, created_by]
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

  return router
}
