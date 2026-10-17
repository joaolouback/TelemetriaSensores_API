import { toConquistaDto } from '../conquista/conquista.mapper';
import { Interacao } from './entities/interacao.entity';
import { InteracaoDto, ResultadoCheckinDto } from './dto/interacao.dto';
import { ResultadoCheckin } from './interacao.service';

export const toInteracaoDto = (interacao: Interacao): InteracaoDto => ({
  // BigInt não é serializável em JSON; os ids cabem com folga em um number.
  id: Number(interacao.id),
  usuarioId: interacao.usuarioId,
  pontoDeInteresseId: interacao.pontoDeInteresseId,
  dataHora: interacao.dataHora,
  latitudeRegistro: interacao.latitudeRegistro,
  longitudeRegistro: interacao.longitudeRegistro,
  validadoGeofence: interacao.validadoGeofence,
});

export const toResultadoCheckinDto = (resultado: ResultadoCheckin): ResultadoCheckinDto => ({
  interacao: resultado.interacao ? toInteracaoDto(resultado.interacao) : null,
  distanciaMetros: resultado.distanciaMetros,
  pontosGanhos: resultado.pontosGanhos,
  pontuacaoTotal: resultado.usuario.pontuacaoTotal,
  novasConquistas: resultado.novasConquistas.map(toConquistaDto),
  desafio: resultado.desafio,
});
