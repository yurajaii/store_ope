import express from 'express'

const router = express.Router()

export default function ItemList(db) {
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const offset = (page - 1) * limit
  
  // รับ query parameters
  const searchQuery = req.query.search || ''
  const categoryId = req.query.category_id || null
  const mainCategory = req.query.main_category || null

  try {
    // สร้าง WHERE clause แบบ dynamic
    let whereConditions = []
    let queryParams = []
    let paramIndex = 1

    // Filter by search (ชื่อหรือ item_id)
    if (searchQuery) {
      whereConditions.push(`(i.name ILIKE $${paramIndex} OR i.id::text LIKE $${paramIndex})`)
      queryParams.push(`%${searchQuery}%`)
      paramIndex++
    }

    // Filter by category_id (หมวดย่อย)
    if (categoryId) {
      whereConditions.push(`i.category_id = $${paramIndex}`)
      queryParams.push(categoryId)
      paramIndex++
    }

    // Filter by main category (หมวดหลัก)
    if (mainCategory) {
      whereConditions.push(`c.category = $${paramIndex}`)
      queryParams.push(mainCategory)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : ''

    // Query ข้อมูล
    const dataQuery = `
      SELECT inv.*, i.name, i.unit, i.is_active, i.min_threshold, i.max_threshold, 
             c.category, c.subcategory, i.category_id
      FROM inventories AS inv
      LEFT JOIN items AS i ON inv.item_id = i.id
      LEFT JOIN categories AS c ON i.category_id = c.id
      ${whereClause}
      ORDER BY inv.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    queryParams.push(limit, offset)
    const dataResult = await db.query(dataQuery, queryParams)

    // นับจำนวนทั้งหมดที่ตรงกับ filter
    const countQuery = `
      SELECT COUNT(*) 
      FROM inventories AS inv
      LEFT JOIN items AS i ON inv.item_id = i.id
      LEFT JOIN categories AS c ON i.category_id = c.id
      ${whereClause}
    `
    const countResult = await db.query(countQuery, queryParams.slice(0, -2))
    
    const totalItems = parseInt(countResult.rows[0].count)
    const totalPages = Math.ceil(totalItems / limit)

    return res.json({
      success: true,
      items: dataResult.rows,
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


  router.post('/', async (req, res) => {
    const { category_id, name, unit, min_threshold, max_threshold } = req.body
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
      INSERT INTO items (category_id, name, unit, created_by, min_threshold, max_threshold)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
        [category_id, name, unit, createdBy, min_threshold, max_threshold]
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

  router.patch('/:id', async (req, res) => {
    const id = req.params.id
    const { category_id, name, unit, min_threshold, max_threshold } = req.body

    try {
      const checkItem = await db.query('SELECT id FROM items WHERE id = $1', [id])
      if (checkItem.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Item not found',
        })
      }

      const query = `
      UPDATE items 
      SET 
        category_id = $1, 
        name = $2, 
        unit = $3, 
        min_threshold = $4, 
        max_threshold = $5
      WHERE id = $6
      RETURNING *
    `
      const values = [category_id, name, unit, min_threshold || 0, max_threshold || 0, id]

      const result = await db.query(query, values)

      return res.json({
        success: true,
        message: 'อัปเดตข้อมูลพัสดุเรียบร้อยแล้ว',
        data: result.rows[0],
      })
    } catch (error) {
      console.error('Update item error:', error)
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล',
        error: error.message,
      })
    }
  })

  return router
}
