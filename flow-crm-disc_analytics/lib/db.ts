import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'disc_data', 'disc.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initializeDatabase(): void {
  const database = getDb();

  // Create data_search table
  database.exec(`
    CREATE TABLE IF NOT EXISTS data_search (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT NOT NULL,
      county TEXT NOT NULL,
      fips_code TEXT NOT NULL,
      category TEXT NOT NULL,
      year INTEGER NOT NULL,
      value REAL NOT NULL
    )
  `);

  // Create market_track table
  database.exec(`
    CREATE TABLE IF NOT EXISTS market_track (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      fips_code TEXT NOT NULL,
      category TEXT NOT NULL,
      year INTEGER NOT NULL,
      value REAL NOT NULL
    )
  `);

  // Create indexes for better query performance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_data_search_state ON data_search(state);
    CREATE INDEX IF NOT EXISTS idx_data_search_category ON data_search(category);
    CREATE INDEX IF NOT EXISTS idx_data_search_year ON data_search(year);
    CREATE INDEX IF NOT EXISTS idx_data_search_fips ON data_search(fips_code);

    CREATE INDEX IF NOT EXISTS idx_market_track_section ON market_track(section);
    CREATE INDEX IF NOT EXISTS idx_market_track_category ON market_track(category);
    CREATE INDEX IF NOT EXISTS idx_market_track_year ON market_track(year);
    CREATE INDEX IF NOT EXISTS idx_market_track_fips ON market_track(fips_code);
  `);
}

export function importDataSearchCSV(): void {
  const database = getDb();
  const csvPath = path.join(process.cwd(), 'disc_data', 'data_search_melted.csv');

  // Check if data already exists
  const count = database.prepare('SELECT COUNT(*) as count FROM data_search').get() as { count: number };
  if (count.count > 0) {
    console.log('data_search table already has data, skipping import');
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');

  const insert = database.prepare(`
    INSERT INTO data_search (state, county, fips_code, category, year, value)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = database.transaction((rows: string[][]) => {
    for (const row of rows) {
      insert.run(row[0], row[1], row[2], row[3], parseInt(row[4]), parseFloat(row[5]));
    }
  });

  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const parts = line.split(',');
      if (parts.length >= 6) {
        rows.push(parts);
      }
    }
  }

  insertMany(rows);
  console.log(`Imported ${rows.length} rows into data_search`);
}

export function importMarketTrackCSV(): void {
  const database = getDb();
  const csvPath = path.join(process.cwd(), 'disc_data', 'market_track_data_melted.csv');

  // Check if data already exists
  const count = database.prepare('SELECT COUNT(*) as count FROM market_track').get() as { count: number };
  if (count.count > 0) {
    console.log('market_track table already has data, skipping import');
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');

  const insert = database.prepare(`
    INSERT INTO market_track (section, description, location, fips_code, category, year, value)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = database.transaction((rows: string[][]) => {
    for (const row of rows) {
      insert.run(row[0], row[1], row[2], row[3], row[4], parseInt(row[5]), parseFloat(row[6]));
    }
  });

  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const parts = line.split(',');
      if (parts.length >= 7) {
        rows.push(parts);
      }
    }
  }

  // Process in batches of 10000 for large files
  const batchSize = 10000;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    insertMany(batch);
    console.log(`Imported batch ${Math.floor(i / batchSize) + 1} (${Math.min(i + batchSize, rows.length)} / ${rows.length} rows)`);
  }

  console.log(`Imported ${rows.length} rows into market_track`);
}

export function ensureDbInitialized(): void {
  initializeDatabase();
  importDataSearchCSV();
  importMarketTrackCSV();
}
