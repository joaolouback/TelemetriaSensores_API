/**
 * Perfil público de um jogador, aberto a partir do ranking.
 * Mostra só o que serve ao jogo: nunca o e-mail, e o nome vai abreviado.
 */
import prisma from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import * as conquistaService from '../conquista/conquista.service';
import * as desafioService from '../desafio/desafio.service';
import { nomeParaExibicao, posicaoDoJogador } from '../ranking/ranking.service';
import { aparencia } from '../loja/loja.catalogo';

export async function perfilPublico(jogadorId: number, solicitanteId: number) {
  const jogador = await prisma.usuario.findUnique({
    where: { id: jogadorId },
    select: {
      id: true,
      nome: true,
      fotoUrl: true,
      pontuacaoTotal: true,
      dataCadastro: true,
      molduraEquipada: true,
      tituloEquipado: true,
    },
  });
  if (!jogador) throw new AppError(404, 'Jogador não encontrado.');

  const [posicao, conquistas, locais, desafios] = await Promise.all([
    posicaoDoJogador(jogador),
    conquistaService.listarDoUsuario(jogadorId),
    prisma.interacao.findMany({
      where: { usuarioId: jogadorId, validadoGeofence: true },
      distinct: ['pontoDeInteresseId'],
      select: { pontoDeInteresseId: true },
    }),
    desafioService.placar(jogadorId),
  ]);

  return {
    id: jogador.id,
    nome: nomeParaExibicao(jogador.nome),
    fotoUrl: jogador.fotoUrl,
    ...aparencia(jogador),
    pontuacaoTotal: jogador.pontuacaoTotal,
    posicao,
    membroDesde: jogador.dataCadastro,
    locaisColetados: locais.length,
    desafios,
    conquistas: conquistas.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      descricao: c.descricao,
      pontosNecessarios: c.pontosNecessarios,
      desbloqueada: c.desbloqueada,
      dataDesbloqueio: c.dataDesbloqueio,
    })),
    ehVoce: jogadorId === solicitanteId,
  };
}
