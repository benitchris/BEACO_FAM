/**
 * Formats an egg count into Egg Trays (30 eggs per tray) and remainder loose eggs.
 * Example: 380 eggs -> "12 Trays + 20 eggs" (380 total)
 */
export function formatEggTrays(totalEggs, options = {}) {
  const count = Math.max(0, Number(totalEggs) || 0);
  const trays = Math.floor(count / 30);
  const remainder = count % 30;

  if (options.compact) {
    if (trays === 0) return `${remainder} eggs`;
    if (remainder === 0) return `${trays} Trays`;
    return `${trays} Trays, ${remainder} loose`;
  }

  if (trays === 0) {
    return `${remainder} ${remainder === 1 ? 'egg' : 'eggs'}`;
  }

  if (remainder === 0) {
    return `${trays.toLocaleString()} ${trays === 1 ? 'Tray' : 'Trays'}`;
  }

  return `${trays.toLocaleString()} ${trays === 1 ? 'Tray' : 'Trays'} + ${remainder} ${remainder === 1 ? 'egg' : 'eggs'}`;
}

export function getTrayBreakdown(totalEggs) {
  const count = Math.max(0, Number(totalEggs) || 0);
  return {
    trays: Math.floor(count / 30),
    remainder: count % 30,
    total: count
  };
}
