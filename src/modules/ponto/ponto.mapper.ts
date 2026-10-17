import { PontoComObjeto } from './entities/ponto-de-interesse.entity';
import { Objeto3D } from './entities/objeto-3d.entity';
import { Objeto3DDto, PontoDto, PontoProximoDto } from './dto/ponto.dto';

export const toObjeto3DDto = (objeto: Objeto3D): Objeto3DDto => ({
  id: objeto.id,
  pontoDeInteresseId: objeto.pontoDeInteresseId,
  nome: objeto.nome,
  assetUrl: objeto.assetUrl,
  formato: objeto.formato,
  escala: objeto.escala,
});

export const toPontoDto = (ponto: PontoComObjeto): PontoDto => ({
  id: ponto.id,
  nome: ponto.nome,
  descricao: ponto.descricao,
  latitude: ponto.latitude,
  longitude: ponto.longitude,
  raioGeofence: ponto.raioGeofence,
  pontosRecompensa: ponto.pontosRecompensa,
  ativo: ponto.ativo,
  objeto3d: ponto.objeto3d ? toObjeto3DDto(ponto.objeto3d) : null,
});

export const toPontoProximoDto = (ponto: PontoComObjeto, distancia: number): PontoProximoDto => ({
  ...toPontoDto(ponto),
  distanciaMetros: Number(distancia.toFixed(2)),
  dentroDoRaio: distancia <= ponto.raioGeofence,
});
