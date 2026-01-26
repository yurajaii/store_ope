import express from 'express'
import cors from 'cors'
import { getDb } from './db.js'
import Category from './routeds/categories.js'
import ItemList from './routeds/items.js'
import InventoryList from './routeds/inventories.js'
import Withdraw from './routeds/withdraw.js'
import WishList from './routeds/wishList.js'
import Reported from './routeds/reports.js'
import  Admin  from './routeds/admin.js'
import passport from 'passport'
import { bearerStrategy } from './config/azureAuth.js'

const port = 3000
const app = express()
const db = getDb()

app.use(express.json())
passport.use(bearerStrategy)
app.use(passport.initialize())

app.use(
  cors({
    origin: '*',
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
app.use('/reports', Reported(db))
app.use('/auth', Admin(db))
