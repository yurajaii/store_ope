// C:\Users\UTCC\UTCC\store_ope\backend\middleware\auth.js
import passport from 'passport'

export const requireAuth = passport.authenticate('oauth-bearer', { 
  session: false 
})