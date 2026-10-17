import { StatusDesafio } from '../entities/desafio.entity';

export interface PontoDesafioDto {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
  raioGeofence: number;
}

export interface JogadorDesafioDto {
  id: number;
  nome: string;
  /** Ids dos pontos do desafio que este jogador já coletou, em ordem de coleta. */
  coletados: number[];
}

/** Desafio visto por um dos participantes (`eu` é sempre quem pediu). */
export interface DesafioDto {
  id: number;
  codigo: string;
  status: StatusDesafio;
  papel: 'desafiante' | 'desafiado';
  criadoEm: Date;
  /** Até quando o código de convite vale (só enquanto AGUARDANDO). */
  conviteExpiraEm: Date;
  iniciadoEm: Date | null;
  terminaEm: Date | null;
  finalizadoEm: Date | null;
  /** Hora do servidor, para o app acertar o cronômetro mesmo com o relógio do celular adiantado. */
  agora: Date;
  pontos: PontoDesafioDto[];
  eu: JogadorDesafioDto;
  /** Null enquanto ninguém entrou com o código. */
  oponente: JogadorDesafioDto | null;
  /** Do ponto de vista de `eu`; null enquanto não terminou. */
  resultado: 'vitoria' | 'derrota' | 'empate' | null;
  /** Pontos de bônus que o vencedor ganha. */
  bonusVitoria: number;
}

export interface HistoricoDesafiosDto {
  vitorias: number;
  derrotas: number;
  empates: number;
  desafios: DesafioDto[];
}

/** Efeito de um check-in no desafio em andamento (vai junto na resposta do check-in). */
export interface ColetaDesafioDto {
  desafioId: number;
  coletados: number;
  total: number;
  finalizado: boolean;
  resultado: 'vitoria' | 'derrota' | 'empate' | null;
  bonus: number;
}
