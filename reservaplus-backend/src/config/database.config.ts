// src/config/database.config.ts
export const databaseConfig = () => ({
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'reservaplus_user',
    password: process.env.DB_PASSWORD ||'21',
    name: process.env.DB_NAME || 'reservaplus_dev',
  },
});
