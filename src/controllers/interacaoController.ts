/**
 * Controller das Interações (check-in nos pontos do campus).
 *
 * O check-in acontece quando o jogador toca no objeto 3D exibido em realidade
 * aumentada. O app só libera a câmera dentro do raio, mas a validação de geofence
 * é refeita aqui: o servidor não confia na distância calculada pelo aparelho.
 */
import { Response } from 'express';
import prisma from '../database/prisma';
import { AuthRequest } from '../utils/auth';
import { distanciaEmMetros } from '../utils/geo';

const coordenadaValida = (valor: unknown, limite: number): valor is number =>
  typeof valor === 'number' && Number.isFinite(valor) && Math.abs(valor) <= limite;

/**
 * POST /api/interacoes — registra o check-in do usuário em um ponto.
 *
 * Toda tentativa vira uma `Interacao`: dentro do raio com `validadoGeofence = true`
 * (e os pontos são creditados), fora dele com `false`, como registro da tentativa.
 * Cada ponto só rende pontos uma vez por usuário.
 */
export const registrarInteracao = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.usuarioId!;
    const pontoId = Number(req.body?.pontoId);
    const { latitude, longitude } = req.body ?? {};

    if (!Number.isInteger(pontoId)) {
      return res.status(400).json({ error: 'Informe o `pontoId` numérico do ponto.' });
    }
    if (!coordenadaValida(latitude, 90) || !coordenadaValida(longitude, 180)) {
      return res.status(400).json({ error: 'Informe `latitude` e `longitude` válidas.' });
    }

    const ponto = await prisma.pontoDeInteresse.findFirst({ where: { id: pontoId, ativo: true } });
    if (!ponto) {
      return res.status(404).json({ error: `Ponto de interesse ${pontoId} não encontrado.` });
    }

    const distancia = distanciaEmMetros(latitude, longitude, ponto.latitude, ponto.longitude);
    const dentroDoRaio = distancia <= ponto.raioGeofence;
    const distanciaMetros = Number(distancia.toFixed(2));

    const resultado = await prisma.$transaction(async (tx) => {
      // Trava a linha do usuário: dois check-ins simultâneos no mesmo ponto
      // (toque duplo, reenvio) não podem creditar os pontos duas vezes.
      await tx.$queryRaw`SELECT id FROM usuario WHERE id = ${usuarioId} FOR UPDATE`;

      const jaColetado = await tx.interacao.findFirst({
        where: { usuarioId, pontoDeInteresseId: pontoId, validadoGeofence: true },
      });
      if (jaColetado) return { tipo: 'jaColetado' as const };

      const interacao = await tx.interacao.create({
        data: {
          usuarioId,
          pontoDeInteresseId: pontoId,
          latitudeRegistro: latitude,
          longitudeRegistro: longitude,
          validadoGeofence: dentroDoRaio,
        },
      });

      if (!dentroDoRaio) return { tipo: 'foraDoRaio' as const };

      const usuario = await tx.usuario.update({
        where: { id: usuarioId },
        data: { pontuacaoTotal: { increment: ponto.pontosRecompensa } },
      });

      // Conquistas alcançadas pela nova pontuação que o usuário ainda não tinha.
      const novasConquistas = await tx.conquista.findMany({
        where: {
          pontosNecessarios: { lte: usuario.pontuacaoTotal },
          usuarios: { none: { usuarioId } },
        },
        orderBy: { pontosNecessarios: 'asc' },
      });
      if (novasConquistas.length > 0) {
        await tx.usuarioConquista.createMany({
          data: novasConquistas.map((c) => ({ usuarioId, conquistaId: c.id })),
        });
      }

      return { tipo: 'coletado' as const, interacao, usuario, novasConquistas };
    });

    if (resultado.tipo === 'jaColetado') {
      return res.status(409).json({ error: `Você já coletou o objeto de ${ponto.nome}.` });
    }

    if (resultado.tipo === 'foraDoRaio') {
      console.log(`[CHECK-IN] Fora do raio: usuario=${usuarioId} ponto=${pontoId} (${distanciaMetros} m)`);
      return res.status(422).json({
        error: `Você está a ${Math.round(distancia)} m de ${ponto.nome}. Chegue a até ${ponto.raioGeofence} m para coletar.`,
        distanciaMetros,
        raioGeofence: ponto.raioGeofence,
      });
    }

    const { interacao, usuario, novasConquistas } = resultado;
    console.log(`[CHECK-IN] usuario=${usuarioId} coletou ponto=${pontoId} (+${ponto.pontosRecompensa})`);

    return res.status(201).json({
      interacao: { ...interacao, id: Number(interacao.id) },
      distanciaMetros,
      pontosGanhos: ponto.pontosRecompensa,
      pontuacaoTotal: usuario.pontuacaoTotal,
      novasConquistas,
    });
  } catch (error) {
    console.error('Erro ao registrar interação:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao registrar o check-in.' });
  }
};

/**
 * GET /api/interacoes/minhas — ids dos pontos já coletados e a pontuação do usuário.
 * Usado pelo app para não oferecer a câmera em pontos já coletados.
 */
export const minhasInteracoes = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.usuarioId!;

    const [coletadas, usuario] = await Promise.all([
      prisma.interacao.findMany({
        where: { usuarioId, validadoGeofence: true },
        select: { pontoDeInteresseId: true, dataHora: true },
        orderBy: { dataHora: 'asc' },
      }),
      prisma.usuario.findUnique({ where: { id: usuarioId }, select: { pontuacaoTotal: true } }),
    ]);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.status(200).json({
      pontosColetados: coletadas.map((i) => i.pontoDeInteresseId),
      pontuacaoTotal: usuario.pontuacaoTotal,
    });
  } catch (error) {
    console.error('Erro ao listar interações:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao listar interações.' });
  }
};
