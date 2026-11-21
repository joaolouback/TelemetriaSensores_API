export interface RankingItemDto {
  posicao: number;
  id: number;
  /** Primeiro nome e inicial do sobrenome (ex.: "João L."). */
  nome: string;
  pontuacaoTotal: number;
  /** Caminho relativo ao servidor; nulo se o jogador não tem foto. */
  fotoUrl: string | null;
}

export interface RankingDto {
  /** Total de jogadores cadastrados. */
  total: number;
  jogadores: RankingItemDto[];
  /** O usuário logado, mesmo quando está fora da lista. */
  eu: RankingItemDto;
}
