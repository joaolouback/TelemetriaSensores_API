/**
 * Prepara o banco de teste antes de todos os testes: cria o banco se não existir,
 * apaga o schema, aplica as migrations e roda o seed. Assim cada execução começa
 * do mesmo estado, com os 10 pontos do campus e as conquistas.
 */
import { execSync } from 'child_process';
import { Client } from 'pg';

const URL_TESTE =
  process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/uvvgo_test?schema=public';

export default async function prepararBancoDeTeste() {
  const url = new URL(URL_TESTE);
  const nomeBanco = url.pathname.slice(1);
  if (!/^[a-z0-9_]+$/.test(nomeBanco) || !nomeBanco.includes('test')) {
    throw new Error(`Por segurança, o banco de teste precisa ter "test" no nome (recebido: ${nomeBanco}).`);
  }

  // 1) Cria o banco, conectando no banco administrativo "postgres".
  const admin = new Client({ connectionString: URL_TESTE.replace(`/${nomeBanco}`, '/postgres') });
  await admin.connect();
  const existe = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [nomeBanco]);
  if (existe.rowCount === 0) await admin.query(`CREATE DATABASE ${nomeBanco}`);
  await admin.end();

  // 2) Começa do zero.
  const banco = new Client({ connectionString: URL_TESTE });
  await banco.connect();
  await banco.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
  await banco.end();

  // 3) Migrations + seed, como num ambiente novo.
  const env = { ...process.env, DATABASE_URL: URL_TESTE };
  execSync('npx prisma migrate deploy', { env, stdio: 'pipe' });
  execSync('npx tsx prisma/seed.ts', { env, stdio: 'pipe' });
}
