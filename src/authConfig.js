export const msalConfig = {
  auth: {
    clientId: 'd2206ccb-7382-4434-95e6-5024bedaf481',
    authority: 'https://login.microsoftonline.com/0ecb7c82-1b84-4b36-adef-2081b5c1125b',
    redirectUri: 'http://localhost:5173/',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
}

// สิทธิ์ที่ขอเรียกใช้ (Scopes)
export const loginRequest = {
  scopes: ['User.Read','api://f759d6b0-6c0b-4316-ad63-84ba6492af49/access_as_user'],
}
