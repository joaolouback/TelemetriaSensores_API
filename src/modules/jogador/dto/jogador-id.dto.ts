import { z } from 'zod';

/** Parâmetro `:id` de `GET /api/jogadores/:id`. */
export const jogadorIdSchema = z.object({
  id: z.preprocess(
    (v) => parseInt(String(v), 10),
    z.number({ error: 'O id do jogador deve ser numérico.' })
  ),
});
