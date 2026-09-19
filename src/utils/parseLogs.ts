/**
 * Utilitário compartilhado para parsing de logs de telemetria.
 * Reutilizado pelo syncController (REST) e wsHandler (WebSocket).
 *
 * Converte o payload cru vindo do app (snake_case, valores possivelmente
 * string/NaN) em objetos no formato do model TelemetriaSensor do Prisma.
 */
import { Prisma } from '@prisma/client';

const parseReal = (value: any, decimals: number = 6): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return null;
  return Number(parsed.toFixed(decimals));
};

const parseData = (value: any): Date => {
  if (value && !isNaN(new Date(value).getTime())) return new Date(value);
  return new Date();
};

/**
 * Converte um array de logs brutos em objetos prontos para
 * `prisma.telemetriaSensor.createMany`.
 */
export const parseLogs = (logs: any[]): Prisma.TelemetriaSensorCreateManyInput[] => {
  return logs.map((log: any) => ({
    sensorType: log.sensor_type ? String(log.sensor_type).trim() : 'UNKNOWN',
    latitude: parseReal(log.latitude, 8),
    longitude: parseReal(log.longitude, 8),
    accelX: parseReal(log.accel_x, 4),
    accelY: parseReal(log.accel_y, 4),
    accelZ: parseReal(log.accel_z, 4),
    magnitude: parseReal(log.magnitude, 4),
    batteryLevel: parseReal(log.battery_level, 2),
    networkType: log.network_type ? String(log.network_type).trim() : 'UNKNOWN',
    synced: true, // Força synced = true ao chegar no backend
    createdAt: parseData(log.created_at),
    usuarioId:
      log.usuario_id !== undefined && log.usuario_id !== null
        ? Number(log.usuario_id)
        : null,
  }));
};
