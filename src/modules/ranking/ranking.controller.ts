import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middlewares/auth.middleware';
import * as rankingService from './ranking.service';

/** GET /api/ranking — os melhores jogadores e a posição do usuário logado. */
export const obterRanking = async (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json(await rankingService.obter(req.usuarioId));
};
