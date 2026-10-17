import { z } from 'zod';

/** Parâmetro `:id` de `GET /api/pontos/:id`. */
export const pontoIdSchema = z.object({
  id: z.preprocess(
    (v) => parseInt(String(v), 10),
    z.number({ error: 'O id do ponto deve ser numérico.' })
  ),
});
