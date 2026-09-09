import initSqlJs from 'sql.js';

let db = null;
const STORAGE_KEY = 'BEACON_FAM_WASM_SQLITE_DB_v4';

// Determine base path for WASM file (works both locally and on GitHub Pages)
const BASE_URL = import.meta.env.BASE_URL || '/';

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

-- Chicken sheds / buildings
CREATE TABLE IF NOT EXISTS buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_name TEXT NOT NULL,
    capacity INTEGER DEFAULT 0,
    description TEXT
);

CREATE TABLE IF NOT EXISTS chickens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chicken_code TEXT,
    category_id INTEGER,
    building_id INTEGER,
    breed TEXT,
    quantity INTEGER NOT NULL,
    age_in_weeks INTEGER,
    date_added DATE,
    status TEXT DEFAULT 'Active',
    FOREIGN KEY (category_id) REFERENCES chicken_categories(id),
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Egg production now tracks per building
CREATE TABLE IF NOT EXISTS egg_production (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_date DATE NOT NULL,
    category_id INTEGER,
    building_id INTEGER,
    eggs_collected INTEGER DEFAULT 0,
    broken_eggs INTEGER DEFAULT 0,
    remaining_eggs INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES chicken_categories(id),
    FOREIGN KEY (building_id) REFERENCES buildings(id)
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
    building_id INTEGER,
    quantity INTEGER,
    cause_of_death TEXT,
    FOREIGN KEY (category_id) REFERENCES chicken_categories(id)
);

-- Workers / Employees
CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    daily_rate DECIMAL(10,2) DEFAULT 0,
    phone TEXT,
    start_date DATE,
    status TEXT DEFAULT 'Active'
);

-- Worker wage payments
CREATE TABLE IF NOT EXISTS worker_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    days_worked INTEGER DEFAULT 1,
    amount_paid DECIMAL(10,2) NOT NULL,
    notes TEXT,
    FOREIGN KEY (worker_id) REFERENCES workers(id)
);

-- Construction & equipment expenses
CREATE TABLE IF NOT EXISTS construction_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_date DATE NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'Construction',
    amount DECIMAL(10,2) NOT NULL,
    vendor TEXT,
    notes TEXT
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

-- Three chicken sheds/buildings
INSERT INTO buildings (id, building_name, capacity, description) VALUES
(1, 'Building A', 600, 'Main layer house - East Wing'),
(2, 'Building B', 400, 'Broiler house - Central Unit'),
(3, 'Building C', 300, 'Chick nursery - West Wing');

INSERT INTO users (full_name, username, password, role) VALUES
('System Administrator', 'admin', 'admin@123', 'Admin'),
('Sales Manager', 'sales', 'sales@123', 'Sales'),
('Construction Lead', 'construction', 'construction@123', 'Construction');

INSERT INTO chickens (chicken_code, category_id, building_id, breed, quantity, age_in_weeks, date_added, status) VALUES
('CHK-101', 1, 1, 'Lohmann Brown', 450, 24, '2026-01-15', 'Active'),
('CHK-102', 2, 2, 'Cobb 500', 300, 8, '2026-02-01', 'Active'),
('CHK-103', 3, 3, 'Day-old Chicks', 200, 2, '2026-02-20', 'Active');

INSERT INTO egg_production (production_date, category_id, building_id, eggs_collected, broken_eggs, remaining_eggs) VALUES
('2026-03-01', 1, 1, 380, 10, 370),
('2026-03-01', 1, 2, 210, 5, 205),
('2026-03-01', 1, 3, 90, 3, 87),
('2026-03-02', 1, 1, 395, 8, 387),
('2026-03-02', 1, 2, 215, 4, 211),
('2026-03-02', 1, 3, 95, 2, 93),
('2026-03-03', 1, 1, 410, 5, 405),
('2026-03-03', 1, 2, 220, 6, 214),
('2026-03-03', 1, 3, 100, 1, 99);

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

INSERT INTO mortality (death_date, category_id, building_id, quantity, cause_of_death) VALUES
('2026-02-25', 1, 1, 3, 'Heat stress'),
('2026-03-02', 3, 3, 2, 'Natural causes');

-- Workers
INSERT INTO workers (full_name, role, daily_rate, phone, start_date, status) VALUES
('Jean Baptiste Mugabo', 'Farm Supervisor', 8000.00, '+250 788 111 222', '2025-01-10', 'Active'),
('Marie Claire Uwimana', 'Layer House Attendant', 5000.00, '+250 782 333 444', '2025-03-15', 'Active'),
('Eric Habimana', 'Feed & Watering Operator', 5000.00, '+250 783 555 666', '2025-06-01', 'Active'),
('Alice Mukamana', 'Egg Collector', 4500.00, '+250 789 777 888', '2026-01-05', 'Active');

-- Worker payments
INSERT INTO worker_payments (worker_id, payment_date, days_worked, amount_paid, notes) VALUES
(1, '2026-02-28', 28, 224000.00, 'February wages - Supervisor'),
(2, '2026-02-28', 28, 140000.00, 'February wages - Layer House'),
(3, '2026-02-28', 28, 140000.00, 'February wages - Feed Operator'),
(4, '2026-02-28', 26, 117000.00, 'February wages - Egg Collector (2 days off)');

-- Construction expenses
INSERT INTO construction_expenses (expense_date, description, category, amount, vendor, notes) VALUES
('2026-01-15', 'Roof repair - Building A', 'Repair', 450000.00, 'Kigali Construction Ltd', 'Iron sheets replacement'),
('2026-01-20', 'New feed storage silo', 'Construction', 850000.00, 'AgriBuilders Rwanda', 'Steel silo 5 tonne capacity'),
('2026-02-05', 'Water pipeline extension', 'Infrastructure', 320000.00, 'Plumbing Solutions Ltd', 'Extension to Building C'),
('2026-02-18', 'Solar panels installation', 'Equipment', 1200000.00, 'SolarTech Rwanda', '4kW off-grid system for farm');
`;

export async function initWasmDatabase() {
  if (db) return db;

  try {
    const SQL = await initSqlJs({
      locateFile: () => `${BASE_URL}sql-wasm.wasm`
    });

    const savedDbBase64 = localStorage.getItem(STORAGE_KEY);
    if (savedDbBase64) {
      try {
        let binary = atob(savedDbBase64);
        let len = binary.length;
        let bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        db = new SQL.Database(bytes);
        console.log('BEACON FAM: SQLite WASM Database loaded from LocalStorage.');
      } catch (loadErr) {
        console.warn('BEACON FAM: Saved LocalStorage DB corrupt or outdated, re-initializing fresh database...', loadErr);
        localStorage.removeItem(STORAGE_KEY);
        db = new SQL.Database();
        db.run(DEFAULT_SQL_SCHEMA);
        db.run(INITIAL_SEED_DATA);
        saveDatabaseState();
      }
    } else {
      db = new SQL.Database();
      db.run(DEFAULT_SQL_SCHEMA);
      db.run(INITIAL_SEED_DATA);
      saveDatabaseState();
      console.log('BEACON FAM: SQLite WASM Database initialized with default schema and seed data.');
    }
  } catch (err) {
    console.error('BEACON FAM: Failed to initialize SQLite WASM:', err);
    try {
      const SQL = await initSqlJs({ locateFile: () => `${BASE_URL}sql-wasm.wasm` });
      db = new SQL.Database();
      db.run(DEFAULT_SQL_SCHEMA);
      db.run(INITIAL_SEED_DATA);
    } catch (e) {
      console.error('Emergency DB initialization failed:', e);
    }
  }

  return db;
}

export function saveDatabaseState() {
  if (!db) return;
  try {
    const data = db.export();
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < data.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, data.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    localStorage.setItem(STORAGE_KEY, base64);
  } catch (e) {
    console.error('Error persisting database:', e);
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
    console.error('SQL Error:', err, sql);
    throw err;
  }
}

export function executeSql(sql) {
  if (!db) throw new Error('Database not initialized');
  db.run(sql);
  saveDatabaseState();
}

export function getFarmMetrics() {
  try {
    const chickens = runQuery("SELECT COALESCE(SUM(quantity), 0) as total FROM chickens")[0]?.total || 0;
    const eggs = runQuery("SELECT COALESCE(SUM(eggs_collected), 0) as total FROM egg_production")[0]?.total || 0;
    const customers = runQuery("SELECT COUNT(*) as total FROM customers")[0]?.total || 0;
    const revenue = runQuery("SELECT COALESCE(SUM(total_amount), 0) as total FROM sales")[0]?.total || 0;
    const deaths = runQuery("SELECT COALESCE(SUM(quantity), 0) as total FROM mortality")[0]?.total || 0;
    const feed = runQuery("SELECT COALESCE(SUM(quantity), 0) as total_purchased, COALESCE(SUM(consumed_kg), 0) as total_consumed, COALESCE(SUM(remaining_kg), 0) as total_remaining FROM feed_management")[0] || { total_purchased: 0, total_consumed: 0, total_remaining: 0 };
    const totalWages = runQuery("SELECT COALESCE(SUM(amount_paid), 0) as total FROM worker_payments")[0]?.total || 0;
    const totalConstruction = runQuery("SELECT COALESCE(SUM(amount), 0) as total FROM construction_expenses")[0]?.total || 0;
    const workerCount = runQuery("SELECT COUNT(*) as total FROM workers WHERE status = 'Active'")[0]?.total || 0;

    const mortalityRate = chickens > 0 ? ((deaths / chickens) * 100).toFixed(2) : 0;
    const survivalRate = chickens > 0 ? (((chickens - deaths) / chickens) * 100).toFixed(2) : 100;
    const eggsPerChicken = chickens > 0 ? (eggs / chickens).toFixed(2) : 0;
    const totalExpenses = Number(totalWages) + Number(totalConstruction);

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
      overallStatus,
      totalWages,
      totalConstruction,
      totalExpenses,
      workerCount
    };
  } catch (err) {
    console.error('Error computing metrics:', err);
    return {
      totalChickens: 0, totalEggs: 0, totalCustomers: 0, totalRevenue: 0, totalDeaths: 0,
      feedPurchased: 0, feedConsumed: 0, feedRemaining: 0, mortalityRate: '0.00', survivalRate: '100.00',
      eggsPerChicken: '0.00', overallStatus: 'ONLINE', totalWages: 0, totalConstruction: 0, totalExpenses: 0, workerCount: 0
    };
  }
}

// User Authentication & Management Helpers
export function authenticateUser(username, password) {
  const users = runQuery(
    "SELECT id, full_name, username, role, created_at FROM users WHERE username = ? AND password = ?",
    [username, password]
  );
  if (users && users.length > 0) {
    return users[0];
  }
  return null;
}

export function getAllUsers() {
  return runQuery("SELECT id, full_name, username, role, created_at FROM users ORDER BY id ASC");
}

export function createUser(fullName, username, password, role) {
  const existing = runQuery("SELECT id FROM users WHERE username = ?", [username]);
  if (existing && existing.length > 0) {
    throw new Error(`Username "${username}" already exists!`);
  }
  executeSql(`
    INSERT INTO users (full_name, username, password, role)
    VALUES ('${fullName.replace(/'/g, "''")}', '${username.replace(/'/g, "''")}', '${password.replace(/'/g, "''")}', '${role}')
  `);
  return true;
}

export function updateUser(id, fullName, role, password = null) {
  if (password && password.trim() !== '') {
    executeSql(`
      UPDATE users 
      SET full_name = '${fullName.replace(/'/g, "''")}', role = '${role}', password = '${password.replace(/'/g, "''")}'
      WHERE id = ${id}
    `);
  } else {
    executeSql(`
      UPDATE users 
      SET full_name = '${fullName.replace(/'/g, "''")}', role = '${role}'
      WHERE id = ${id}
    `);
  }
  return true;
}

export function deleteUser(id) {
  executeSql(`DELETE FROM users WHERE id = ${id}`);
  return true;
}

export function updatePassword(userId, newPassword) {
  executeSql(`UPDATE users SET password = '${newPassword.replace(/'/g, "''")}' WHERE id = ${userId}`);
  return true;
}
