/**
 * Limites de tentativas nas rotas de autenticação (proteção contra força bruta).
 *
 * No campus muitos alunos saem pelo mesmo IP (Wi-Fi da universidade), então o login
 * é limitado por IP + e-mail: errar a senha de uma conta não bloqueia a turma inteira.
 */
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const JANELA_MS = 15 * 60 * 1000;

const opcoesComuns = {
  windowMs: JANELA_MS,
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
};

/** 10 tentativas de login ERRADAS por e-mail e IP a cada 15 minutos. */
export const limiteLogin = rateLimit({
  ...opcoesComuns,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip ?? '')}|${String(req.body?.email ?? '').trim().toLowerCase()}`,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos e tente de novo.' },
});

/** 30 cadastros por IP a cada 15 minutos — folga para uma turma se cadastrar junta. */
export const limiteRegistro = rateLimit({
  ...opcoesComuns,
  limit: 30,
  message: { error: 'Muitos cadastros a partir desta rede. Aguarde alguns minutos.' },
});
