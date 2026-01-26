import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 1. Import สิ่งที่จำเป็นเพิ่ม
import { PublicClientApplication, EventType } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './authConfig'
import { UserProvider } from './Context/UserContext'
// 2. สร้าง instance ของ MSAL
const msalInstance = new PublicClientApplication(msalConfig)

// 3. ตั้งค่า Default Account (เลือกบัญชีที่ล็อกอินล่าสุดเป็นบัญชีหลัก)
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
    const account = event.payload.account
    msalInstance.setActiveAccount(account)
  }
})

// 4. ครอบ App ด้วย MsalProvider
msalInstance.initialize().then(() => {
  // Handle redirect promise
  msalInstance.handleRedirectPromise().then((response) => {
    if (response && response.account) {
      msalInstance.setActiveAccount(response.account)
    }
  })

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <UserProvider>
          <App />
        </UserProvider>
      </MsalProvider>
    </StrictMode>
  )
})