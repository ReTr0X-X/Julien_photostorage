import mysql from 'mysql2/promise';
import crypto from 'crypto';

// Get database connection settings from environment variables
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'ems_vault',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Password hashing utility using Node's native crypto
export function hashPassword(password) {
  const salt = 'ems_vault_secret_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// Initialize Database (Tables & Seed Data)
export async function initDB() {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password
  });

  try {
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
  } catch (err) {
    console.error('Failed to ensure database exists:', err.message);
  } finally {
    await connection.end();
  }

  const dbPool = getPool();

  // Clean up any old structure
  try {
    await dbPool.query('DROP TABLE IF EXISTS media;');
    await dbPool.query('DROP TABLE IF EXISTS incidents;');
    await dbPool.query('DROP TABLE IF EXISTS car_media;');
    await dbPool.query('DROP TABLE IF EXISTS cars;');
  } catch (err) {
    console.log('[DB] Info: Cleanup of old tables complete.');
  }

  // 1. Users Table
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(150) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      avatar_path VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // Migration: Ensure users table has name, email, and avatar_path columns
  try {
    await dbPool.query('ALTER TABLE users ADD COLUMN name VARCHAR(150) DEFAULT NULL AFTER password_hash;');
    console.log('[DB] Migration: Added name column to users.');
  } catch (err) {}
  try {
    await dbPool.query('ALTER TABLE users ADD COLUMN email VARCHAR(255) DEFAULT NULL AFTER name;');
    console.log('[DB] Migration: Added email column to users.');
  } catch (err) {}
  try {
    await dbPool.query('ALTER TABLE users ADD COLUMN avatar_path VARCHAR(255) DEFAULT NULL AFTER email;');
    console.log('[DB] Migration: Added avatar_path column to users.');
  } catch (err) {}

  // 2. Car Photos Table (Unified table for timeline & description vault)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS car_photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      env ENUM('irl', 'rp') NOT NULL,
      category VARCHAR(100) NOT NULL,
      subfolder VARCHAR(100) DEFAULT NULL,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      date_taken VARCHAR(50) NOT NULL,
      location VARCHAR(100) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      filepath VARCHAR(255) NOT NULL,
      filetype ENUM('image', 'video', 'document') NOT NULL,
      filesize INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // Migration: Ensure subfolder column exists in car_photos table
  try {
    await dbPool.query('ALTER TABLE car_photos ADD COLUMN subfolder VARCHAR(100) DEFAULT NULL AFTER category;');
    console.log('[DB] Migration: Added subfolder column to car_photos.');
  } catch (err) {
    // Column might already exist or error, ignore
  }

  // Ensure category column is VARCHAR(100) for custom categories compatibility
  try {
    await dbPool.query('ALTER TABLE car_photos MODIFY COLUMN category VARCHAR(100) NOT NULL;');
  } catch (err) {
    console.log('[DB] Info: category column modify skipped or already VARCHAR.');
  }

  // 2.0 Subfolders Table (For subdirectories inside categories)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS subfolders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      name VARCHAR(100) NOT NULL,
      env ENUM('irl', 'rp') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_subfolder (category, name, env)
    ) ENGINE=InnoDB;
  `);

  // 2.1 Categories Table (For custom categories)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      emoji VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // Seed default categories if missing
  try {
    const [existingCategories] = await dbPool.query('SELECT * FROM categories');
    if (existingCategories.length === 0) {
      await dbPool.query(`
        INSERT INTO categories (name, emoji) VALUES 
        ('politie', '👮'), 
        ('brandweer', '🚒'), 
        ('ambulance', '🚑')
      `);
      console.log('[DB] Seeded default categories.');
    }
  } catch (err) {
    console.error('[DB] Failed to seed categories:', err.message);
  }

  // 2.1 Share Tokens Table (maps sharing links to specific photos)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS share_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      token VARCHAR(100) UNIQUE NOT NULL,
      photo_id INT NOT NULL,
      created_by VARCHAR(50) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      revoked TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // 3. Seed Default Users if missing
  const [officerUsers] = await dbPool.query('SELECT * FROM users WHERE username = ?', ['officer']);
  if (officerUsers.length === 0) {
    const defaultUser = 'officer';
    const defaultPass = 'evidence2026';
    const hash = hashPassword(defaultPass);
    await dbPool.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [defaultUser, hash]);
    console.log(`[DB] Seeded default user: "${defaultUser}"`);
  }

  const [devUsers] = await dbPool.query('SELECT * FROM users WHERE username = ?', ['dev']);
  if (devUsers.length === 0) {
    const devUser = 'dev';
    const devPass = 'devpass2026';
    const hash = hashPassword(devPass);
    await dbPool.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [devUser, hash]);
    console.log(`[DB] Seeded dev user: "${devUser}"`);
  }

  // 4. Clean up any pre-existing legacy mock photos
  try {
    const [result] = await dbPool.query('DELETE FROM car_photos WHERE filepath LIKE "%/mock/%"');
    if (result && result.affectedRows > 0) {
      console.log(`[DB] Removed ${result.affectedRows} legacy mock records from database.`);
    }
  } catch (err) {
    console.error('[DB] Error cleaning up legacy mock records:', err.message);
  }
}

// Wrapper for queries
export async function query(sql, params) {
  const dbPool = getPool();
  const [results] = await dbPool.query(sql, params);
  return results;
}
