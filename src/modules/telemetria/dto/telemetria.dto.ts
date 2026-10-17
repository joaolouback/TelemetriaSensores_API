/** Registro de telemetria como sai na API (`GET /api/logs`). */
export interface TelemetriaDto {
  id: number;
  usuarioId: number | null;
  latitude: number;
  longitude: number;
  acelerometroX: number | null;
  acelerometroY: number | null;
  acelerometroZ: number | null;
  magnitude: number | null;
  nivelBateria: number | null;
  tipoRede: string | null;
  timestamp: Date;
}

export interface LogsPaginadosDto {
  data: TelemetriaDto[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}
