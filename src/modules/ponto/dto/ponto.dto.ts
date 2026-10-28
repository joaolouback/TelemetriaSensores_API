export interface Objeto3DDto {
  id: number;
  pontoDeInteresseId: number;
  nome: string;
  /** Relativa ao servidor (ex.: `/modelos/cristal.glb`) ou absoluta. */
  assetUrl: string;
  formato: string | null;
  escala: number;
}

export interface PontoDto {
  id: number;
  nome: string;
  descricao: string | null;
  latitude: number;
  longitude: number;
  raioGeofence: number;
  pontosRecompensa: number;
  ativo: boolean;
  /** História/curiosidade do card do local exibido após a coleta. */
  curiosidade: string | null;
  /** Foto do local — relativa ao servidor (ex.: `/imagens/biblioteca.jpg`) ou absoluta. */
  imagemUrl: string | null;
  objeto3d: Objeto3DDto | null;
}

/** Ponto com a distância até a posição consultada. */
export interface PontoProximoDto extends PontoDto {
  distanciaMetros: number;
  dentroDoRaio: boolean;
}
