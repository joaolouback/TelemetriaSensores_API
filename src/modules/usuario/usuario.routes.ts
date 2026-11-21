import express, { Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler';
import { autenticar } from '../../shared/middlewares/auth.middleware';
import { TAMANHO_MAXIMO_FOTO_BYTES } from '../../shared/utils/foto-perfil';
import { enviarFoto, removerFoto } from './usuario.controller';

const router = Router();

/**
 * @swagger
 * /api/usuarios/me/foto:
 *   put:
 *     summary: Define a foto de perfil
 *     description: O corpo da requisição é a própria imagem (`Content-Type` image/jpeg, image/png ou image/webp), com até 5 MB. A foto anterior é apagada.
 *     responses:
 *       200:
 *         description: Usuário atualizado, com `fotoUrl`
 *       400:
 *         description: Corpo vazio ou arquivo que não é uma imagem aceita
 *       401:
 *         description: Token ausente ou inválido
 *       413:
 *         description: Imagem maior que 5 MB
 *   delete:
 *     summary: Remove a foto de perfil
 *     responses:
 *       200:
 *         description: Usuário atualizado, com `fotoUrl` nulo
 *       401:
 *         description: Token ausente ou inválido
 */
router.put(
  '/usuarios/me/foto',
  autenticar,
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: TAMANHO_MAXIMO_FOTO_BYTES }),
  asyncHandler(enviarFoto)
);
router.delete('/usuarios/me/foto', autenticar, asyncHandler(removerFoto));

export default router;
