import { Response } from 'express';
import { validar } from '../../shared/http/validar';
import { AuthenticatedRequest } from '../../shared/middlewares/auth.middleware';
import * as interacaoService from './interacao.service';
import { toResultadoCheckinDto } from './interacao.mapper';
import { registrarInteracaoSchema } from './dto/registrar-interacao.dto';
import { MinhasInteracoesDto } from './dto/interacao.dto';

/** POST /api/interacoes — check-in ao tocar no objeto 3D. */
export const registrarInteracao = async (req: AuthenticatedRequest, res: Response) => {
  const dto = validar(registrarInteracaoSchema, req.body);
  const resultado = await interacaoService.registrar(req.usuarioId, dto);
  res.status(201).json(toResultadoCheckinDto(resultado));
};

/** GET /api/interacoes/minhas — pontos já coletados pelo usuário. */
export const minhasInteracoes = async (req: AuthenticatedRequest, res: Response) => {
  const resposta: MinhasInteracoesDto = await interacaoService.minhas(req.usuarioId);
  res.status(200).json(resposta);
};
