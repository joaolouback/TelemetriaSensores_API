import { Request, Response } from 'express';
import { validar } from '../../shared/http/validar';
import { AuthenticatedRequest } from '../../shared/middlewares/auth.middleware';
import * as usuarioService from '../usuario/usuario.service';
import { toUsuarioPublicoDto } from '../usuario/usuario.mapper';
import * as authService from './auth.service';
import { toSessaoDto } from './auth.mapper';
import { registroSchema } from './dto/registro.dto';
import { loginSchema } from './dto/login.dto';

export const registrar = async (req: Request, res: Response) => {
  const usuario = await authService.registrar(validar(registroSchema, req.body));
  res.status(201).json(toSessaoDto(usuario));
};

export const login = async (req: Request, res: Response) => {
  const usuario = await authService.login(validar(loginSchema, req.body));
  res.status(200).json(toSessaoDto(usuario));
};

export const perfil = async (req: AuthenticatedRequest, res: Response) => {
  const usuario = await usuarioService.obterPorId(req.usuarioId);
  res.status(200).json(toUsuarioPublicoDto(usuario));
};
