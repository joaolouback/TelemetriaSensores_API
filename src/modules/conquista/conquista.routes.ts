import { Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler';
import { autenticar } from '../../shared/middlewares/auth.middleware';
import { listarConquistas } from './conquista.controller';

const router = Router();

/**
 * @swagger
 * /api/conquistas:
 *   get:
 *     summary: Conquistas do jogo e as desbloqueadas pelo usuário
 *     description: Lista todas as conquistas por ordem de exigência, cada uma com `desbloqueada` e `dataDesbloqueio`.
 *     responses:
 *       200:
 *         description: Lista de conquistas
 *       401:
 *         description: Token ausente ou inválido
 */
router.get('/conquistas', autenticar, asyncHandler(listarConquistas));

export default router;
