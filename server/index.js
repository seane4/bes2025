/**
 * Banff Energy Summit 2025 - Backend Server
 * 
 * This is the main entry point for the Banff Energy Summit backend API server.
 * It handles database connections, routing, and serves the API endpoints.
 */

// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Import routes
const ordersRoutes = require('./api/orders');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully');
    // Run migrations if needed
    runMigrations();
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for all origins (configure as needed)
app.use(morgan('dev')); // HTTP request logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API routes
app.use('/api/v1/orders', ordersRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

/**
 * Run database migrations
 * 
 * This function runs all SQL migration files in the migrations directory
 * in the correct order based on their filename.
 */
async function runMigrations() {
  const client = await pool.connect();
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of applied migrations
    const { rows } = await client.query('SELECT name FROM migrations');
    const appliedMigrations = rows.map(row => row.name);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'db', 'migrations');
    let migrationFiles = [];
    
    try {
      migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Sort by filename
    } catch (error) {
      console.error('Error reading migrations directory:', error);
      return;
    }

    // Apply migrations that haven't been applied yet
    for (const file of migrationFiles) {
      if (!appliedMigrations.includes(file)) {
        try {
          const filePath = path.join(migrationsDir, file);
          const sql = fs.readFileSync(filePath, 'utf8');
          
          await client.query('BEGIN');
          console.log(`Applying migration: ${file}`);
          await client.query(sql);
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          
          console.log(`Migration applied successfully: ${file}`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`Error applying migration ${file}:`, error);
          throw error;
        }
      }
    }
    
    console.log('All migrations applied successfully');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    client.release();
  }
}

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('Graceful shutdown initiated...');
  
  // Close database pool
  pool.end(() => {
    console.log('Database pool has ended');
    process.exit(0);
  });
  
  // Force exit if pool doesn't close in time
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
} 