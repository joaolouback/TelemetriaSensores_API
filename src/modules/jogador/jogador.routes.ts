import { Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler';
import { autenticar } from '../../shared/middlewares/auth.middleware';
import { obterJogador } from './jogador.controller';

const router = Router();

/**
 * @swagger
 * /api/jogadores/{id}:
 *   get:
 *     summary: Perfil público de um jogador
 *     description: Nome abreviado, foto, pontuação, posição no ranking, locais coletados, placar de desafios e conquistas (com as desbloqueadas). Não inclui o e-mail.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Perfil do jogador
 *       400:
 *         description: Id inválido
 *       401:
 *         description: Token ausente ou inválido
 *       404:
 *         description: Jogador não encontrado
 */
router.get('/jogadores/:id', autenticar, asyncHandler(obterJogador));

export default router;
