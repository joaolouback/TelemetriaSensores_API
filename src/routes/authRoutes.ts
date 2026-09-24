import { Router } from 'express';
import { registrar, login, perfil } from '../controllers/authController';
import { autenticar } from '../utils/auth';

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
 */
router.post('/auth/registro', registrar);

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
 */
router.post('/auth/login', login);

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
router.get('/auth/me', autenticar, perfil);

export default router;
