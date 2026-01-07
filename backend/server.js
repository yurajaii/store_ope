import express from 'express'
import cors from 'cors'
import { getDb } from './db.js'
import Category from './routeds/categories.js'
import ItemList from './routeds/items.js'
import InventoryList from './routeds/inventories.js'
import Withdraw from './routeds/withdraw.js'
import WishList from './routeds/wishList.js'

const port = 3000
const app = express()
app.use(express.json())
const db = getDb()

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
)

app.get('/', (req, res) => {
  res.json('OPE invenotory management')
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

app.use('/category', Category(db))
app.use('/items', ItemList(db))
app.use('/inventory', InventoryList(db))
app.use('/withdraw', Withdraw(db))
app.use('/wishlist', WishList(db))
