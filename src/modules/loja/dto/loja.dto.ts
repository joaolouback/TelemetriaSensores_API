import { z } from 'zod';
import { CATEGORIAS, CategoriaItem, VisualItem } from '../loja.catalogo';

/** Parâmetro `:codigo` de `POST /api/loja/itens/:codigo/compra`. */
export const codigoItemSchema = z.object({
  codigo: z.string({ error: 'Informe o código do item.' }).min(1).max(40),
});

/** Corpo de `PUT /api/loja/equipados`: `codigo` nulo tira o item da categoria. */
export const equiparSchema = z.object({
  categoria: z.enum(CATEGORIAS as [CategoriaItem, ...CategoriaItem[]], {
    error: 'Categoria inválida. Use MOLDURA, TEMA, TITULO ou RASTRO.',
  }),
  codigo: z.string().min(1).max(40).nullable(),
});

export interface ItemLojaDto {
  codigo: string;
  categoria: CategoriaItem;
  nome: string;
  descricao: string;
  preco: number;
  visual: VisualItem;
  possui: boolean;
  equipado: boolean;
}

export interface LojaDto {
  /** Pontos disponíveis para gastar (pontuação total - pontos gastos). */
  saldo: number;
  pontuacaoTotal: number;
  pontosGastos: number;
  /** Código do item equipado em cada categoria (null = padrão). */
  equipados: Record<CategoriaItem, string | null>;
  itens: ItemLojaDto[];
}
