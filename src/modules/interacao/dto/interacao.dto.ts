import { ConquistaDto } from '../../conquista/dto/conquista.dto';

export interface InteracaoDto {
  id: number;
  usuarioId: number;
  pontoDeInteresseId: number;
  dataHora: Date;
  latitudeRegistro: number;
  longitudeRegistro: number;
  validadoGeofence: boolean;
}

/** Resposta do check-in bem-sucedido. */
export interface ResultadoCheckinDto {
  interacao: InteracaoDto;
  distanciaMetros: number;
  pontosGanhos: number;
  pontuacaoTotal: number;
  novasConquistas: ConquistaDto[];
}

/** Resposta de `GET /api/interacoes/minhas`. */
export interface MinhasInteracoesDto {
  pontosColetados: number[];
  pontuacaoTotal: number;
}
