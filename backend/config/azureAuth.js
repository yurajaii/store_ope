import { BearerStrategy } from 'passport-azure-ad'
import process from 'process'

const options = {
  identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration`,
  clientID: process.env.AZURE_CLIENT_ID,
  validateIssuer: true,
  issuer: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`,
  passReqToCallback: false,
  loggingLevel: 'info',
  scope: ['User.Read'],
}

export const bearerStrategy = new BearerStrategy(options, (token, done) => {
  // Token ที่ verified แล้วจะอยู่ในตัวแปร token
  // token.oid = Azure Object ID ของ user
  return done(null, token, token)
})
