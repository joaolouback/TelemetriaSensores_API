/**
 * Telemetria de sensores herdada da Prova de Conceito (offline-first).
 * Usado pelo REST (`/api/sync`, `/api/logs`) e pelo WebSocket (`/ws`).
 */
import prisma from '../../shared/database/prisma';
import * as usuarioService from '../usuario/usuario.service';
import { TelemetriaSensor } from './entities/telemetria-sensor.entity';
import { toTelemetriaCreateInput } from './telemetria.mapper';
import { SyncLogDto } from './dto/sync-log.dto';
import { ListarLogsDto } from './dto/listar-logs.dto';

/**
 * Grava um lote de logs (bulk insert) e retorna quantos foram inseridos.
 * @param usuarioId id vindo do token; prevalece sobre o `usuario_id` do corpo.
 */
export async function sincronizar(logs: SyncLogDto[], usuarioId: number | null): Promise<number> {
  const { count } = await prisma.telemetriaSensor.createMany({
    data: toTelemetriaCreateInput(logs, usuarioId),
  });
  return count;
}

/**
 * Lista paginada da telemetria. A telemetria tem a localização das pessoas, então
 * cada usuário só vê os próprios registros; administradores veem todos.
 */
export async function listar(
  { page, limit }: ListarLogsDto,
  usuarioId: number
): Promise<{ registros: TelemetriaSensor[]; total: number }> {
  const where = (await usuarioService.ehAdministrador(usuarioId)) ? {} : { usuarioId };

  const [registros, total] = await Promise.all([
    prisma.telemetriaSensor.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.telemetriaSensor.count({ where }),
  ]);
  return { registros, total };
}
