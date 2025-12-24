import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SideBar from './components/SideBar'
import HomePage from './Pages/Home/HomePage'
import CategoryPage from './Pages/Category/CategoryPage'
import Package from './Pages/Item/ItemPage'
import LogPage from './Pages/Log/LogPage'
import WithdrawPage from './Pages/Withdraw/WithdrawPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="w-full h-screen bg-gray-100 font-[prompt] flex">
        <SideBar />

        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/items" element={<Package />} />
            <Route path="/items" element={<Package />} />
            <Route path="/withdraw" element={<WithdrawPage />} />
            <Route path="/logs" element={<LogPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
