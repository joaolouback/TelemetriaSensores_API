/** Entidade PontoDeInteresse (diagrama de classes), derivada do Prisma. */
import { Prisma } from '@prisma/client';

export type { PontoDeInteresse } from '@prisma/client';

/** Ponto carregado junto com o seu objeto 3D — forma usada por todo o módulo. */
export type PontoComObjeto = Prisma.PontoDeInteresseGetPayload<{ include: { objeto3d: true } }>;
