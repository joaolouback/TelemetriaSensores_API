import { Router } from 'express';
import { syncData, getLogs } from '../controllers/syncController';

const router = Router();

/**
 * @swagger
 * /api/sync:
 *   post:
 *     summary: Sincroniza logs de telemetria em lote
 *     description: Recebe um array de logs armazenados offline pelo aplicativo mobile e realiza bulk insert no banco.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 sensor_type:
 *                   type: string
 *                   example: GPS_ACCEL
 *                 latitude:
 *                   type: number
 *                   example: -22.9068
 *                 longitude:
 *                   type: number
 *                   example: -43.1729
 *                 accel_x:
 *                   type: number
 *                   example: 0.1
 *                 accel_y:
 *                   type: number
 *                   example: 0.2
 *                 accel_z:
 *                   type: number
 *                   example: 9.8
 *                 magnitude:
 *                   type: number
 *                   example: 9.8
 *                 battery_level:
 *                   type: number
 *                   example: 80.5
 *                 network_type:
 *                   type: string
 *                   example: WIFI
 *                 synced:
 *                   type: integer
 *                   example: 1
 *                 created_at:
 *                   type: string
 *                   example: "2023-11-20T12:00:00Z"
 *     responses:
 *       200:
 *         description: Sincronização realizada com sucesso
 *       400:
 *         description: Payload genérico vazio
 *       500:
 *         description: Erro interno no servidor
 */
router.post('/sync', syncData);

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Retorna os logs de telemetria salvos
 *     description: Lista paginada dos logs sincronizados.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Quantidade de itens por página (default 10)
 *     responses:
 *       200:
 *         description: Lista de logs e informações de paginação
 *       500:
 *         description: Erro interno no servidor
 */
router.get('/logs', getLogs);

export default router;
