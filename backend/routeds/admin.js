import express from 'express'
import jwt from 'jsonwebtoken'
import axios from 'axios'

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

  router.get('/me', async (req, res) => {
    try {
      const authHeader = req.headers['authorization']
      const token = authHeader?.split(' ')[1]
      if (!token) return res.status(401).json({ message: 'No token' })

      const decoded = jwt.decode(token)
      const azureId = decoded.oid

      // 1. ลองหา User ใน DB ก่อน
      let userResult = await db.query('SELECT * FROM users WHERE id = $1', [azureId])
      let userData = userResult.rows[0]

      // 2. ถ้าไม่เจอ (เป็น User ใหม่) ให้ยิงไปเอาข้อมูลจาก Azure แล้วบันทึก
      if (!userData) {
        console.log('New User detected! Fetching from Azure...')

        const graphRes = await axios.get('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${token}` },
        })

        const { displayName, mail, jobTitle, officeLocation } = graphRes.data

        // บันทึกลง DB (สมมติ Role เริ่มต้นเป็น 'user')
        const insertResult = await db.query(
          'INSERT INTO users (id, display_name, email, role, job_title, office_location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [
            azureId,
            displayName,
            mail || decoded.preferred_username,
            'user',
            jobTitle,
            officeLocation,
          ]
        )
        userData = insertResult.rows[0]
      }

      // 3. ตอบกลับด้วยข้อมูลจาก DB (ซึ่งตอนนี้มีชัวร์ๆ แล้ว)
      return res.json({
        success: true,
        user: userData,
      })
    } catch (error) {
      console.error('Flow error:', error)
      res.status(500).send('Server Error')
    }
  })
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
