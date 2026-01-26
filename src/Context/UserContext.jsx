// src\Context\UserContext.jsx
import React, { useState } from 'react'
import { UserContext } from './UserContextInstance'

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = () => setUser(null)

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        logout,
        loading,
        setLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
