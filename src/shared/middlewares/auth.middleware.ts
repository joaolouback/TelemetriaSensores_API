/**
 * Middlewares de autenticação do Express (token JWT no header `Authorization: Bearer`).
 */
import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  usuarioId?: number;
}

/** Requisição que passou por `autenticar` — o id do usuário está garantido. */
export interface AuthenticatedRequest extends Request {
  usuarioId: number;
}

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
