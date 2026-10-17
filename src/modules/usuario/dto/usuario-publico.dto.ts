/** Dados do usuário que podem sair na API — nunca inclui `senhaHash`. */
export interface UsuarioPublicoDto {
  id: number;
  nome: string;
  email: string;
  pontuacaoTotal: number;
  dataCadastro: Date;
}
