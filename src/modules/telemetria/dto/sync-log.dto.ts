import { z } from 'zod';

/**
 * Um log de telemetria como o app envia, guardado offline no SQLite.
 *
 * Os campos não são validados um a um: o mapper saneia cada valor (NaN, datas
 * quebradas, bateria em 0–1) para não descartar um lote inteiro por um campo ruim.
 * Inclui os nomes antigos do app para aparelhos que ainda não atualizaram.
 */
export interface SyncLogDto {
  latitude?: unknown;
  longitude?: unknown;
  acelerometro_x?: unknown;
  acelerometro_y?: unknown;
  acelerometro_z?: unknown;
  acelerometroX?: unknown;
  acelerometroY?: unknown;
  acelerometroZ?: unknown;
  /** @deprecated nome antigo de `acelerometro_x` */
  accel_x?: unknown;
  /** @deprecated nome antigo de `acelerometro_y` */
  accel_y?: unknown;
  /** @deprecated nome antigo de `acelerometro_z` */
  accel_z?: unknown;
  magnitude?: unknown;
  nivel_bateria?: unknown;
  nivelBateria?: unknown;
  /** @deprecated nome antigo de `nivel_bateria` */
  battery_level?: unknown;
  /** @deprecated nome antigo de `nivel_bateria` */
  batteryLevel?: unknown;
  tipo_rede?: unknown;
  tipoRede?: unknown;
  /** @deprecated nome antigo de `tipo_rede` */
  network_type?: unknown;
  /** @deprecated nome antigo de `tipo_rede` */
  networkType?: unknown;
  timestamp?: unknown;
  /** @deprecated nome antigo de `timestamp` */
  created_at?: unknown;
  /** Ignorado: o dono dos registros vem só do token (o app ainda envia o campo). */
  usuario_id?: unknown;
}

const MSG_LOTE = 'O payload deve ser um array não vazio de logs.';

/** Corpo de `POST /api/sync`: um array não vazio de logs. */
export const syncLoteSchema = z
  .array(z.record(z.string(), z.unknown()) as z.ZodType<SyncLogDto>, { error: MSG_LOTE })
  .min(1, { error: MSG_LOTE });
