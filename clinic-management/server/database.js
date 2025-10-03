const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/clinic.db');

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      reject(new Error('Schema file not found'));
      return;
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema as one transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Split the schema into individual statements and filter out empty ones
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      statements.forEach((statement, index) => {
        if (statement.trim()) {
          db.run(statement + ';', (err) => {
            if (err && !err.message.includes('already exists') && !err.message.includes('UNIQUE constraint failed')) {
              console.error(`Error executing statement ${index + 1}:`, err.message);
              console.error('Statement:', statement.substring(0, 100) + '...');
            }
          });
        }
      });
      
      db.run('COMMIT', (err) => {
        if (err) {
          console.error('Transaction failed:', err);
          db.run('ROLLBACK');
          reject(err);
        } else {
          console.log('Database initialized successfully');
          db.close();
          resolve();
        }
      });
    });
  });
};

module.exports = { initializeDatabase };