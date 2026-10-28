import { ConquistaDto } from '../../conquista/dto/conquista.dto';
import { ColetaDesafioDto } from '../../desafio/dto/desafio.dto';

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
  /** Null quando o ponto já tinha sido coletado e o toque só contou para o desafio. */
  interacao: InteracaoDto | null;
  distanciaMetros: number;
  /** 0 quando o ponto já tinha sido coletado antes (só contou para o desafio). */
  pontosGanhos: number;
  pontuacaoTotal: number;
  novasConquistas: ConquistaDto[];
  /** Progresso no desafio 1x1, se o ponto faz parte do desafio em andamento. */
  desafio: ColetaDesafioDto | null;
}

/** Resposta de `GET /api/interacoes/minhas`. */
export interface MinhasInteracoesDto {
  pontosColetados: number[];
  pontuacaoTotal: number;
}
