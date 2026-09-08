let pyodideInstance = null;

export async function initPyodideWasm() {
  if (pyodideInstance) return pyodideInstance;

  if (typeof window.loadPyodide !== 'function') {
    throw new Error('Pyodide script is not loaded in the window. Please check network connection.');
  }

  console.log('BEACO FARM: Loading Pyodide WebAssembly engine...');
  pyodideInstance = await window.loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
  });

  console.log('BEACO FARM: Pyodide WebAssembly ready.');
  return pyodideInstance;
}

export async function runPythonAnalytics(code, databaseData) {
  const pyodide = await initPyodideWasm();

  // Inject current database state as python dict/json
  pyodide.globals.set("farm_data_json", JSON.stringify(databaseData));

  const pythonScript = `
import json
import sys
import io

# Redirect stdout to capture print statements
sys.stdout = io.StringIO()

farm_data = json.loads(farm_data_json)

${code}

output = sys.stdout.getvalue()
output
`;

  try {
    const result = await pyodide.runPythonAsync(pythonScript);
    return { success: true, output: result };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

// Built-in Python script templates converted from farm_performance.py, analytics.py, feed_analysis.py, mortality_analysis.py
export const PYTHON_TEMPLATES = {
  farm_performance: `
print("========================================")
print("       BEACO FARM PERFORMANCE (WASM)")
print("========================================")

total_chickens = farm_data.get('totalChickens', 0)
total_eggs = farm_data.get('totalEggs', 0)
total_customers = farm_data.get('totalCustomers', 0)
total_revenue = farm_data.get('totalRevenue', 0)
total_deaths = farm_data.get('totalDeaths', 0)
feed_remaining = farm_data.get('feedRemaining', 0)

mortality_rate = float(farm_data.get('mortalityRate', 0))
survival_rate = float(farm_data.get('survivalRate', 0))
eggs_per_chicken = float(farm_data.get('eggsPerChicken', 0))

if eggs_per_chicken >= 5:
    egg_status = "EXCELLENT"
elif eggs_per_chicken >= 3:
    egg_status = "GOOD"
elif eggs_per_chicken > 0:
    egg_status = "LOW"
else:
    egg_status = "NO DATA"

if mortality_rate == 0:
    mortality_status = "EXCELLENT"
elif mortality_rate <= 2:
    mortality_status = "GOOD"
elif mortality_rate <= 5:
    mortality_status = "WARNING"
else:
    mortality_status = "CRITICAL"

if feed_remaining <= 0:
    feed_status = "CRITICAL - NO FEED"
elif feed_remaining < 100:
    feed_status = "WARNING - LOW FEED"
else:
    feed_status = "GOOD"

print("\\n🐔 LIVESTOCK")
print("-" * 40)
print(f"Total Chickens       : {total_chickens}")
print(f"Total Customers      : {total_customers}")

print("\\n🥚 EGG PRODUCTION")
print("-" * 40)
print(f"Total Eggs           : {total_eggs}")
print(f"Eggs / Chicken       : {eggs_per_chicken:.2f}")
print(f"Production Status    : {egg_status}")

print("\\n☠️ MORTALITY")
print("-" * 40)
print(f"Total Deaths         : {total_deaths}")
print(f"Mortality Rate       : {mortality_rate:.2f}%")
print(f"Survival Rate        : {survival_rate:.2f}%")
print(f"Mortality Status     : {mortality_status}")

print("\\n🌾 FEED")
print("-" * 40)
print(f"Feed Remaining       : {feed_remaining:.2f} kg")
print(f"Feed Status          : {feed_status}")

print("\\n💰 FINANCE")
print("-" * 40)
print(f"Total Revenue        : {total_revenue:,.2f} RWF")

print("\\n" + "=" * 40)
print(f"OVERALL FARM STATUS  : {farm_data.get('overallStatus', 'MONITOR')}")
print("========================================")
`,

  feed_analysis: `
print("========================================")
print("     BEACO FARM FEED ANALYSIS (WASM)")
print("========================================")

purchased = farm_data.get('feedPurchased', 0)
consumed = farm_data.get('feedConsumed', 0)
remaining = farm_data.get('feedRemaining', 0)
chickens = farm_data.get('totalChickens', 1)

feed_per_chicken = consumed / chickens if chickens > 0 else 0
usage_pct = (consumed / purchased * 100) if purchased > 0 else 0

print(f"Feed Purchased      : {purchased:.2f} kg")
print(f"Feed Consumed       : {consumed:.2f} kg")
print(f"Feed Remaining      : {remaining:.2f} kg")
print(f"Feed / Chicken      : {feed_per_chicken:.2f} kg")
print(f"Consumption Rate    : {usage_pct:.1f}%")

if remaining <= 0:
    print("Feed Health Status  : CRITICAL OUT OF STOCK")
elif remaining < 100:
    print("Feed Health Status  : LOW STOCK WARNING")
else:
    print("Feed Health Status  : OPTIMAL STOCK LEVEL")
`,

  mortality_analysis: `
print("========================================")
print("  BEACO FARM MORTALITY ANALYSIS (WASM)")
print("========================================")

chickens = farm_data.get('totalChickens', 0)
deaths = farm_data.get('totalDeaths', 0)
rate = float(farm_data.get('mortalityRate', 0))
survival = float(farm_data.get('survivalRate', 0))

print(f"Active Population   : {chickens}")
print(f"Total Deaths        : {deaths}")
print(f"Mortality Rate      : {rate:.2f}%")
print(f"Survival Rate       : {survival:.2f}%")

if rate == 0:
    print("Health Status       : EXCELLENT (0% Mortality)")
elif rate <= 2:
    print("Health Status       : GOOD (<2% Mortality)")
elif rate <= 5:
    print("Health Status       : ELEVATED RISK (2-5% Mortality)")
else:
    print("Health Status       : ALERT (>5% High Mortality)")
`
};
