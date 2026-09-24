import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../database/prisma';
import { AuthRequest, gerarToken } from '../utils/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MIN = 6;

/** Campos públicos do usuário — nunca expor `senhaHash`. */
const usuarioPublico = {
  id: true,
  nome: true,
  email: true,
  pontuacaoTotal: true,
  dataCadastro: true,
} as const;

export const registrar = async (req: Request, res: Response): Promise<any> => {
  try {
    const nome = String(req.body?.nome ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const senha = String(req.body?.senha ?? '');

    if (nome.length < 2) {
      return res.status(400).json({ error: 'Informe o nome (mínimo 2 caracteres).' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }
    if (senha.length < SENHA_MIN) {
      return res.status(400).json({ error: `A senha deve ter pelo menos ${SENHA_MIN} caracteres.` });
    }

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      return res.status(409).json({ error: 'Já existe uma conta com este e-mail.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: { nome, email, senhaHash },
      select: usuarioPublico,
    });

    console.log(`[AUTH] Novo usuário registrado: id=${usuario.id}`);

    return res.status(201).json({ token: gerarToken(usuario.id), usuario });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao registrar usuário.' });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const senha = String(req.body?.senha ?? '');

    if (!email || !senha) {
      return res.status(400).json({ error: 'Informe e-mail e senha.' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    // Mesma mensagem para e-mail inexistente e senha errada, para não revelar contas.
    if (!usuario || !usuario.senhaHash || !(await bcrypt.compare(senha, usuario.senhaHash))) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const { senhaHash, ...publico } = usuario;

    return res.status(200).json({ token: gerarToken(usuario.id), usuario: publico });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao fazer login.' });
  }
};

export const perfil = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuarioId },
      select: usuarioPublico,
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao buscar perfil.' });
  }
};
