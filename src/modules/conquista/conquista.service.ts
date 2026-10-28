import { DbClient } from '../../shared/database/prisma';
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
    });
  }

  return novas;
}
