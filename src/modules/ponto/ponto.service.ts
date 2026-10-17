/**
 * Regras dos Pontos de Interesse (pontos de coleta do campus).
 * Alimenta o mapa do aplicativo e a validação de geofencing (CS02 e CS03).
 */
import prisma from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { distanciaEmMetros } from '../../shared/utils/geo';
import { PontoComObjeto } from './entities/ponto-de-interesse.entity';

export const listarAtivos = (): Promise<PontoComObjeto[]> =>
  prisma.pontoDeInteresse.findMany({
    where: { ativo: true },
    orderBy: { id: 'asc' },
    include: { objeto3d: true },
  });

/** Pontos ativos com a distância (Haversine) até a posição, do mais perto ao mais longe. */
export async function listarPorDistancia(
  latitude: number,
  longitude: number
): Promise<{ ponto: PontoComObjeto; distancia: number }[]> {
  const pontos = await listarAtivos();

  return pontos
    .map((ponto) => ({
      ponto,
      distancia: distanciaEmMetros(latitude, longitude, ponto.latitude, ponto.longitude),
    }))
    .sort((a, b) => a.distancia - b.distancia);
}

/** Qualquer ponto (ativo ou não) pelo id. Lança 404 se não existir. */
export async function obterPorId(id: number): Promise<PontoComObjeto> {
  const ponto = await prisma.pontoDeInteresse.findUnique({ where: { id }, include: { objeto3d: true } });
  if (!ponto) throw new AppError(404, `Ponto de interesse ${id} não encontrado.`);
  return ponto;
}

/** Só pontos ativos — usado onde o ponto precisa estar valendo (check-in). */
export async function obterAtivoPorId(id: number): Promise<PontoComObjeto> {
  const ponto = await prisma.pontoDeInteresse.findFirst({ where: { id, ativo: true }, include: { objeto3d: true } });
  if (!ponto) throw new AppError(404, `Ponto de interesse ${id} não encontrado.`);
  return ponto;
}
