/**
 * OIDC Configuration for Google and SDV (WSO2) providers.
 * Both providers share the same callback flow and produce the same user session shape.
 */

export const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
  scope: ['email', 'profile'],
}

export const sdvConfig = {
  clientId: process.env.OIDC_CLIENT_ID || process.env.SDV_CLIENT_ID,
  clientSecret: process.env.OIDC_CLIENT_SECRET || process.env.SDV_CLIENT_SECRET,
  callbackURL: process.env.OIDC_CALLBACK_URL || process.env.SDV_CALLBACK_URL || 'http://localhost:3000/api/auth/sdv/callback',
  domain: process.env.OIDC_DOMAIN || process.env.SDV_OIDC_DOMAIN,
  providerName: process.env.OIDC_PROVIDER_NAME || process.env.SDV_PROVIDER_NAME || 'SDV SSO',
  // Derived WSO2 endpoints (identical to NextAuth oidcProvider_sdv configuration)
  get authorizationURL() {
    return `${this.domain}/oauth2/authorize`
  },
  get tokenURL() {
    return `${this.domain}/oauth2/token`
  },
  get userInfoURL() {
    return `${this.domain}/oauth2/userinfo`
  },
  get issuer() {
    return `${this.domain}/oauth2/token`
  },
}

/**
 * Map raw OIDC profile to normalized user object.
 * Perfectly aligns with WSO2 claims (formattedName, enFormattedName, sub, email, picture)
 * and Google OIDC standard claims.
 */
export function normalizeProfile(profile, provider) {
  const raw = profile._json || profile

  return {
    id: `${provider}|${profile.id || raw.sub}`,
    // Exactly like NextAuth oidcProvider_sdv profile(): formattedName || enFormattedName || sub
    name: raw.formattedName || raw.enFormattedName || profile.displayName || raw.name || raw.given_name || raw.sub,
    email: raw.email || profile.emails?.[0]?.value,
    avatar: raw.picture || profile.photos?.[0]?.value || null,
    provider,
  }
}
