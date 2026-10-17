import { z } from 'zod';

const MSG = 'Informe e-mail e senha.';

/** Corpo de `POST /api/auth/login`. */
export const loginSchema = z.object({
  email: z.string({ error: MSG }).trim().toLowerCase().min(1, { error: MSG }),
  senha: z.string({ error: MSG }).min(1, { error: MSG }),
});

export type LoginDto = z.output<typeof loginSchema>;
