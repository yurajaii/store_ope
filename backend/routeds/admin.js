import express from 'express'
import jwt from 'jsonwebtoken'

const router = express.Router()

export default function AdminRoute(db) {
  router.get('/', async (req, res) => {
    try {
      const authHeader = req.headers['authorization']
      const token = authHeader && authHeader.split(' ')[1]

      if (!token) {
        return res.status(401).json({ success: false, message: 'No token' })
      }

      // ✅ แค่ decode (ไม่ verify)
      const decoded = jwt.decode(token)

      if (!decoded || !decoded.oid) {
        return res.status(401).json({ success: false, message: 'Invalid token' })
      }

      const azureId = decoded.oid
      const userEmail = decoded.preferred_username || decoded.email
      const userName = decoded.name

      const result = await db.query('SELECT * FROM users WHERE id = $1', [azureId])

      return res.json({
        success: true,
        id: azureId,
        email: userEmail,
        name: userName,
        items: result.rows[0].role,
      })
    } catch (error) {
      console.error('API error:', error)
      return res.status(500).json({ success: false, message: 'Server Error' })
    }
  })

  return router
}
