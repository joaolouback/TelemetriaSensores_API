/**
 * Utilitário para parsing de logs de telemetria vindo do aplicativo mobile.
 * Utilizado por syncController (REST) e wsHandler (WebSocket).
 *
 * Mapeia os dados recebidos (snake_case / camelCase) para a tabela `telemetria_sensor` do Prisma.
 * Aceita os nomes do diagrama de classes (acelerometro_x, nivel_bateria, tipo_rede, timestamp)
 * e, por compatibilidade, os nomes antigos do app (accel_x, battery_level, network_type, created_at).
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

const parseUsuarioId = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

/**
 * Converte um array de logs brutos em objetos no formato do model TelemetriaSensor (tabela `telemetria_sensor`).
 *
 * @param usuarioAutenticado id vindo do token JWT. Quando presente, prevalece sobre o
 * `usuario_id` enviado no corpo — o cliente não pode gravar telemetria em nome de outro usuário.
 */
export const parseLogs = (
  logs: any[],
  usuarioAutenticado: number | null = null
): Prisma.TelemetriaSensorCreateManyInput[] => {
  return logs.map((log: any) => {
    const tipoRede = log.tipo_rede ?? log.tipoRede ?? log.network_type ?? log.networkType;

    return {
      latitude: parseReal(log.latitude, 8) ?? 0.0,
      longitude: parseReal(log.longitude, 8) ?? 0.0,
      acelerometroX: parseReal(log.acelerometro_x ?? log.acelerometroX ?? log.accel_x, 4),
      acelerometroY: parseReal(log.acelerometro_y ?? log.acelerometroY ?? log.accel_y, 4),
      acelerometroZ: parseReal(log.acelerometro_z ?? log.acelerometroZ ?? log.accel_z, 4),
      magnitude: parseReal(log.magnitude, 4),
      nivelBateria: parseBateria(log.nivel_bateria ?? log.nivelBateria ?? log.battery_level ?? log.batteryLevel),
      tipoRede: tipoRede ? String(tipoRede).trim().toUpperCase() : 'UNKNOWN',
      timestamp: parseData(log.timestamp ?? log.created_at),
      usuarioId: usuarioAutenticado ?? parseUsuarioId(log.usuario_id ?? log.usuarioId),
    };
  });
};
