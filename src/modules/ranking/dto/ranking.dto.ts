import { VisualItem } from '../../loja/loja.catalogo';

export interface RankingItemDto {
  posicao: number;
  id: number;
  /** Primeiro nome e inicial do sobrenome (ex.: "João L."). */
  nome: string;
  pontuacaoTotal: number;
  /** Caminho relativo ao servidor; nulo se o jogador não tem foto. */
  fotoUrl: string | null;
  /** Moldura da foto comprada na loja (cores e brilho); nula = sem moldura. */
  moldura: ({ codigo: string } & VisualItem) | null;
  /** Título comprado na loja, exibido abaixo do nome. */
  titulo: string | null;
}

export interface RankingDto {
  /** Total de jogadores cadastrados. */
  total: number;
  jogadores: RankingItemDto[];
  /** O usuário logado, mesmo quando está fora da lista. */
  eu: RankingItemDto;
}
