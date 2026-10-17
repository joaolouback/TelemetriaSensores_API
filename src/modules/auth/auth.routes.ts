import { Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler';
import { autenticar } from '../../shared/middlewares/auth.middleware';
import { limiteLogin, limiteRegistro } from '../../shared/middlewares/rate-limit.middleware';
import { registrar, login, perfil } from './auth.controller';

const router = Router();

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     summary: Cria uma conta de usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, email, senha]
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Maria Silva
 *               email:
 *                 type: string
 *                 example: maria@aluno.uvv.br
 *               senha:
 *                 type: string
 *                 example: segredo123
 *     responses:
 *       201:
 *         description: Conta criada. Retorna o token JWT e os dados do usuário.
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: E-mail já cadastrado
 *       429:
 *         description: Limite de cadastros por rede atingido (30 a cada 15 min)
 */
router.post('/auth/registro', limiteRegistro, asyncHandler(registrar));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autentica o usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, senha]
 *             properties:
 *               email:
 *                 type: string
 *                 example: maria@aluno.uvv.br
 *               senha:
 *                 type: string
 *                 example: segredo123
 *     responses:
 *       200:
 *         description: Login realizado. Retorna o token JWT e os dados do usuário.
 *       401:
 *         description: E-mail ou senha incorretos
 *       429:
 *         description: Muitas tentativas erradas para este e-mail (10 a cada 15 min)
 */
router.post('/auth/login', limiteLogin, asyncHandler(login));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Dados do usuário autenticado
 *     description: Requer o header `Authorization Bearer <token>`.
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       401:
 *         description: Token ausente ou inválido
 */
router.get('/auth/me', autenticar, asyncHandler(perfil));

export default router;
