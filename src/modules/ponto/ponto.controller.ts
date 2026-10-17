import { Request, Response } from 'express';
import { validar } from '../../shared/http/validar';
import * as pontoService from './ponto.service';
import { toPontoDto, toPontoProximoDto } from './ponto.mapper';
import { pontosProximosSchema } from './dto/pontos-proximos.dto';
import { pontoIdSchema } from './dto/ponto-id.dto';

/** GET /api/pontos — lista todos os pontos ativos do campus. */
export const listarPontos = async (_req: Request, res: Response) => {
  const pontos = (await pontoService.listarAtivos()).map(toPontoDto);
  res.status(200).json({ data: pontos, total: pontos.length });
};

/**
 * GET /api/pontos/proximos?lat=&lon=
 * Pontos ordenados por distância da posição, indicando quais estão dentro do raio.
 */
export const pontosProximos = async (req: Request, res: Response) => {
  const { lat, lon } = validar(pontosProximosSchema, req.query);
  const data = (await pontoService.listarPorDistancia(lat, lon)).map(({ ponto, distancia }) =>
    toPontoProximoDto(ponto, distancia)
  );

  res.status(200).json({
    origem: { latitude: lat, longitude: lon },
    data,
    dentroDeAlgumRaio: data.filter((p) => p.dentroDoRaio).map((p) => p.nome),
  });
};

/** GET /api/pontos/:id — detalha um ponto específico. */
export const obterPonto = async (req: Request, res: Response) => {
  const { id } = validar(pontoIdSchema, req.params);
  res.status(200).json({ data: toPontoDto(await pontoService.obterPorId(id)) });
};
