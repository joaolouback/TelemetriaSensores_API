import { Router } from 'express';
import { listarPontos, pontosProximos, obterPonto } from '../controllers/pontoController';

const router = Router();

/**
 * @swagger
 * /api/pontos:
 *   get:
 *     summary: Lista os pontos de coleta do campus
 *     description: Retorna todos os pontos de interesse ativos, usados pelo mapa do aplicativo.
 *     responses:
 *       200:
 *         description: Lista de pontos de interesse
 *       500:
 *         description: Erro interno no servidor
 */
router.get('/pontos', listarPontos);

/**
 * @swagger
 * /api/pontos/proximos:
 *   get:
 *     summary: Pontos ordenados por proximidade
 *     description: Calcula a distância (Haversine) entre a posição informada e cada ponto, indicando quais estão dentro do raio de geofence.
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude atual do usuário
 *         example: -20.3417
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude atual do usuário
 *         example: -40.2917
 *     responses:
 *       200:
 *         description: Pontos ordenados por distância
 *       400:
 *         description: Parâmetros lat/lon ausentes ou inválidos
 *       500:
 *         description: Erro interno no servidor
 */
router.get('/pontos/proximos', pontosProximos);

/**
 * @swagger
 * /api/pontos/{id}:
 *   get:
 *     summary: Detalha um ponto de interesse
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do ponto de interesse
 *       404:
 *         description: Ponto não encontrado
 */
router.get('/pontos/:id', obterPonto);

export default router;
