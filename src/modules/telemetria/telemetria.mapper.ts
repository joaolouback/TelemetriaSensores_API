/**
 * Mapeamento da telemetria vinda do aplicativo mobile (REST e WebSocket).
 *
 * Converte os logs recebidos (snake_case / camelCase) para a tabela `telemetria_sensor` do Prisma.
 * Aceita os nomes do diagrama de classes (acelerometro_x, nivel_bateria, tipo_rede, timestamp)
 * e, por compatibilidade, os nomes antigos do app (accel_x, battery_level, network_type, created_at).
 * O saneamento é tolerante de propósito: um campo quebrado vira null em vez de rejeitar o lote.
 */
import { Prisma } from '@prisma/client';
import { TelemetriaSensor } from './entities/telemetria-sensor.entity';
import { SyncLogDto } from './dto/sync-log.dto';
import { TelemetriaDto } from './dto/telemetria.dto';

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
 *
 * @param usuarioAutenticado id vindo do token JWT — a ÚNICA fonte do dono dos registros.
 * Um `usuario_id` no corpo é ignorado: sem token, os registros ficam anônimos, para que
 * ninguém grave telemetria em nome de outro usuário.
 */
export const toTelemetriaCreateInput = (
  logs: SyncLogDto[],
  usuarioAutenticado: number | null = null
): Prisma.TelemetriaSensorCreateManyInput[] => {
  return logs.map((log) => {
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
      usuarioId: usuarioAutenticado,
    };
  });
};

export const toTelemetriaDto = (registro: TelemetriaSensor): TelemetriaDto => ({
  ...registro,
  // BigInt não é serializável em JSON; os ids cabem com folga em um number.
  id: Number(registro.id),
});
