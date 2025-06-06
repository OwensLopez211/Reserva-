// src/config/auth.config.ts
export const authConfig = () => ({
  auth: {
    auth0Domain: process.env.AUTH0_DOMAIN || 'your-tenant.auth0.com',
    auth0Audience: process.env.AUTH0_AUDIENCE || 'https://api.reservaplus.com',
    auth0ClientId: process.env.AUTH0_CLIENT_ID || 'your-client-id',
    auth0ClientSecret: process.env.AUTH0_CLIENT_SECRET || 'your-client-secret',
    auth0ManagementToken: process.env.AUTH0_MANAGEMENT_API_TOKEN || 'your-management-token',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
});
