import { Router } from 'express';
import { syncData, getLogs } from '../controllers/syncController';
import { autenticacaoOpcional } from '../utils/auth';

const router = Router();

/**
 * @swagger
 * /api/sync:
 *   post:
 *     summary: Sincroniza logs de telemetria em lote
 *     description: Recebe um array de logs armazenados offline pelo aplicativo mobile e realiza bulk insert no banco. Se o header `Authorization Bearer <token>` for enviado, os registros são associados ao usuário autenticado.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 latitude:
 *                   type: number
 *                   example: -20.3417
 *                 longitude:
 *                   type: number
 *                   example: -40.2917
 *                 acelerometro_x:
 *                   type: number
 *                   example: 0.1
 *                 acelerometro_y:
 *                   type: number
 *                   example: 0.2
 *                 acelerometro_z:
 *                   type: number
 *                   example: 9.8
 *                 magnitude:
 *                   type: number
 *                   example: 9.8
 *                 nivel_bateria:
 *                   type: integer
 *                   example: 80
 *                 tipo_rede:
 *                   type: string
 *                   example: WIFI
 *                 timestamp:
 *                   type: string
 *                   example: "2026-09-24T12:00:00Z"
 *     responses:
 *       200:
 *         description: Sincronização realizada com sucesso
 *       400:
 *         description: Payload genérico vazio
 *       500:
 *         description: Erro interno no servidor
 */
router.post('/sync', autenticacaoOpcional, syncData);

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
