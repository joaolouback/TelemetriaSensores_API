/**
 * Check-in nos pontos do campus.
 *
 * O check-in acontece quando o jogador toca no objeto 3D exibido em realidade
 * aumentada. O app só libera a câmera dentro do raio, mas a validação de geofence
 * é refeita aqui: o servidor não confia na distância calculada pelo aparelho.
 */
import prisma from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { distanciaEmMetros } from '../../shared/utils/geo';
import * as usuarioService from '../usuario/usuario.service';
import * as pontoService from '../ponto/ponto.service';
import * as conquistaService from '../conquista/conquista.service';
import * as desafioService from '../desafio/desafio.service';
import { ColetaDesafioDto } from '../desafio/dto/desafio.dto';
import { Usuario } from '../usuario/entities/usuario.entity';
import { PontoComObjeto } from '../ponto/entities/ponto-de-interesse.entity';
import { Conquista } from '../conquista/entities/conquista.entity';
import { Interacao } from './entities/interacao.entity';
import { RegistrarInteracaoDto } from './dto/registrar-interacao.dto';

/**
 * Pior precisão de GPS aceita no check-in. Com raios de 20–30 m, uma leitura de ±50 m
 * já não garante que a pessoa está no ponto; dentro de prédios o GPS costuma ficar abaixo disso.
 */
const PRECISAO_MAXIMA_M = 50;

export interface ResultadoCheckin {
  /** Null quando o ponto já tinha sido coletado e o toque só contou para o desafio. */
  interacao: Interacao | null;
  ponto: PontoComObjeto;
  usuario: Usuario;
  distanciaMetros: number;
  /** Pontos do ponto de interesse (0 se já tinha sido coletado antes). */
  pontosGanhos: number;
  novasConquistas: Conquista[];
  /** Efeito no desafio 1x1 em andamento, se o ponto faz parte dele. */
  desafio: ColetaDesafioDto | null;
}

/**
 * Registra o check-in do usuário em um ponto.
 *
 * Toda tentativa vira uma `Interacao`: dentro do raio com `validadoGeofence = true`
 * (e os pontos são creditados), fora dele com `false`, como registro da tentativa.
 * Cada ponto só rende pontos uma vez por usuário — mas, se ele faz parte do
 * desafio em andamento, a coleta conta para o desafio mesmo que já tenha sido feita.
 *
 * @throws AppError 404 (ponto), 409 (já coletado e fora de desafio) ou 422 (fora do raio)
 */
export async function registrar(
  usuarioId: number,
  { pontoId, latitude, longitude, precisao, mockado }: RegistrarInteracaoDto
): Promise<ResultadoCheckin> {
  // Anti-trapaça: o servidor só recebe a posição que o celular informa, então
  // recusa as que o próprio sistema marca como falsas ou imprecisas demais.
  if (mockado) {
    console.log(`[CHECK-IN] GPS falso recusado: usuario=${usuarioId} ponto=${pontoId}`);
    throw new AppError(422, 'Localização simulada detectada. Desative apps de GPS falso para coletar.');
  }
  if (precisao != null && precisao > PRECISAO_MAXIMA_M) {
    throw new AppError(
      422,
      `Sinal de GPS impreciso (±${Math.round(precisao)} m). Vá para um local mais aberto e tente de novo.`,
      { precisao, precisaoMaxima: PRECISAO_MAXIMA_M }
    );
  }

  const ponto = await pontoService.obterAtivoPorId(pontoId);

  const distancia = distanciaEmMetros(latitude, longitude, ponto.latitude, ponto.longitude);
  const dentroDoRaio = distancia <= ponto.raioGeofence;
  const distanciaMetros = Number(distancia.toFixed(2));

  const resultado = await prisma.$transaction(async (tx) => {
    // Dois check-ins simultâneos no mesmo ponto (toque duplo, reenvio)
    // não podem creditar os pontos duas vezes.
    await usuarioService.travar(tx, usuarioId);

    const jaColetado = await tx.interacao.findFirst({
      where: { usuarioId, pontoDeInteresseId: pontoId, validadoGeofence: true },
    });
    const pendenteNoDesafio = await desafioService.pontoPendente(tx, usuarioId, pontoId);
    if (jaColetado && !pendenteNoDesafio) return { tipo: 'jaColetado' as const };

    // Fora do raio a transação é confirmada assim mesmo: a tentativa fica registrada.
    if (!dentroDoRaio) {
      await tx.interacao.create({
        data: {
          usuarioId,
          pontoDeInteresseId: pontoId,
          latitudeRegistro: latitude,
          longitudeRegistro: longitude,
          validadoGeofence: false,
        },
      });
      return { tipo: 'foraDoRaio' as const };
    }

    let interacao: Interacao | null = null;
    let novasConquistas: Conquista[] = [];

    if (!jaColetado) {
      interacao = await tx.interacao.create({
        data: {
          usuarioId,
          pontoDeInteresseId: pontoId,
          latitudeRegistro: latitude,
          longitudeRegistro: longitude,
          validadoGeofence: true,
        },
      });
      const usuario = await usuarioService.adicionarPontos(tx, usuarioId, ponto.pontosRecompensa);
      novasConquistas = await conquistaService.desbloquearPorPontuacao(tx, usuarioId, usuario.pontuacaoTotal);
    }

    // Pode finalizar o desafio (vitória) e somar o bônus.
    const noDesafio = pendenteNoDesafio
      ? await desafioService.registrarColeta(tx, usuarioId, pontoId)
      : null;
    if (noDesafio) novasConquistas = [...novasConquistas, ...noDesafio.novasConquistas];

    return {
      tipo: 'coletado' as const,
      interacao,
      usuario: await usuarioService.obterPorId(usuarioId, tx),
      pontosGanhos: jaColetado ? 0 : ponto.pontosRecompensa,
      novasConquistas,
      desafio: noDesafio?.coleta ?? null,
    };
  });

  if (resultado.tipo === 'jaColetado') {
    throw new AppError(409, `Você já coletou o objeto de ${ponto.nome}.`);
  }

  if (resultado.tipo === 'foraDoRaio') {
    console.log(`[CHECK-IN] Fora do raio: usuario=${usuarioId} ponto=${pontoId} (${distanciaMetros} m)`);
    throw new AppError(
      422,
      `Você está a ${Math.round(distancia)} m de ${ponto.nome}. Chegue a até ${ponto.raioGeofence} m para coletar.`,
      { distanciaMetros, raioGeofence: ponto.raioGeofence }
    );
  }

  console.log(
    `[CHECK-IN] usuario=${usuarioId} coletou ponto=${pontoId} (+${resultado.pontosGanhos})` +
      (resultado.desafio ? ` — desafio ${resultado.desafio.coletados}/${resultado.desafio.total}` : '')
  );

  return { ...resultado, ponto, distanciaMetros };
}

/** Ids dos pontos já coletados (em ordem de coleta) e a pontuação do usuário. */
export async function minhas(usuarioId: number): Promise<{ pontosColetados: number[]; pontuacaoTotal: number }> {
  const [coletadas, usuario] = await Promise.all([
    prisma.interacao.findMany({
      where: { usuarioId, validadoGeofence: true },
      select: { pontoDeInteresseId: true },
      orderBy: { dataHora: 'asc' },
    }),
    usuarioService.obterPorId(usuarioId),
  ]);

  return {
    pontosColetados: coletadas.map((i) => i.pontoDeInteresseId),
    pontuacaoTotal: usuario.pontuacaoTotal,
  };
}
