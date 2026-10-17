import { Conquista } from './entities/conquista.entity';
import { ConquistaDto } from './dto/conquista.dto';

export const toConquistaDto = (conquista: Conquista): ConquistaDto => ({
  id: conquista.id,
  titulo: conquista.titulo,
  descricao: conquista.descricao,
  iconeUrl: conquista.iconeUrl,
  pontosNecessarios: conquista.pontosNecessarios,
});
