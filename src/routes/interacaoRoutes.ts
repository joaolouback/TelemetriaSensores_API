import { Router } from 'express';
import { registrarInteracao, minhasInteracoes } from '../controllers/interacaoController';
import { autenticar } from '../utils/auth';

const router = Router();

/**
 * @swagger
 * /api/interacoes:
 *   post:
 *     summary: Check-in em um ponto do campus
 *     description: Chamado quando o jogador toca no objeto 3D em realidade aumentada. O servidor revalida o geofence com a posição enviada; dentro do raio, credita os pontos do ponto (uma única vez por usuário) e desbloqueia as conquistas alcançadas. Requer o header `Authorization Bearer <token>`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pontoId, latitude, longitude]
 *             properties:
 *               pontoId:
 *                 type: integer
 *                 example: 1
 *               latitude:
 *                 type: number
 *                 example: -20.34105
 *               longitude:
 *                 type: number
 *                 example: -40.2923
 *     responses:
 *       201:
 *         description: Objeto coletado. Retorna os pontos ganhos, a nova pontuação total e as conquistas desbloqueadas.
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token ausente ou inválido
 *       404:
 *         description: Ponto não encontrado
 *       409:
 *         description: O usuário já coletou este ponto
 *       422:
 *         description: Fora do raio de geofence (a tentativa fica registrada com validadoGeofence = false)
 */
router.post('/interacoes', autenticar, registrarInteracao);

/**
 * @swagger
 * /api/interacoes/minhas:
 *   get:
 *     summary: Pontos já coletados pelo usuário
 *     description: Requer o header `Authorization Bearer <token>`.
 *     responses:
 *       200:
 *         description: "`{ pontosColetados: number[], pontuacaoTotal: number }`"
 *       401:
 *         description: Token ausente ou inválido
 */
router.get('/interacoes/minhas', autenticar, minhasInteracoes);

export default router;
