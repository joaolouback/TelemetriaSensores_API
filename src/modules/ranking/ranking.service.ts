/**
 * Ranking dos jogadores por pontuação total.
 *
 * Ordem: mais pontos primeiro; em empate, quem se cadastrou antes (e, por fim, o menor id),
 * para a posição ser sempre a mesma entre uma consulta e outra.
 */
import prisma from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { RankingDto, RankingItemDto } from './dto/ranking.dto';
import { aparencia } from '../loja/loja.catalogo';

const LIMITE_PADRAO = 20;

/** "João Pedro Estevão Louback" vira "João L." — o ranking é visto por todos. */
export function nomeParaExibicao(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[partes.length - 1][0].toUpperCase()}.`;
}

/** Posição = quantos jogadores estão à frente + 1 (mesmo critério de desempate da lista). */
export async function posicaoDoJogador(j: { id: number; pontuacaoTotal: number; dataCadastro: Date }): Promise<number> {
  const aFrente = await prisma.usuario.count({
    where: {
      OR: [
        { pontuacaoTotal: { gt: j.pontuacaoTotal } },
        { pontuacaoTotal: j.pontuacaoTotal, dataCadastro: { lt: j.dataCadastro } },
        { pontuacaoTotal: j.pontuacaoTotal, dataCadastro: j.dataCadastro, id: { lt: j.id } },
      ],
    },
  });
  return aFrente + 1;
}

export async function obter(usuarioId: number, limite = LIMITE_PADRAO): Promise<RankingDto> {
  const [usuarios, total, eu] = await Promise.all([
    prisma.usuario.findMany({
      orderBy: [{ pontuacaoTotal: 'desc' }, { dataCadastro: 'asc' }, { id: 'asc' }],
      take: limite,
      select: { id: true, nome: true, pontuacaoTotal: true, fotoUrl: true, molduraEquipada: true, tituloEquipado: true },
    }),
    prisma.usuario.count(),
    prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        pontuacaoTotal: true,
        fotoUrl: true,
        dataCadastro: true,
        molduraEquipada: true,
        tituloEquipado: true,
      },
    }),
  ]);
  if (!eu) throw new AppError(404, 'Usuário não encontrado.');

  const posicao = await posicaoDoJogador(eu);

  const jogadores: RankingItemDto[] = usuarios.map((u, i) => ({
    posicao: i + 1,
    id: u.id,
    nome: nomeParaExibicao(u.nome),
    pontuacaoTotal: u.pontuacaoTotal,
    fotoUrl: u.fotoUrl,
    ...aparencia(u),
  }));

  return {
    total,
    jogadores,
    eu: {
      posicao,
      id: eu.id,
      nome: nomeParaExibicao(eu.nome),
      pontuacaoTotal: eu.pontuacaoTotal,
      fotoUrl: eu.fotoUrl,
      ...aparencia(eu),
    },
  };
}
