import { Request, Response } from 'express';
import pool from '../database/db';
import { parseLogs } from '../utils/parseLogs';

export const syncData = async (req: Request, res: Response): Promise<any> => {
  try {
    console.log(`\n[${new Date().toISOString()}] Recebendo requisição POST /sync`);
    console.log(`Tipo do payload: ${typeof req.body}`);
    console.log(`Payload recebido:`, JSON.stringify(req.body, null, 2));

    const logs = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: 'O payload deve ser um array não vazio de logs.' });
    }

    const values = parseLogs(logs);

    const query = `
      INSERT INTO sensor_logs 
      (sensor_type, latitude, longitude, accel_x, accel_y, accel_z, magnitude, battery_level, network_type, synced, created_at) 
      VALUES ?
    `;

    const [result] = await pool.query(query, [values]);

    return res.status(200).json({
      message: 'Sincronização realizada com sucesso',
      insertedCount: (result as any).affectedRows
    });
  } catch (error) {
    console.error('Erro ao sincronizar dados:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao tentar sincronizar dados.' });
  }
};

export const getLogs = async (req: Request, res: Response): Promise<any> => {
  try {
    console.log(`\n[${new Date().toISOString()}] 🔍 Recebendo requisição GET /logs`);
    console.log(`📋 Query Params:`, req.query);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const query = `SELECT * FROM sensor_logs ORDER BY id DESC LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(query, [limit, offset]);

    const countQuery = 'SELECT COUNT(*) as total FROM sensor_logs';
    const [countResult] = await pool.query<any>(countQuery);
    const total = countResult[0].total;

    return res.status(200).json({
      data: rows,
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
