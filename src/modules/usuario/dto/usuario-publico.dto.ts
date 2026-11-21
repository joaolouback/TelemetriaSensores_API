/** Dados do usuário que podem sair na API — nunca inclui `senhaHash`. */
export interface UsuarioPublicoDto {
  id: number;
  nome: string;
  email: string;
  pontuacaoTotal: number;
  /** Caminho relativo ao servidor (ex.: `/avatares/3-1730000000000.jpg`); nulo se não tem foto. */
  fotoUrl: string | null;
  dataCadastro: Date;
}
