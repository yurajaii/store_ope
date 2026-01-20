import express from 'express'

const router = express.Router()

export default function Reported(db) {
  router.get('/', async (req, res) => {
    try {
      const report = await db.query(
        `
      SELECT COUNT(*) AS total_items FROM items`,
        []
      )
      return res.json({
        success: true,
        report: report.rows,
      })
    } catch (error) {
      console.log('Get report error:', error)
      return res.status(500).json({})
    }
  })
  return router
}
