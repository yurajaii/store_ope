import { BearerStrategy } from 'passport-azure-ad'
import process from 'process'

// config/azureAuth.js
const options = {
  identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration`,
  clientID: 'f759d6b0-6c0b-4316-ad63-84ba6492af49', 
  audience: 'api://f759d6b0-6c0b-4316-ad63-84ba6492af49', 
  validateIssuer: false,
  loggingLevel: 'info', 
  passReqToCallback: false,
};


export const bearerStrategy = new BearerStrategy(options, (token, done) => {
  // สร้าง object user ขึ้นมาใหม่และยัด oid ใส่ไปในชื่อ id
  const user = {
    ...token,
    id: token.oid 
  };
  return done(null, user, token);
});
