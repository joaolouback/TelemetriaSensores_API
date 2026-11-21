import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middlewares/auth.middleware';
import * as conquistaService from './conquista.service';

/** GET /api/conquistas — todas as conquistas, com as que o usuário logado já desbloqueou. */
export const listarConquistas = async (req: AuthenticatedRequest, res: Response) => {
  const conquistas = await conquistaService.listarDoUsuario(req.usuarioId);
  res.status(200).json({ total: conquistas.length, data: conquistas });
};
