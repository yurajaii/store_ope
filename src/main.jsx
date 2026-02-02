import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { PublicClientApplication, EventType } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './authConfig'
import { UserProvider } from './Context/UserContext'
import { injectMsalInstance } from './Utils/api'


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
