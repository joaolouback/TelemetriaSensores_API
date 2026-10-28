/**
 * Testes de integração da API: requisições HTTP reais (Supertest) contra um
 * PostgreSQL de verdade, num banco separado (`uvvgo_test`) que é recriado do
 * zero a cada execução. O banco de desenvolvimento nunca é tocado.
 *
 * Local: com o Docker do projeto no ar (`npm run db:up`), rode `npm test`.
 * CI: o GitHub Actions sobe um Postgres e define TEST_DATABASE_URL.
 */
import { defineConfig } from 'vitest/config';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/uvvgo_test?schema=public';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/setup/banco-de-teste.ts'],
    // Os arquivos compartilham o mesmo banco: rodam um de cada vez.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 120_000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: 'segredo-apenas-para-testes',
    },
  },
});
