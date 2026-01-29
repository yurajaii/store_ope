import express from 'express'
import passport from 'passport'

const router = express.Router()

export default function AdminRoute(db) {
  router.get('/', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM users ')

      return res.json({
        success: true,
        users: result.rows,
      })
    } catch (error) {
      console.error('API error:', error)
      return res.status(500).json({ success: false, message: 'Server Error' })
    }
  })

  router.post(
    '/me',
    passport.authenticate('oauth-bearer', { session: false }),
    async (req, res) => {
      try {
        // ข้อมูลจาก Token ที่ passport ตรวจสอบให้แล้วจะอยู่ใน req.user
        const azureId = req.user.oid

        // ข้อมูลโปรไฟล์ที่ React ส่งมาให้ใน Body
        const { displayName, mail, jobTitle, officeLocation } = req.body

        // 1. ลองหา User ใน DB
        let userResult = await db.query('SELECT * FROM users WHERE id = $1', [azureId])
        let userData = userResult.rows[0]

        // 2. ถ้าไม่เจอ (User ใหม่) หรือต้องการอัปเดตข้อมูลให้เป็นปัจจุบัน
        if (!userData) {
          console.log('New User detected! Saving to database...')

          const insertResult = await db.query(
            `INSERT INTO users (id, display_name, email, role, job_title, office_location) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
            [
              azureId,
              displayName,
              mail || req.user.preferred_username, // ใช้จาก body หรือถ้าไม่มีใช้จาก token
              'user', // Role เริ่มต้น
              jobTitle,
              officeLocation,
            ]
          )
          userData = insertResult.rows[0]
        } else {
          // (Optional) อัปเดตข้อมูลเผื่อมีการเปลี่ยนชื่อหรือตำแหน่งใน Azure
          await db.query('UPDATE users SET display_name = $1, job_title = $2 WHERE id = $3', [
            displayName,
            jobTitle,
            azureId,
          ])
        }

        // 3. ตอบกลับด้วยข้อมูลจาก DB
        return res.json({
          success: true,
          user: userData,
        })
      } catch (error) {
        console.error('❌ Backend Sync Error:', error)
        res.status(500).json({ success: false, message: 'Server Error' })
      }
    }
  )
  // ในไฟล์ routes ของคุณ (เช่น auth.js หรือ users.js)
  router.patch('/:id/role', async (req, res) => {
    const { id } = req.params
    const { role } = req.body

    // ตรวจสอบเบื้องต้น (ตัวอย่าง role ที่เรามี 3 role)
    const validRoles = ['system_admin', 'user_admin', 'user']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' })
    }

    try {
      const query = `
      UPDATE users 
      SET role = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *;
    `
      const result = await db.query(query, [role, id])

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'User not found' })
      }

      return res.json({
        success: true,
        message: 'Role updated successfully',
        user: result.rows[0],
      })
    } catch (error) {
      console.error('Update Role Error:', error)
      return res.status(500).json({ success: false, message: 'Server Error' })
    }
  })

  return router
}
