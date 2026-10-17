import bcrypt from 'bcryptjs';
import { AppError } from '../../shared/errors/app-error';
import { Usuario } from '../usuario/entities/usuario.entity';
import * as usuarioService from '../usuario/usuario.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';

export async function registrar({ nome, email, senha }: RegistroDto): Promise<Usuario> {
  if (await usuarioService.buscarPorEmail(email)) {
    throw new AppError(409, 'Já existe uma conta com este e-mail.');
  }

  const usuario = await usuarioService.criar({ nome, email, senhaHash: await bcrypt.hash(senha, 10) });
  console.log(`[AUTH] Novo usuário registrado: id=${usuario.id}`);
  return usuario;
}

export async function login({ email, senha }: LoginDto): Promise<Usuario> {
  const usuario = await usuarioService.buscarPorEmail(email);

  // Mesma mensagem para e-mail inexistente e senha errada, para não revelar contas.
  if (!usuario || !usuario.senhaHash || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    throw new AppError(401, 'E-mail ou senha incorretos.');
  }

  return usuario;
}
