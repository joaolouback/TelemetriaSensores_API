/**
 * Utilitário compartilhado para parsing de logs de telemetria.
 * Reutilizado pelo syncController (REST) e wsHandler (WebSocket).
 */

const parseReal = (value: any, decimals: number = 6): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return null;
  return Number(parsed.toFixed(decimals));
};

/**
 * Converte um array de logs brutos em um array de tuplas prontas para INSERT.
 * Cada tupla segue a ordem das colunas:
 * (sensor_type, latitude, longitude, accel_x, accel_y, accel_z,
 *  magnitude, battery_level, network_type, synced, created_at)
 */
export const parseLogs = (logs: any[]): any[][] => {
  return logs.map((log: any) => [
    log.sensor_type ? String(log.sensor_type).trim() : 'UNKNOWN',
    parseReal(log.latitude, 8),
    parseReal(log.longitude, 8),
    parseReal(log.accel_x, 4),
    parseReal(log.accel_y, 4),
    parseReal(log.accel_z, 4),
    parseReal(log.magnitude, 4),
    parseReal(log.battery_level, 2),
    log.network_type ? String(log.network_type).trim() : 'UNKNOWN',
    1, // Força synced = 1 ao chegar no backend
    log.created_at && !isNaN(new Date(log.created_at).getTime())
      ? new Date(log.created_at).toISOString()
      : new Date().toISOString()
  ]);
};
