import { Usuario } from './entities/usuario.entity';
import { UsuarioPublicoDto } from './dto/usuario-publico.dto';

export const toUsuarioPublicoDto = (usuario: Usuario): UsuarioPublicoDto => ({
  id: usuario.id,
  nome: usuario.nome,
  email: usuario.email,
  pontuacaoTotal: usuario.pontuacaoTotal,
  dataCadastro: usuario.dataCadastro,
});
