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

  return router
}
