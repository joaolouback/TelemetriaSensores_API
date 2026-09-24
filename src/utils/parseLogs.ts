/**
 * Utilitário para parsing de logs de telemetria vindo do aplicativo mobile.
 * Utilizado por syncController (REST) e wsHandler (WebSocket).
 *
 * Mapeia os dados recebidos (snake_case / camelCase) para a tabela `telemetria_sensor` do Prisma.
 */
import { Prisma } from '@prisma/client';

const parseReal = (value: any, decimals: number = 6): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return null;
  return Number(parsed.toFixed(decimals));
};

const parseBateria = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return null;
  // Se for valor entre 0 e 1 (ex: 0.85 do expo-battery), converte para porcentagem 0-100
  if (parsed <= 1.0 && parsed >= 0.0) {
    return Math.round(parsed * 100);
  }
  return Math.min(100, Math.max(0, Math.round(parsed)));
};

const parseData = (value: any): Date => {
  if (value && !isNaN(new Date(value).getTime())) return new Date(value);
  return new Date();
};

/**
 * Converte um array de logs brutos em objetos no formato do model TelemetriaSensor (tabela `telemetria_sensor`).
 */
export const parseLogs = (logs: any[]): Prisma.TelemetriaSensorCreateManyInput[] => {
  return logs.map((log: any) => ({
    latitude: parseReal(log.latitude, 8) ?? 0.0,
    longitude: parseReal(log.longitude, 8) ?? 0.0,
    acelerometroX: parseReal(log.accel_x ?? log.acelerometro_x ?? log.acelerometroX, 4),
    acelerometroY: parseReal(log.accel_y ?? log.acelerometro_y ?? log.acelerometroY, 4),
    acelerometroZ: parseReal(log.accel_z ?? log.acelerometro_z ?? log.acelerometroZ, 4),
    magnitude: parseReal(log.magnitude, 4),
    nivelBateria: parseBateria(log.battery_level ?? log.batteryLevel ?? log.nivel_bateria ?? log.nivelBateria),
    tipoRede: log.network_type ?? log.networkType ?? log.tipo_rede ?? log.tipoRede
      ? String(log.network_type ?? log.networkType ?? log.tipo_rede ?? log.tipoRede).trim().toUpperCase()
      : 'UNKNOWN',
    timestamp: parseData(log.created_at ?? log.timestamp),
    usuarioId:
      log.usuario_id ?? log.usuarioId !== undefined && (log.usuario_id ?? log.usuarioId) !== null
        ? Number(log.usuario_id ?? log.usuarioId)
        : null,
  }));
};
