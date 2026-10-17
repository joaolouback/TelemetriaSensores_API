import { gerarToken } from '../../shared/utils/jwt';
import { Usuario } from '../usuario/entities/usuario.entity';
import { toUsuarioPublicoDto } from '../usuario/usuario.mapper';
import { SessaoDto } from './dto/sessao.dto';

/** Emite o token do usuário e monta a resposta de sessão. */
export const toSessaoDto = (usuario: Usuario): SessaoDto => ({
  token: gerarToken(usuario.id),
  usuario: toUsuarioPublicoDto(usuario),
});
