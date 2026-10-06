import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'ecommerce.db');

let dbWrapperInstance = null;

class DatabaseWrapper {
  constructor(sqlDb) {
    this.db = sqlDb;
    this.inTransaction = false;
  }

  save() {
    if (this.inTransaction) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (e) {
      console.error('Failed to save SQLite database to disk:', e);
    }
  }

  async get(sql, params = []) {
    const stmt = this.db.prepare(sql);
    try {
      if (params && params.length > 0) stmt.bind(params);
      if (stmt.step()) {
        return stmt.getAsObject();
      }
      return null;
    } finally {
      stmt.free();
    }
  }

  async all(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const rows = [];
    try {
      if (params && params.length > 0) stmt.bind(params);
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  async run(sql, params = []) {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('BEGIN')) {
      this.inTransaction = true;
      this.db.exec(sql);
      return { lastID: 0, changes: 0 };
    }
    if (trimmed.startsWith('COMMIT') || trimmed.startsWith('ROLLBACK')) {
      this.inTransaction = false;
      this.db.exec(sql);
      this.save();
      return { lastID: 0, changes: 0 };
    }
    if (trimmed.startsWith('PRAGMA')) {
      this.db.exec(sql);
      return { lastID: 0, changes: 0 };
    }

    const stmt = this.db.prepare(sql);
    try {
      if (params && params.length > 0) stmt.bind(params);
      stmt.step();

      const lastIdRes = this.db.exec('SELECT last_insert_rowid() as id');
      const changesRes = this.db.exec('SELECT changes() as ch');

      const lastID = (lastIdRes[0] && lastIdRes[0].values[0] && lastIdRes[0].values[0][0]) || 0;
      const changes = (changesRes[0] && changesRes[0].values[0] && changesRes[0].values[0][0]) || 0;

      this.save();
      return { lastID, changes };
    } finally {
      stmt.free();
    }
  }

  async exec(sql) {
    this.db.exec(sql);
    this.save();
  }

  async prepare(sql) {
    const self = this;
    return {
      async run(...params) {
        return self.run(sql, params);
      },
      async finalize() {
        // no-op
      }
    };
  }
}

/**
 * Initializes and returns the SQLite database connection.
 * Persists directly to data/ecommerce.db using pure WASM SQLite.
 * 100% portable, requires no native C++ bindings or GLIBC dependencies.
 */
export async function getDb() {
  if (dbWrapperInstance) {
    return dbWrapperInstance;
  }

  const SQL = await initSqlJs();

  let sqlDb;
  if (fs.existsSync(dbPath)) {
    try {
      const filebuffer = fs.readFileSync(dbPath);
      sqlDb = new SQL.Database(filebuffer);
    } catch {
      sqlDb = new SQL.Database();
    }
  } else {
    sqlDb = new SQL.Database();
  }

  dbWrapperInstance = new DatabaseWrapper(sqlDb);

  // Enable foreign keys
  await dbWrapperInstance.run('PRAGMA foreign_keys = ON;');

  // Apply schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await dbWrapperInstance.exec(schemaSql);

  return dbWrapperInstance;
}

export default getDb;
