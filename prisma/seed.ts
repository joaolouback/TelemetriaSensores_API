/**
 * Seed do banco UVV Go.
 *
 * Os 10 pontos de coleta definidos na metodologia do TCC (seção 3.1.1.2).
 *
 * ATENÇÃO: as coordenadas abaixo são APROXIMADAS, posicionadas dentro do
 * campus da UVV apenas para o mapa funcionar em desenvolvimento.
 * Substitua pelos valores reais coletados em campo antes dos testes de
 * precisão geográfica. Depois de editar, rode novamente: npm run seed
 */
import prisma from '../src/database/prisma';

/** Centro aproximado do campus da UVV (Boa Vista, Vila Velha/ES). */
const CAMPUS_UVV = { latitude: -20.3417, longitude: -40.2917 };

const PONTOS = [
  {
    nome: 'Prédio Azul',
    descricao: 'Bloco de salas de aula da Unidade de Tecnologia.',
    latitude: -20.34105,
    longitude: -40.29230,
    raioGeofence: 30,
    pontosRecompensa: 10,
  },
  {
    nome: 'Prédio Rosa',
    descricao: 'Bloco administrativo e de salas de aula.',
    latitude: -20.34150,
    longitude: -40.29180,
    raioGeofence: 30,
    pontosRecompensa: 10,
  },
  {
    nome: 'Prédio Branco',
    descricao: 'Bloco de laboratórios.',
    latitude: -20.34200,
    longitude: -40.29135,
    raioGeofence: 30,
    pontosRecompensa: 10,
  },
  {
    nome: 'Biblioteca',
    descricao: 'Biblioteca central do campus.',
    latitude: -20.34235,
    longitude: -40.29245,
    raioGeofence: 25,
    pontosRecompensa: 15,
  },
  {
    nome: 'Bandeira do Brasil',
    descricao: 'Mastro da bandeira na praça central.',
    latitude: -20.34170,
    longitude: -40.29275,
    raioGeofence: 20,
    pontosRecompensa: 15,
  },
  {
    nome: 'Capela UVV',
    descricao: 'Capela do campus universitário.',
    latitude: -20.34095,
    longitude: -40.29310,
    raioGeofence: 25,
    pontosRecompensa: 15,
  },
  {
    nome: 'Entrada da UVV (Acesso ao Shopping)',
    descricao: 'Portaria de acesso ao shopping vizinho.',
    latitude: -20.34060,
    longitude: -40.29155,
    raioGeofence: 35,
    pontosRecompensa: 10,
  },
  {
    nome: 'Ginásio Poliesportivo',
    descricao: 'Quadra coberta e área esportiva.',
    latitude: -20.34290,
    longitude: -40.29190,
    raioGeofence: 40,
    pontosRecompensa: 20,
  },
  {
    nome: 'Cineteatro',
    descricao: 'Cineteatro da universidade.',
    latitude: -20.34255,
    longitude: -40.29310,
    raioGeofence: 25,
    pontosRecompensa: 20,
  },
  {
    nome: 'Anfiteatro',
    descricao: 'Anfiteatro ao ar livre.',
    latitude: -20.34130,
    longitude: -40.29345,
    raioGeofence: 25,
    pontosRecompensa: 20,
  },
];

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

  for (const ponto of PONTOS) {
    // Idempotente: atualiza se já existir um ponto com o mesmo nome.
    const existente = await prisma.pontoDeInteresse.findFirst({
      where: { nome: ponto.nome },
    });

    if (existente) {
      await prisma.pontoDeInteresse.update({
        where: { id: existente.id },
        data: ponto,
      });
      console.log(`  ~ atualizado: ${ponto.nome}`);
    } else {
      await prisma.pontoDeInteresse.create({ data: ponto });
      console.log(`  + criado: ${ponto.nome}`);
    }
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
