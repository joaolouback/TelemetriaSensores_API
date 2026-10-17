import { Request, Response } from 'express';
import { validar } from '../../shared/http/validar';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import * as telemetriaService from './telemetria.service';
import { toTelemetriaDto } from './telemetria.mapper';
import { syncLoteSchema } from './dto/sync-log.dto';
import { listarLogsSchema } from './dto/listar-logs.dto';
import { LogsPaginadosDto } from './dto/telemetria.dto';

/** POST /api/sync — sincronização em lote dos logs guardados offline. */
export const syncData = async (req: AuthRequest, res: Response) => {
  console.log(`\n[${new Date().toISOString()}] Recebendo requisição POST /sync`);

  const logs = validar(syncLoteSchema, req.body);
  const insertedCount = await telemetriaService.sincronizar(logs, req.usuarioId ?? null);

  console.log(`[REST] Inseridos ${insertedCount} registros de telemetria.`);
  res.status(200).json({ message: 'Sincronização realizada com sucesso', insertedCount });
};

/** GET /api/logs?page=&limit= — consulta paginada. */
export const getLogs = async (req: Request, res: Response) => {
  console.log(`\n[${new Date().toISOString()}] Recebendo requisição GET /logs`);

  const filtro = validar(listarLogsSchema, req.query);
  const { registros, total } = await telemetriaService.listar(filtro);

  const resposta: LogsPaginadosDto = {
    data: registros.map(toTelemetriaDto),
    pagination: {
      total,
      page: filtro.page,
      limit: filtro.limit,
      totalPages: Math.ceil(total / filtro.limit),
    },
  };
  res.status(200).json(resposta);
};
