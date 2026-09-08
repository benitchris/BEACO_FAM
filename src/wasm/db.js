import initSqlJs from 'sql.js';

let db = null;
const STORAGE_KEY = 'BEACO_FARM_WASM_SQLITE_DB';

// Default schema and seed dataset extracted directly from beaco_farm.sql
const DEFAULT_SQL_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Employee',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chicken_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS chickens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chicken_code TEXT,
    category_id INTEGER,
    breed TEXT,
    quantity INTEGER NOT NULL,
    age_in_weeks INTEGER,
    date_added DATE,
    status TEXT DEFAULT 'Active',
    FOREIGN KEY (category_id) REFERENCES chicken_categories(id)
);

CREATE TABLE IF NOT EXISTS egg_production (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_date DATE NOT NULL,
    category_id INTEGER,
    eggs_collected INTEGER DEFAULT 0,
    broken_eggs INTEGER DEFAULT 0,
    remaining_eggs INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES chicken_categories(id)
);

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    sale_date DATE,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS feed_management (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feed_name TEXT,
    quantity DECIMAL(10,2),
    consumed_kg DECIMAL(10,2) DEFAULT 0,
    remaining_kg DECIMAL(10,2) DEFAULT 0,
    purchase_date DATE
);

CREATE TABLE IF NOT EXISTS vaccinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vaccine_name TEXT,
    vaccination_date DATE,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS mortality (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    death_date DATE,
    category_id INTEGER,
    quantity INTEGER,
    cause_of_death TEXT,
    FOREIGN KEY (category_id) REFERENCES chicken_categories(id)
);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT,
    quantity INTEGER,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const INITIAL_SEED_DATA = `
INSERT INTO chicken_categories (id, category_name, description) VALUES
(1, 'Layers', 'Egg-producing chickens'),
(2, 'Broilers', 'Meat-producing chickens'),
(3, 'Chicks', 'Young chickens'),
(4, 'Breeders', 'Parent chickens');

INSERT INTO users (full_name, username, password, role) VALUES
('Administrator', 'admin', 'admin123', 'Administrator');

-- Initial farm data
INSERT INTO chickens (chicken_code, category_id, breed, quantity, age_in_weeks, date_added, status) VALUES
('CHK-101', 1, 'Lohmann Brown', 450, 24, '2026-01-15', 'Active'),
('CHK-102', 2, 'Cobb 500', 300, 8, '2026-02-01', 'Active'),
('CHK-103', 3, 'Day-old Chicks', 200, 2, '2026-02-20', 'Active');

INSERT INTO egg_production (production_date, category_id, eggs_collected, broken_eggs, remaining_eggs) VALUES
('2026-03-01', 1, 380, 10, 370),
('2026-03-02', 1, 395, 8, 387),
('2026-03-03', 1, 410, 5, 405),
('2026-03-04', 1, 400, 12, 388),
('2026-03-05', 1, 420, 6, 414);

INSERT INTO customers (customer_name, phone, address) VALUES
('Kigali Fresh Market', '+250 788 123 456', 'Kigali City Center'),
('Rwanda Poultry Distributors', '+250 783 987 654', 'Musanze District'),
('Hotel des Mille Collines', '+250 788 555 111', 'Kigali');

INSERT INTO sales (customer_id, quantity, unit_price, total_amount, sale_date) VALUES
(1, 1000, 150.00, 150000.00, '2026-03-02'),
(2, 500, 160.00, 80000.00, '2026-03-04'),
(3, 300, 170.00, 51000.00, '2026-03-05');

INSERT INTO feed_management (feed_name, quantity, consumed_kg, remaining_kg, purchase_date) VALUES
('Layer Mash', 1000.00, 350.00, 650.00, '2026-02-10'),
('Broiler Starter', 500.00, 200.00, 300.00, '2026-02-15');

INSERT INTO vaccinations (vaccine_name, vaccination_date, notes) VALUES
('Newcastle Disease Vaccine', '2026-02-05', 'Administered via drinking water to all layers'),
('Gumboro (IBD)', '2026-02-18', 'Booster dose for chicks cohort');

INSERT INTO mortality (death_date, category_id, quantity, cause_of_death) VALUES
('2026-02-25', 1, 3, 'Heat stress'),
('2026-03-02', 3, 2, 'Natural causes');
`;

export async function initWasmDatabase() {
  if (db) return db;

  try {
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });

    const savedDbBase64 = localStorage.getItem(STORAGE_KEY);
    if (savedDbBase64) {
      const binaryArray = Uint8Array.from(atob(savedDbBase64), c => c.charCodeAt(0));
      db = new SQL.Database(binaryArray);
      console.log('BEACO FARM: SQLite WASM Database loaded from LocalStorage.');
    } else {
      db = new SQL.Database();
      db.run(DEFAULT_SQL_SCHEMA);
      db.run(INITIAL_SEED_DATA);
      saveDatabaseState();
      console.log('BEACO FARM: SQLite WASM Database initialized with default schema.');
    }
  } catch (err) {
    console.error('Failed to load SQLite WASM engine:', err);
    // Fallback in-memory
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    db = new SQL.Database();
    db.run(DEFAULT_SQL_SCHEMA);
    db.run(INITIAL_SEED_DATA);
  }

  return db;
}

export function saveDatabaseState() {
  if (!db) return;
  try {
    const data = db.export();
    const base64 = btoa(String.fromCharCode.apply(null, data));
    localStorage.setItem(STORAGE_KEY, base64);
  } catch (e) {
    console.error('Error persisting database state to LocalStorage:', e);
  }
}

export function resetToDefaults() {
  localStorage.removeItem(STORAGE_KEY);
  db = null;
  return initWasmDatabase();
}

export function runQuery(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    saveDatabaseState();
    return results;
  } catch (err) {
    console.error('SQL Execution Error:', err, sql);
    throw err;
  }
}

export function executeSql(sql) {
  if (!db) throw new Error('Database not initialized');
  db.run(sql);
  saveDatabaseState();
}

// Data helper functions
export function getFarmMetrics() {
  const chickens = runQuery("SELECT COALESCE(SUM(quantity), 0) as total FROM chickens")[0]?.total || 0;
  const eggs = runQuery("SELECT COALESCE(SUM(eggs_collected), 0) as total FROM egg_production")[0]?.total || 0;
  const customers = runQuery("SELECT COUNT(*) as total FROM customers")[0]?.total || 0;
  const revenue = runQuery("SELECT COALESCE(SUM(total_amount), 0) as total FROM sales")[0]?.total || 0;
  const deaths = runQuery("SELECT COALESCE(SUM(quantity), 0) as total FROM mortality")[0]?.total || 0;
  const feed = runQuery("SELECT COALESCE(SUM(quantity), 0) as total_purchased, COALESCE(SUM(consumed_kg), 0) as total_consumed, COALESCE(SUM(remaining_kg), 0) as total_remaining FROM feed_management")[0] || { total_purchased: 0, total_consumed: 0, total_remaining: 0 };

  const mortalityRate = chickens > 0 ? ((deaths / chickens) * 100).toFixed(2) : 0;
  const survivalRate = chickens > 0 ? (((chickens - deaths) / chickens) * 100).toFixed(2) : 100;
  const eggsPerChicken = chickens > 0 ? (eggs / chickens).toFixed(2) : 0;

  let overallStatus = "GOOD PERFORMANCE";
  if (mortalityRate > 5 || feed.total_remaining <= 0) {
    overallStatus = "ATTENTION REQUIRED";
  } else if (eggsPerChicken >= 5) {
    overallStatus = "EXCELLENT PERFORMANCE";
  }

  return {
    totalChickens: chickens,
    totalEggs: eggs,
    totalCustomers: customers,
    totalRevenue: revenue,
    totalDeaths: deaths,
    feedPurchased: feed.total_purchased,
    feedConsumed: feed.total_consumed,
    feedRemaining: feed.total_remaining,
    mortalityRate,
    survivalRate,
    eggsPerChicken,
    overallStatus
  };
}
