"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
async function runMigrations() {
    const pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL,
    });
    try {
        // Create migrations table if it doesn't exist
        await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Get all migration files
        const migrationsDir = path_1.default.join(__dirname, 'migrations');
        const files = await fs_1.promises.readdir(migrationsDir);
        const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
        // Get executed migrations
        const { rows: executedMigrations } = await pool.query('SELECT name FROM migrations');
        const executedNames = new Set(executedMigrations.map(m => m.name));
        // Run pending migrations
        for (const file of sqlFiles) {
            if (!executedNames.has(file)) {
                console.log(`Running migration: ${file}`);
                const sql = await fs_1.promises.readFile(path_1.default.join(migrationsDir, file), 'utf-8');
                await pool.query(sql);
                await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                console.log(`Completed migration: ${file}`);
            }
        }
        console.log('All migrations completed successfully');
    }
    catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
    finally {
        await pool.end();
    }
}
// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations().catch(console.error);
}
