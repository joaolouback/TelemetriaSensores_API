/**
 * Seed do banco UVV Go.
 *
 * Os 10 pontos de coleta definidos na metodologia do TCC (seção 3.1.1.2).
 */
import prisma from '../src/shared/database/prisma';

/** Centro aproximado do campus da UVV (Boa Vista, Vila Velha/ES). */
const CAMPUS_UVV = { latitude: -20.3417, longitude: -40.2917 };

/**
 * Card do local (exibido no app depois da coleta): cada ponto aceita também
 *   curiosidade: 'História ou curiosidade real sobre o local',
 *   imagemUrl: '/imagens/biblioteca.jpg',   // arquivo em public/imagens/
 * Sem `curiosidade`, o card mostra só a descrição. Preencha com conteúdo verificado.
 */
const PONTOS = [
  {
    nome: 'Prédio Azul',
    descricao: 'Bloco de salas de aula da Unidade de Tecnologia.',
    latitude: -20.354076,
    longitude: -40.299931,
    raioGeofence: 30,
    pontosRecompensa: 10,
  },
  {
    nome: 'Prédio Rosa',
    descricao: 'Bloco administrativo e de salas de aula.',
    latitude: -20.353341,
    longitude: -40.298874,
    raioGeofence: 30,
    pontosRecompensa: 10,
  },
  {
    nome: 'Prédio Branco',
    descricao: 'Bloco de laboratórios.',
    latitude: -20.355325,
    longitude: -40.29916,
    raioGeofence: 30,
    pontosRecompensa: 10,
  },
  {
    nome: 'Biblioteca',
    descricao: 'Biblioteca central do campus.',
    imagemUrl: '/imagens/biblioteca.jpg',
    latitude: -20.354402,
    longitude: -40.299125,
    raioGeofence: 50,
    pontosRecompensa: 15,
  },
  {
    nome: 'Bandeira do Brasil',
    descricao: 'Mastro da bandeira na praça central.',
    latitude: -20.353889,
    longitude: -40.299111,
    raioGeofence: 20,
    pontosRecompensa: 15,
  },
  {
    nome: 'Capela UVV',
    descricao: 'Capela do campus universitário.',
    latitude: -20.354384,
    longitude: -40.298516,
    raioGeofence: 25,
    pontosRecompensa: 15,
  },
  {
    nome: 'Entrada da UVV (Acesso ao Shopping)',
    descricao: 'Portaria de acesso ao shopping vizinho.',
    latitude: -20.352994,
    longitude: -40.298713,
    raioGeofence: 35,
    pontosRecompensa: 10,
  },
  {
    nome: 'Ginásio Poliesportivo',
    descricao: 'Quadra coberta e área esportiva.',
    latitude: -20.354798,
    longitude: -40.299492,
    raioGeofence: 40,
    pontosRecompensa: 20,
  },
  {
    nome: 'Cineteatro',
    descricao: 'Cineteatro da universidade.',
    latitude: -20.353722,
    longitude: -40.300151,
    raioGeofence: 25,
    pontosRecompensa: 20,
  },
  {
    nome: 'Anfiteatro',
    descricao: 'Anfiteatro ao ar livre.',
    latitude: -20.354923,
    longitude: -40.298633,
    raioGeofence: 25,
    pontosRecompensa: 20,
  },
  // Ponto de TESTE fora do campus (Rua Virginópolis, Divino Espírito Santo). Remova antes da entrega.
  {
    nome: 'Teste — Rua Virginópolis',
    descricao: 'Ponto de teste da coleta em realidade aumentada.',
    latitude: -20.35002,
    longitude: -40.30046,
    raioGeofence: 60,
    pontosRecompensa: 10,
  },
];

/**
 * Modelo 3D de cada ponto. `assetUrl` é relativo à API (servido de `public/modelos/`);
 * o app completa com o endereço do servidor. Os arquivos são gerados por `npm run modelos:gerar`.
 * Pontos fora desta lista usam o cristal.
 */
// Cada ponto tem um anel dourado com a foto do local dentro (scripts/gerar-modelo-3d.ts).
const ANEL_POR_PONTO: Record<string, string> = {
  'Prédio Azul': 'predio-azul',
  'Prédio Rosa': 'predio-rosa',
  'Prédio Branco': 'predio-branco',
  Biblioteca: 'biblioteca',
  'Bandeira do Brasil': 'bandeira',
  'Capela UVV': 'capela',
  'Entrada da UVV (Acesso ao Shopping)': 'entrada',
  'Ginásio Poliesportivo': 'ginasio',
  Anfiteatro: 'anfiteatro',
};
const ANEL_PADRAO = 'cineteatro';

const CONQUISTAS = [
  {
    titulo: 'Primeiros Passos',
    descricao: 'Visite seu primeiro ponto do campus.',
    pontosNecessarios: 10,
  },
  {
    titulo: 'Explorador',
    descricao: 'Visite 5 pontos diferentes do campus.',
    pontosNecessarios: 50,
  },
  {
    titulo: 'Conhecedor do Campus',
    descricao: 'Visite todos os 10 pontos de coleta.',
    pontosNecessarios: 145,
  },
];

async function main() {
  console.log('Semeando banco UVV Go...');
  console.log(`Centro do campus: ${CAMPUS_UVV.latitude}, ${CAMPUS_UVV.longitude}`);

  // Criar Usuário inicial
  const usuario = await prisma.usuario.upsert({
    where: { email: 'estudante@uvv.br' },
    update: {},
    create: {
      nome: 'Estudante UVV',
      email: 'estudante@uvv.br',
      pontuacaoTotal: 0,
    },
  });
  console.log(`  + usuário demo criado/existente (id: ${usuario.id})`);

  for (const ponto of PONTOS) {
    const existente = await prisma.pontoDeInteresse.findFirst({
      where: { nome: ponto.nome },
    });

    let pontoId: number;
    if (existente) {
      await prisma.pontoDeInteresse.update({
        where: { id: existente.id },
        data: ponto,
      });
      pontoId = existente.id;
      console.log(`  ~ atualizado: ${ponto.nome}`);
    } else {
      pontoId = (await prisma.pontoDeInteresse.create({ data: ponto })).id;
      console.log(`  + criado: ${ponto.nome}`);
    }

    // Objeto coletado em realidade aumentada ao chegar no ponto.
    const slug = ANEL_POR_PONTO[ponto.nome] ?? ANEL_PADRAO;
    const objeto = {
      nome: `Anel — ${ponto.nome}`,
      assetUrl: `/modelos/anel-${slug}.glb`,
      formato: 'GLB',
      escala: 0.25,
    };
    await prisma.objeto3D.upsert({
      where: { pontoDeInteresseId: pontoId },
      update: objeto,
      create: { ...objeto, pontoDeInteresseId: pontoId },
    });
  }

  for (const conquista of CONQUISTAS) {
    const existente = await prisma.conquista.findFirst({
      where: { titulo: conquista.titulo },
    });

    if (!existente) {
      await prisma.conquista.create({ data: conquista });
      console.log(`  + conquista: ${conquista.titulo}`);
    }
  }

  const totalPontos = await prisma.pontoDeInteresse.count();
  console.log(`\nPronto. ${totalPontos} pontos de interesse no banco.`);
}

main()
  .catch((e) => {
    console.error('Erro ao semear o banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
