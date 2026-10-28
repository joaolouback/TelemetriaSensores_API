import { UsuarioPublicoDto } from '../../usuario/dto/usuario-publico.dto';

/** Resposta de login e registro. */
export interface SessaoDto {
  token: string;
  usuario: UsuarioPublicoDto;
}
