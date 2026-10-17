/**
 * Instância única (singleton) do Prisma Client.
 * Substitui o antigo pool do mysql2.
 *
 * No Prisma 7 a conexão é feita por um driver adapter — aqui o `@prisma/adapter-pg`,
 * que usa o driver `pg` por baixo e mantém um pool de conexões.
 */
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL não definida. Crie o arquivo .env na raiz com a string de conexão do Postgres.'
  );
}

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

/**
 * Cliente aceito pelos services: o `prisma` global ou o `tx` de uma transação.
 * Permite que um service participe da transação aberta por outro módulo.
 */
export type DbClient = Prisma.TransactionClient;

export default prisma;
