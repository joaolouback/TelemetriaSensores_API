/**
 * Utilitários de autenticação: geração/validação de JWT e middlewares do Express.
 *
 * O token carrega apenas o id do usuário (`sub`). É emitido no login/registro
 * e enviado pelo app no header `Authorization: Bearer <token>`.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definida. Adicione a variável no arquivo .env (veja .env.example).');
}

// Sessão longa: o app funciona offline e não deve deslogar o usuário no meio do campus.
const JWT_EXPIRES_IN = '30d';

export interface AuthRequest extends Request {
  usuarioId?: number;
}

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

const extrairBearer = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
};

/** Exige token válido. Responde 401 se ausente ou inválido. */
export const autenticar = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const usuarioId = verificarToken(extrairBearer(req));
  if (usuarioId === null) {
    res.status(401).json({ error: 'Token ausente ou inválido.' });
    return;
  }
  req.usuarioId = usuarioId;
  next();
};

/**
 * Aceita requisições sem token (telemetria coletada antes do login),
 * mas se houver um token válido associa o usuário à requisição.
 */
export const autenticacaoOpcional = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const usuarioId = verificarToken(extrairBearer(req));
  if (usuarioId !== null) req.usuarioId = usuarioId;
  next();
};
