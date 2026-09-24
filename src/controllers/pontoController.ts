/**
 * Controller dos Pontos de Interesse (pontos de coleta do campus).
 * Alimenta o mapa do aplicativo e a validação de geofencing (CS02 e CS03).
 */
import { Request, Response } from 'express';
import prisma from '../database/prisma';
import { distanciaEmMetros } from '../utils/geo';

/** GET /api/pontos — lista todos os pontos ativos do campus. */
export const listarPontos = async (_req: Request, res: Response): Promise<any> => {
  try {
    const pontos = await prisma.pontoDeInteresse.findMany({
      where: { ativo: true },
      orderBy: { id: 'asc' },
      include: { objeto3d: true }
    });

    return res.status(200).json({ data: pontos, total: pontos.length });
  } catch (error) {
    console.error('Erro ao listar pontos de interesse:', error);
    return res.status(500).json({ error: 'Erro interno ao listar pontos de interesse.' });
  }
};

/**
 * GET /api/pontos/proximos?lat=&lon=
 * Retorna os pontos ordenados por distância da posição informada,
 * já indicando quais estão dentro do raio de geofence.
 */
export const pontosProximos = async (req: Request, res: Response): Promise<any> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        error: 'Informe os parâmetros numéricos `lat` e `lon`. Ex: /api/pontos/proximos?lat=-20.3417&lon=-40.2917'
      });
    }

    const pontos = await prisma.pontoDeInteresse.findMany({
      where: { ativo: true },
      include: { objeto3d: true }
    });

    const comDistancia = pontos
      .map((ponto) => {
        const distancia = distanciaEmMetros(lat, lon, ponto.latitude, ponto.longitude);
        return {
          ...ponto,
          distanciaMetros: Number(distancia.toFixed(2)),
          dentroDoRaio: distancia <= ponto.raioGeofence
        };
      })
      .sort((a, b) => a.distanciaMetros - b.distanciaMetros);

    return res.status(200).json({
      origem: { latitude: lat, longitude: lon },
      data: comDistancia,
      dentroDeAlgumRaio: comDistancia.filter((p) => p.dentroDoRaio).map((p) => p.nome)
    });
  } catch (error) {
    console.error('Erro ao calcular pontos próximos:', error);
    return res.status(500).json({ error: 'Erro interno ao calcular pontos próximos.' });
  }
};

/** GET /api/pontos/:id — detalha um ponto específico. */
export const obterPonto = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'O id do ponto deve ser numérico.' });
    }

    const ponto = await prisma.pontoDeInteresse.findUnique({
      where: { id },
      include: { objeto3d: true }
    });

    if (!ponto) {
      return res.status(404).json({ error: `Ponto de interesse ${id} não encontrado.` });
    }

    return res.status(200).json({ data: ponto });
  } catch (error) {
    console.error('Erro ao obter ponto de interesse:', error);
    return res.status(500).json({ error: 'Erro interno ao obter ponto de interesse.' });
  }
};
