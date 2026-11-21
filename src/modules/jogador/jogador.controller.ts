import { Response } from 'express';
import { validar } from '../../shared/http/validar';
import { AuthenticatedRequest } from '../../shared/middlewares/auth.middleware';
import * as jogadorService from './jogador.service';
import { jogadorIdSchema } from './dto/jogador-id.dto';

/** GET /api/jogadores/:id — perfil público de um jogador. */
export const obterJogador = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = validar(jogadorIdSchema, req.params);
  res.status(200).json(await jogadorService.perfilPublico(id, req.usuarioId));
};
