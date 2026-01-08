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

  // Updated withdraw approve route with inventory deduction + logs

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

      // เก็บข้อมูล item ที่อัพเดทเพื่อใช้ตอนตัดสต็อก (item_id, approved_quantity)
      const itemsToDeduct = []

      // 1. อัพเดททุก item พร้อมกัน
      for (const item of items) {
        // ดึงข้อมูล withdraw_item (เพิ่ม item_id)
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

        // กำหนด status
        let status = 'approved'
        if (item.approved_quantity === 0) {
          status = 'rejected'
        } else if (item.approved_quantity < requestedQty) {
          status = 'partial'
        }

        // อ��พเดท withdraw_item
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

        // เก็บข้อมูลสำหรับตัดสต็อกภายหลัง (เฉพาะกรณี approved_quantity > 0)
        if (item.approved_quantity > 0) {
          itemsToDeduct.push({
            withdraw_item_id: item.withdraw_item_id,
            item_id: withdrawItemRow.item_id,
            approved_quantity: item.approved_quantity,
          })
        }
      }

      // 2. เช็คว่าทุก item ใน withdraw นี้ถูก review หรือยัง
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

      // 3. ถ้า review ครบทุก item แล้ว → อัพเดทสถานะ withdraw
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

        // ถ้าเป็น APPROVED ให้ตัดสต็อกจาก inventories และเขียน inventory_logs
        if (withdrawStatus === 'APPROVED') {
          for (const it of itemsToDeduct) {
            const { item_id, approved_quantity } = it

            // พยายามหาบันทึก inventories ที่มีสต็อกเพียงพอแล้วหักออกในคำสั่งเดียว (ป้องกัน race)
            const invUpdate = await client.query(
              `UPDATE inventories
             SET quantity = quantity - $1
             WHERE item_id = $2 AND quantity >= $1
             RETURNING id, quantity`,
              [approved_quantity, item_id]
            )

            if (invUpdate.rowCount === 0) {
              // ไม่พอสต็อก -> rollback ทั้งหมด
              throw new Error(
                `Not enough inventory for item ${item_id} to deduct ${approved_quantity}`
              )
            }

            // เพิ่ม log การเคลื่อนไหว
            await client.query(
              `INSERT INTO inventory_logs (item_id, type, quantity, created_at, created_by)
             VALUES ($1, $2, $3, NOW(), $4)`,
              [item_id, 'OUT', approved_quantity, approved_by]
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
      // ดึงข้อมูลใบเบิก
      const withdrawResult = await db.query('SELECT * FROM withdraws WHERE id = $1', [id])

      if (withdrawResult.rows.length === 0) {
        return res.status(404).json({ error: 'Withdraw not found' })
      }

      const withdraw = withdrawResult.rows[0]

      // ดึงรายการสินค้าพร้อม stock
      const itemsResult = await db.query(
        `
      SELECT 
        wi.id AS withdraw_item_id,
        wi.item_id,
        wi.quantity AS requested_quantity,
        wi.approved_quantity,
        wi.rejected_quantity,
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
  return router
}
