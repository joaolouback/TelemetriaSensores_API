import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middlewares/auth.middleware';
import { AppError } from '../../shared/errors/app-error';
import * as usuarioService from './usuario.service';
import { toUsuarioPublicoDto } from './usuario.mapper';

/** PUT /api/usuarios/me/foto — o corpo é a imagem (JPEG, PNG ou WebP, até 5 MB). */
export const enviarFoto = async (req: AuthenticatedRequest, res: Response) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new AppError(400, 'Envie a imagem no corpo da requisição (image/jpeg, image/png ou image/webp).');
  }
  const usuario = await usuarioService.definirFoto(req.usuarioId, req.body);
  res.status(200).json(toUsuarioPublicoDto(usuario));
};

/** DELETE /api/usuarios/me/foto — volta para o avatar com as iniciais. */
export const removerFoto = async (req: AuthenticatedRequest, res: Response) => {
  const usuario = await usuarioService.removerFoto(req.usuarioId);
  res.status(200).json(toUsuarioPublicoDto(usuario));
};
