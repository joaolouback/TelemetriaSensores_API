import { Request, Response } from 'express';
import prisma from '../database/prisma';
import { parseLogs } from '../utils/parseLogs';

export const syncData = async (req: Request, res: Response): Promise<any> => {
  try {
    console.log(`\n[${new Date().toISOString()}] Recebendo requisição POST /sync`);

    const logs = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: 'O payload deve ser um array não vazio de logs.' });
    }

    const data = parseLogs(logs);

    const result = await prisma.telemetriaSensor.createMany({ data });

    console.log(`[REST] Inseridos ${result.count} registros de telemetria.`);

    return res.status(200).json({
      message: 'Sincronização realizada com sucesso',
      insertedCount: result.count
    });
  } catch (error) {
    console.error('Erro ao sincronizar dados:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao tentar sincronizar dados.' });
  }
};

export const getLogs = async (req: Request, res: Response): Promise<any> => {
  try {
    console.log(`\n[${new Date().toISOString()}] Recebendo requisição GET /logs`);

    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.telemetriaSensor.findMany({
        orderBy: { id: 'desc' },
        skip,
        take: limit
      }),
      prisma.telemetriaSensor.count()
    ]);

    return res.status(200).json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao buscar logs.' });
  }
};
