import { Pool } from 'pg';

// Create a connection pool instead of individual connections
const pool = new Pool({
  connectionString: process.env.RAILWAY_HCAD_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Connection pool settings
  max: 20,                    // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection cannot be established
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// Keep the connection alive
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.error('Keep-alive query failed:', error);
  }
}, 30000); // Ping every 30 seconds

export default pool;