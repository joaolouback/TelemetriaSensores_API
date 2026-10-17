import { Response } from 'express';
import { validar } from '../../shared/http/validar';
import { AuthenticatedRequest } from '../../shared/middlewares/auth.middleware';
import * as desafioService from './desafio.service';
import { toDesafioDto } from './desafio.mapper';
import { entrarDesafioSchema } from './dto/entrar-desafio.dto';
import { desafioIdSchema } from './dto/desafio-id.dto';
import { HistoricoDesafiosDto } from './dto/desafio.dto';

/** POST /api/desafios — cria um desafio e devolve o código de convite. */
export const criarDesafio = async (req: AuthenticatedRequest, res: Response) => {
  const desafio = await desafioService.criar(req.usuarioId);
  res.status(201).json(toDesafioDto(desafio, req.usuarioId));
};

/** POST /api/desafios/entrar — entra com o código; a partida começa. */
export const entrarDesafio = async (req: AuthenticatedRequest, res: Response) => {
  const { codigo } = validar(entrarDesafioSchema, req.body);
  const desafio = await desafioService.entrar(req.usuarioId, codigo);
  res.status(200).json(toDesafioDto(desafio, req.usuarioId));
};

/** GET /api/desafios/atual — desafio ativo (ou o resultado recente); `null` se não houver. */
export const desafioAtual = async (req: AuthenticatedRequest, res: Response) => {
  const desafio = await desafioService.atual(req.usuarioId);
  res.status(200).json({ desafio: desafio ? toDesafioDto(desafio, req.usuarioId) : null });
};

/** POST /api/desafios/:id/sair — cancela (antes de começar) ou desiste (durante). */
export const sairDesafio = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = validar(desafioIdSchema, req.params);
  const desafio = await desafioService.sair(req.usuarioId, id);
  res.status(200).json(toDesafioDto(desafio, req.usuarioId));
};

/** GET /api/desafios/historico — últimos desafios e placar de vitórias/derrotas. */
export const historicoDesafios = async (req: AuthenticatedRequest, res: Response) => {
  const [desafios, placar] = await Promise.all([
    desafioService.historico(req.usuarioId),
    desafioService.placar(req.usuarioId),
  ]);
  const resposta: HistoricoDesafiosDto = {
    ...placar,
    desafios: desafios.map((d) => toDesafioDto(d, req.usuarioId)),
  };
  res.status(200).json(resposta);
};
