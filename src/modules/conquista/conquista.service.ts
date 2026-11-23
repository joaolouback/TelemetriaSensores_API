import prisma, { DbClient } from '../../shared/database/prisma';
import { Conquista } from './entities/conquista.entity';

/**
 * Desbloqueia as conquistas que a pontuação atual alcança e o usuário ainda não tinha.
 * Retorna só as recém-desbloqueadas, da menor para a maior exigência.
 */
export async function desbloquearPorPontuacao(
  db: DbClient,
  usuarioId: number,
  pontuacaoTotal: number
): Promise<Conquista[]> {
  const novas = await db.conquista.findMany({
    where: {
      pontosNecessarios: { lte: pontuacaoTotal },
      usuarios: { none: { usuarioId } },
    },
    orderBy: { pontosNecessarios: 'asc' },
  });

  if (novas.length > 0) {
    await db.usuarioConquista.createMany({
      data: novas.map((c) => ({ usuarioId, conquistaId: c.id })),
      // Duas requisições ao mesmo tempo podem achar a mesma conquista nova.
      skipDuplicates: true,
    });
  }

  return novas;
}

/**
 * Todas as conquistas do jogo, indicando quais o usuário já desbloqueou.
 *
 * Antes de listar, desbloqueia as que a pontuação atual já alcança: normalmente isso acontece
 * na coleta ou na vitória de um desafio, mas a pontuação também pode mudar por fora (ajuste
 * no banco, conquista nova cadastrada com exigência menor do que a de jogadores antigos).
 */
export async function listarDoUsuario(usuarioId: number) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { pontuacaoTotal: true } });
  if (usuario) await desbloquearPorPontuacao(prisma, usuarioId, usuario.pontuacaoTotal);

  const [conquistas, desbloqueadas] = await Promise.all([
    prisma.conquista.findMany({ orderBy: { pontosNecessarios: 'asc' } }),
    prisma.usuarioConquista.findMany({ where: { usuarioId } }),
  ]);
  const quando = new Map(desbloqueadas.map((d) => [d.conquistaId, d.dataDesbloqueio]));

  return conquistas.map((c) => ({
    ...c,
    desbloqueada: quando.has(c.id),
    dataDesbloqueio: quando.get(c.id) ?? null,
  }));
}
