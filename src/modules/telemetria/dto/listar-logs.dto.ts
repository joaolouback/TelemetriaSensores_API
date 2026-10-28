import { z } from 'zod';

/** Inteiro da query string; valores ausentes ou inválidos caem no padrão. */
const inteiro = (padrao: number, min: number, max: number) =>
  z.preprocess((v) => {
    const n = parseInt(String(v), 10);
    return Number.isNaN(n) || n === 0 ? padrao : Math.min(Math.max(n, min), max);
  }, z.number());

/** Query de `GET /api/logs?page=&limit=` — nunca falha, só normaliza. */
export const listarLogsSchema = z.object({
  page: inteiro(1, 1, Number.MAX_SAFE_INTEGER),
  limit: inteiro(10, 1, 100),
});

export type ListarLogsDto = z.output<typeof listarLogsSchema>;
