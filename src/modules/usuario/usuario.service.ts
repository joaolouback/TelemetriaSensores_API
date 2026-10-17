/**
 * Acesso aos dados de usuário, compartilhado pelos módulos de auth e interação.
 */
import prisma, { DbClient } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { Usuario } from './entities/usuario.entity';

export const buscarPorEmail = (email: string): Promise<Usuario | null> =>
  prisma.usuario.findUnique({ where: { email } });

/** Lança 404 se o usuário não existir (ex.: conta apagada com token ainda válido). */
export async function obterPorId(id: number): Promise<Usuario> {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new AppError(404, 'Usuário não encontrado.');
  return usuario;
}

export const criar = (dados: { nome: string; email: string; senhaHash: string }): Promise<Usuario> =>
  prisma.usuario.create({ data: dados });

/** Soma pontos à pontuação total. Recebe o `tx` quando faz parte de uma transação. */
export const adicionarPontos = (db: DbClient, id: number, pontos: number): Promise<Usuario> =>
  db.usuario.update({ where: { id }, data: { pontuacaoTotal: { increment: pontos } } });

/**
 * Trava a linha do usuário até o fim da transação. Serializa operações
 * concorrentes do mesmo usuário (ex.: dois toques no mesmo objeto em AR).
 */
export async function travar(tx: DbClient, id: number): Promise<void> {
  await tx.$queryRaw`SELECT id FROM usuario WHERE id = ${id} FOR UPDATE`;
}
