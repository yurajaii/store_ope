import { useState, useEffect } from 'react'
import axios from 'axios'

export default function WithdrawPage() {
  const [withdraw, setWithdraw] = useState([])
  const API_URL = import.meta.env.VITE_API_URL
  const fetchWithdran = async () => {
    try {
      const res = await axios.get(`${API_URL}/withdraw`)
      setWithdraw(res.data.withdrawn)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchWithdran()
  }, [])
  return (
    <>
      <div>Withdraw Page</div>
    </>
  )
}
