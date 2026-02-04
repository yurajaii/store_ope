import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

//  ############################# ตัวจัดการ msal เป็น template จาก doc ค่ะ ไม่ต้องพยามหาคำตอบว่าเขียนยังไง #############################
// สร้าง instant สำหรับการใช้งานในฝั่ง client (browser) แบบโยนข้ามไปข้ามมาใน component ได้ ใช้คู่กับ Provider (React hook - useProvider)
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
// config สำหรับสร้าง instant PublicClientApplicatio
import { msalConfig } from './authConfig'
// axios interpreter เอาไว้ฉีด instant เข้าไปในฟังชั่น เพราะ instant มันเป็น object ต้องดึงค่าออกจาก account(object) ด้วย method ก่อนจะยัดเข้าตัวแปรที่ต้องการ รวมไปถึงดึง token ออกมา
import { injectMsalInstance } from './Utils/api'

//  ############################# Context สำหรับจัดการ User #############################
import { UserProvider } from './Context/UserContext'




const msalInstance = new PublicClientApplication(msalConfig)

msalInstance.initialize().then(() => {
  injectMsalInstance(msalInstance)

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
