import express from 'express'

const router = express.Router()

export default function Reported(db) {
  router.get('/card', async (req, res) => {
    try {
      const total_quantity = await db.query(
        `
      SELECT SUM(quantity) FROM inventories`
      )

      const pending_withdraw = await db.query(
        `
      SELECT COUNT(*) FROM withdraws
      WHERE status = 'REQUESTED'
        `
      )

      const dead_stock = await db.query(
        `
        SELECT * FROM items
        WHERE id NOT IN (
            SELECT invl.item_id 
            FROM inventory_logs AS invl
            WHERE invl.type = 'OUT'
        ) 
        AND created_at < NOW() - INTERVAL '30' DAY;
        `
      )

      const low_stock = await db.query(
        `
        SELECT COUNT(*) from inventories AS inv
        LEFT JOIN items AS i ON i.id = inv.item_id
        WHERE inv.quantity < i.min_threshold AND inv.quantity > 0
        `
      )

      const result = [
        { label: 'จำนวนพัสดุทั้งหมด', value: total_quantity.rows[0].sum || 0, unit: 'ชิ้น' },
        { label: 'รออนุมัติการเบิก', value: pending_withdraw.rows[0].count, unit: 'รายการ' },
        { label: 'สินค้าค้างสต็อก', value: dead_stock.rows.length, unit: 'รายการ' },
        { label: 'สินค้าใกล้หมด', value: low_stock.rows[0].count, unit: 'รายการ' },
      ]

      return res.json({
        success: true,
        result: result,
      })
    } catch (error) {
      console.log('Get report error:', error)
      return res.status(500).json({})
    }
  })

  router.get('/usage-trend', async (req, res) => {
    // 1. ตั้งค่า Default กรณีไม่ได้ส่ง startDate/endDate มา
    const now = new Date()
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString() // ต้นเดือนนี้
    const defaultEnd = now.toISOString() // วันนี้

    const {
      startDate = defaultStart,
      endDate = defaultEnd,
      category_id,
      item_id,
      groupBy = 'day',
    } = req.query

    const allowedScales = ['day', 'week', 'month']
    const timeScale = allowedScales.includes(groupBy) ? groupBy : 'day'

    // 2. จัดการ Parameter ให้คงที่
    // ใช้ $1, $2 เป็นหลักเสมอสำหรับ Date
    let queryParams = [startDate, endDate]
    let categoryFilter = ''
    let itemFilter = ''

    if (category_id) {
      queryParams.push(category_id)
      categoryFilter = `AND i.category_id = $${queryParams.length}`
    }

    if (item_id) {
      queryParams.push(item_id)
      itemFilter = `AND il.item_id = $${queryParams.length}`
    }

    const query = `
    WITH daily_summaries AS (
        SELECT 
            DATE_TRUNC('${timeScale}', il.created_at) AS time_bucket,
            SUM(il.quantity) AS total_qty
        FROM inventory_logs il
        JOIN items i ON il.item_id = i.id
        WHERE il.type = 'OUT'
          AND il.created_at BETWEEN $1 AND $2
          ${categoryFilter}
          ${itemFilter}
        GROUP BY 1
    ),
    baseline AS (
        SELECT AVG(total_qty) as period_avg FROM daily_summaries
    )
    SELECT 
        d.time_bucket,
        d.total_qty as actual_usage,
        ROUND((d.total_qty / NULLIF(b.period_avg, 0)) * 100, 2) as usage_index
    FROM daily_summaries d, baseline b
    ORDER BY d.time_bucket ASC;
  `

    try {
      // ไม่ใช้ .filter(Boolean) เพราะจะทำให้ตำแหน่ง $x เพี้ยน
      const result = await db.query(query, queryParams)
      res.json({ success: true, result: result.rows })
    } catch (error) {
      console.error('SQL Error:', error)
      res.status(500).json({ success: false, message: error.message })
    }
  })

  router.get('/top-turnover', async (req, res) => {
    // ตั้งค่า Default ย้อนหลัง 30 วัน ถ้าไม่ได้ส่งวันที่มา
    const now = new Date()
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const defaultEnd = now.toISOString()

    const { startDate = defaultStart, endDate = defaultEnd } = req.query

    const query = `
    SELECT 
        i.name, 
        SUM(il.quantity) as total_out,
        COUNT(il.id) as transaction_count
    FROM inventory_logs il
    JOIN items i ON il.item_id = i.id
    WHERE il.type = 'OUT' 
      AND il.created_at BETWEEN $1 AND $2
    GROUP BY i.name
    ORDER BY total_out DESC
  `

    try {
      // ส่งพารามิเตอร์ $1 และ $2 เสมอ
      const result = await db.query(query, [startDate, endDate])
      res.json({ success: true, result: result.rows })
    } catch (error) {
      console.error('Top Turnover Error:', error)
      res.status(500).json({ success: false, message: error.message })
    }
  })

  router.get('/deadstock', async (req, res) => {
    const { days } = req.query
    const query = `
    SELECT i.id, i.name, i.category_id, MAX(il.created_at) as last_withdraw
    FROM items i
    LEFT JOIN inventory_logs il ON i.id = il.item_id AND il.type = 'OUT'
    JOIN inventories inv ON i.id = inv.item_id WHERE inv.quantity > 0
    GROUP BY i.id, i.name, i.category_id
    HAVING MAX(il.created_at) < NOW() - INTERVAL '${days} days' 
       OR MAX(il.created_at) IS NULL
    ORDER BY last_withdraw ASC;
  `
    const result = await db.query(query)
    res.json({ success: true, result: result.rows })
  })

  return router
}
