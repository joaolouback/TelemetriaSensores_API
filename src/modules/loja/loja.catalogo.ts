/**
 * Catálogo da loja de itens. Os itens são cosméticos: não dão pontos nem vantagem no jogo.
 *
 * O catálogo fica no código (e não numa tabela) porque cada item depende de um visual que o
 * app sabe desenhar; para incluir um item, acrescente-o aqui (e, se for tema, a paleta no app).
 * O `codigo` é o que fica gravado em `usuario_item` e nas colunas `*_equipado(a)` do usuário.
 */
export type CategoriaItem = 'MOLDURA' | 'TEMA' | 'TITULO' | 'RASTRO';

export const CATEGORIAS: CategoriaItem[] = ['MOLDURA', 'TEMA', 'TITULO', 'RASTRO'];

/** Como o app desenha o item. */
export interface VisualItem {
  /** Moldura: cores do anel em volta da foto (uma = cor sólida; várias = segmentos). Rastro: a cor da linha. */
  cores?: string[];
  /** Moldura com brilho em volta. */
  brilho?: boolean;
  /** Título: o texto exibido no perfil e no ranking. */
  texto?: string;
}

export interface ItemLoja {
  codigo: string;
  categoria: CategoriaItem;
  nome: string;
  descricao: string;
  preco: number;
  visual: VisualItem;
}

export const CATALOGO: ItemLoja[] = [
  // Molduras da foto de perfil (aparecem também no ranking e no perfil público).
  { codigo: 'moldura-bronze', categoria: 'MOLDURA', nome: 'Bronze', descricao: 'Moldura de bronze para a sua foto.', preco: 10, visual: { cores: ['#CD7F32'] } },
  { codigo: 'moldura-prata', categoria: 'MOLDURA', nome: 'Prata', descricao: 'Moldura prateada para a sua foto.', preco: 20, visual: { cores: ['#B8C0CC'] } },
  { codigo: 'moldura-uvv', categoria: 'MOLDURA', nome: 'UVV', descricao: 'As cores da universidade.', preco: 25, visual: { cores: ['#1B2B5E', '#4C8DF6'] } },
  { codigo: 'moldura-neon', categoria: 'MOLDURA', nome: 'Neon', descricao: 'Moldura ciano com brilho.', preco: 35, visual: { cores: ['#00E5FF'], brilho: true } },
  { codigo: 'moldura-ouro', categoria: 'MOLDURA', nome: 'Ouro', descricao: 'Moldura dourada, como os anéis do campus.', preco: 40, visual: { cores: ['#FFB300'], brilho: true } },
  { codigo: 'moldura-arco-iris', categoria: 'MOLDURA', nome: 'Arco-íris', descricao: 'Quatro cores em volta da foto.', preco: 60, visual: { cores: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'] } },

  // Temas do aplicativo (a paleta de cada um fica no app).
  { codigo: 'tema-oceano', categoria: 'TEMA', nome: 'Oceano', descricao: 'Tons de azul-piscina e areia.', preco: 30, visual: { cores: ['#0891B2', '#ECFEFF'] } },
  { codigo: 'tema-floresta', categoria: 'TEMA', nome: 'Floresta', descricao: 'Verdes do campus.', preco: 30, visual: { cores: ['#15803D', '#F0FDF4'] } },
  { codigo: 'tema-por-do-sol', categoria: 'TEMA', nome: 'Pôr do sol', descricao: 'Laranja e rosa de fim de tarde.', preco: 40, visual: { cores: ['#EA580C', '#FFF7ED'] } },
  { codigo: 'tema-noite-uvv', categoria: 'TEMA', nome: 'Noite UVV', descricao: 'Tema escuro em azul-marinho e dourado.', preco: 50, visual: { cores: ['#FFB300', '#0B1430'] } },

  // Títulos exibidos abaixo do nome.
  { codigo: 'titulo-calouro', categoria: 'TITULO', nome: 'Calouro Curioso', descricao: 'Para quem está começando a explorar.', preco: 10, visual: { texto: 'Calouro Curioso' } },
  { codigo: 'titulo-explorador', categoria: 'TITULO', nome: 'Explorador do Campus', descricao: 'Para quem já conhece os caminhos.', preco: 25, visual: { texto: 'Explorador do Campus' } },
  { codigo: 'titulo-cacador', categoria: 'TITULO', nome: 'Caçador de Anéis', descricao: 'Nenhum anel escapa.', preco: 40, visual: { texto: 'Caçador de Anéis' } },
  { codigo: 'titulo-lenda', categoria: 'TITULO', nome: 'Lenda da UVV', descricao: 'O título mais raro da loja.', preco: 80, visual: { texto: 'Lenda da UVV' } },

  // Cor do trajeto desenhado no mapa.
  { codigo: 'rastro-dourado', categoria: 'RASTRO', nome: 'Rastro dourado', descricao: 'Seu trajeto no mapa em dourado.', preco: 15, visual: { cores: ['#F5A623'] } },
  { codigo: 'rastro-rosa', categoria: 'RASTRO', nome: 'Rastro rosa', descricao: 'Seu trajeto no mapa em rosa.', preco: 15, visual: { cores: ['#EC4899'] } },
  { codigo: 'rastro-verde', categoria: 'RASTRO', nome: 'Rastro verde', descricao: 'Seu trajeto no mapa em verde.', preco: 15, visual: { cores: ['#22C55E'] } },
  { codigo: 'rastro-neon', categoria: 'RASTRO', nome: 'Rastro neon', descricao: 'Seu trajeto no mapa em ciano neon.', preco: 20, visual: { cores: ['#00E5FF'] } },
];

const POR_CODIGO = new Map(CATALOGO.map((item) => [item.codigo, item]));

export const buscarItem = (codigo: string | null | undefined): ItemLoja | undefined =>
  codigo ? POR_CODIGO.get(codigo) : undefined;

/** Moldura e título equipados, prontos para o ranking e o perfil público. */
export function aparencia(u: { molduraEquipada: string | null; tituloEquipado: string | null }) {
  const moldura = buscarItem(u.molduraEquipada);
  const titulo = buscarItem(u.tituloEquipado);
  return {
    moldura: moldura ? { codigo: moldura.codigo, ...moldura.visual } : null,
    titulo: titulo?.visual.texto ?? null,
  };
}
