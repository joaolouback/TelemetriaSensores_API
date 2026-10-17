import { DesafioCompleto } from './entities/desafio.entity';
import { DesafioDto, JogadorDesafioDto } from './dto/desafio.dto';
import { BONUS_VITORIA, VALIDADE_CONVITE_MS } from './desafio.service';

const jogador = (
  desafio: DesafioCompleto,
  usuario: { id: number; nome: string }
): JogadorDesafioDto => ({
  id: usuario.id,
  nome: usuario.nome,
  coletados: desafio.coletas.filter((c) => c.usuarioId === usuario.id).map((c) => c.pontoDeInteresseId),
});

export const resultadoPara = (
  desafio: { status: string; vencedorId: number | null },
  usuarioId: number
): DesafioDto['resultado'] => {
  if (desafio.status !== 'FINALIZADO') return null;
  if (desafio.vencedorId === null) return 'empate';
  return desafio.vencedorId === usuarioId ? 'vitoria' : 'derrota';
};

/** Monta o desafio do ponto de vista de `usuarioId` (que precisa ser um dos participantes). */
export const toDesafioDto = (desafio: DesafioCompleto, usuarioId: number): DesafioDto => {
  const souDesafiante = desafio.desafianteId === usuarioId;
  const eu = souDesafiante ? desafio.desafiante : desafio.desafiado!;
  const outro = souDesafiante ? desafio.desafiado : desafio.desafiante;

  return {
    id: desafio.id,
    codigo: desafio.codigo,
    status: desafio.status,
    papel: souDesafiante ? 'desafiante' : 'desafiado',
    criadoEm: desafio.criadoEm,
    conviteExpiraEm: new Date(desafio.criadoEm.getTime() + VALIDADE_CONVITE_MS),
    iniciadoEm: desafio.iniciadoEm,
    terminaEm: desafio.terminaEm,
    finalizadoEm: desafio.finalizadoEm,
    agora: new Date(),
    pontos: desafio.pontos.map(({ ponto }) => ({
      id: ponto.id,
      nome: ponto.nome,
      latitude: ponto.latitude,
      longitude: ponto.longitude,
      raioGeofence: ponto.raioGeofence,
    })),
    eu: jogador(desafio, eu),
    oponente: outro ? jogador(desafio, outro) : null,
    resultado: resultadoPara(desafio, usuarioId),
    bonusVitoria: BONUS_VITORIA,
  };
};
