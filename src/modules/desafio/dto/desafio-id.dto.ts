import { z } from 'zod';

/** Parâmetro `:id` das rotas de desafio. */
export const desafioIdSchema = z.object({
  id: z.preprocess(
    (v) => parseInt(String(v), 10),
    z.number({ error: 'O id do desafio deve ser numérico.' })
  ),
});
