/** Entidades do desafio 1x1 (Desafio, DesafioPonto, DesafioColeta), derivadas do Prisma. */
import { Prisma } from '@prisma/client';

export type { Desafio, DesafioPonto, DesafioColeta } from '@prisma/client';
export { StatusDesafio } from '@prisma/client';

/** O que o service carrega de um desafio para montar a resposta. */
export const incluirDesafioCompleto = {
  pontos: { include: { ponto: true }, orderBy: { ordem: 'asc' } },
  coletas: { orderBy: { dataHora: 'asc' } },
  desafiante: { select: { id: true, nome: true } },
  desafiado: { select: { id: true, nome: true } },
} satisfies Prisma.DesafioInclude;

export type DesafioCompleto = Prisma.DesafioGetPayload<{ include: typeof incluirDesafioCompleto }>;
