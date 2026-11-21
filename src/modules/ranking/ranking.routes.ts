import { Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler';
import { autenticar } from '../../shared/middlewares/auth.middleware';
import { obterRanking } from './ranking.controller';

const router = Router();

/**
 * @swagger
 * /api/ranking:
 *   get:
 *     summary: Ranking de jogadores
 *     description: Os 20 jogadores com mais pontos (nome abreviado) e a posição do usuário logado, mesmo fora do top 20. Em empate, vence quem se cadastrou antes.
 *     responses:
 *       200:
 *         description: Ranking com `jogadores`, `eu` e `total`
 *       401:
 *         description: Token ausente ou inválido
 */
router.get('/ranking', autenticar, asyncHandler(obterRanking));

export default router;
