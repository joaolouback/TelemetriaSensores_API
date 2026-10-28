/**
 * Geração e validação do JWT de sessão.
 *
 * O token carrega apenas o id do usuário (`sub`). É emitido no login/registro
 * e enviado pelo app no header `Authorization: Bearer <token>` (ou no campo
 * `token` das mensagens do WebSocket).
 */
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definida. Adicione a variável no arquivo .env (veja .env.example).');
}

// Sessão longa: o app funciona offline e não deve deslogar o usuário no meio do campus.
const JWT_EXPIRES_IN = '30d';

export const gerarToken = (usuarioId: number): string =>
  jwt.sign({ sub: String(usuarioId) }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/** Retorna o id do usuário se o token for válido, ou null caso contrário. */
export const verificarToken = (token: string | undefined | null): number | null => {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    const id = Number(payload.sub);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
};
