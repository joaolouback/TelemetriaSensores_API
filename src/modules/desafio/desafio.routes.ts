import { Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler';
import { autenticar } from '../../shared/middlewares/auth.middleware';
import {
  criarDesafio,
  entrarDesafio,
  desafioAtual,
  sairDesafio,
  historicoDesafios,
} from './desafio.controller';

const router = Router();

/**
 * @swagger
 * /api/desafios:
 *   post:
 *     summary: Cria um desafio 1x1
 *     description: Sorteia 3 pontos do campus e devolve um código de 6 caracteres para mandar ao oponente. O convite vale 30 minutos. Cada jogador participa de um desafio por vez.
 *     responses:
 *       201:
 *         description: Desafio criado (status AGUARDANDO), com o código e os pontos sorteados
 *       401:
 *         description: Token ausente ou inválido
 *       409:
 *         description: O usuário já está em outro desafio
 */
router.post('/desafios', autenticar, asyncHandler(criarDesafio));

/**
 * @swagger
 * /api/desafios/entrar:
 *   post:
 *     summary: Entra num desafio pelo código
 *     description: A partida começa na hora e dura 1 hora. Vence quem coletar os 3 pontos primeiro (+20 pontos de bônus); se o tempo acabar, vence quem coletou mais.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codigo]
 *             properties:
 *               codigo:
 *                 type: string
 *                 example: K7Q2MX
 *     responses:
 *       200:
 *         description: Partida iniciada (status EM_ANDAMENTO)
 *       400:
 *         description: Código em formato inválido
 *       404:
 *         description: Código não encontrado
 *       409:
 *         description: Próprio desafio, desafio já começou ou o usuário já está em outro
 *       410:
 *         description: Convite expirado
 */
router.post('/desafios/entrar', autenticar, asyncHandler(entrarDesafio));

/**
 * @swagger
 * /api/desafios/atual:
 *   get:
 *     summary: Desafio atual do usuário
 *     description: O desafio aguardando ou em andamento, ou o último que terminou há menos de 30 minutos (para mostrar o resultado). Encerra na hora desafios com convite ou tempo vencidos. O app consulta a cada poucos segundos durante a partida.
 *     responses:
 *       200:
 *         description: "`{ desafio: Desafio | null }` — inclui o progresso dos dois jogadores e a hora do servidor (`agora`)"
 */
router.get('/desafios/atual', autenticar, asyncHandler(desafioAtual));

/**
 * @swagger
 * /api/desafios/historico:
 *   get:
 *     summary: Histórico de desafios
 *     description: Os últimos 20 desafios terminados e o placar de vitórias, derrotas e empates.
 *     responses:
 *       200:
 *         description: "`{ vitorias, derrotas, empates, desafios }`"
 */
router.get('/desafios/historico', autenticar, asyncHandler(historicoDesafios));

/**
 * @swagger
 * /api/desafios/{id}/sair:
 *   post:
 *     summary: Sai do desafio
 *     description: Antes de o oponente entrar, cancela o desafio. Durante a partida é desistência — o oponente vence e leva o bônus.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Desafio cancelado ou finalizado
 *       404:
 *         description: Desafio não encontrado (ou o usuário não participa dele)
 *       409:
 *         description: O desafio já terminou
 */
router.post('/desafios/:id/sair', autenticar, asyncHandler(sairDesafio));

export default router;
