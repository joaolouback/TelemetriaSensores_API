/**
 * Gera os modelos 3D dos pontos do campus em GLB (glTF binário): cristal, estrela, cubo,
 * coração, diamante, livro, bandeira, capela, troféu e pirâmide.
 *
 * Os modelos são montados por código (sem Blender) para o repositório não depender de assets
 * baixados de terceiros. Para usar um modelo próprio, coloque o .glb em `public/modelos/` e
 * aponte o `assetUrl` do Objeto3D para ele no seed.
 *
 * Convenção: cada modelo tem ~1,4 de altura, com a base em y = -0,85 e o topo em y = 0,55
 * (a mesma do cristal original), para a mesma `escala` do seed servir para todos.
 *
 * Uso: npm run modelos:gerar
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

type Vec3 = [number, number, number];
type Vec2 = [number, number];
type Triangulo = [Vec3, Vec3, Vec3];
type Cor = [number, number, number];

interface Parte {
  nome: string;
  cor: Cor;
  /** Brilho próprio, para o objeto aparecer bem mesmo em ambiente escuro. */
  emissiva: Cor;
  metalico: number;
  rugosidade: number;
  triangulos: Triangulo[];
  /** Coordenadas de textura (3 por triângulo), usadas com `textura`. */
  uv?: Vec2[];
  /** Imagem JPEG embutida no GLB como textura da cor base. */
  textura?: Buffer;
}

const BASE_Y = -0.85;
const TOPO_Y = 0.55;
const CENTRO_Y = (BASE_Y + TOPO_Y) / 2;

// ---------- geometria ----------

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalizar = (v: Vec3): Vec3 => {
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
};
const normalDe = ([a, b, c]: Triangulo) => normalizar(cross(sub(b, a), sub(c, a)));

/**
 * Corrige a ordem dos vértices de cada triângulo para a face apontar para fora do sólido.
 * Só vale para sólidos convexos (caixa, cone, bipirâmide...), usando o centro deles.
 */
function fechar(triangulos: Triangulo[]): Triangulo[] {
  const vertices = triangulos.flat();
  const centro = vertices
    .reduce<Vec3>((s, v) => [s[0] + v[0], s[1] + v[1], s[2] + v[2]], [0, 0, 0])
    .map((x) => x / vertices.length) as Vec3;

  return triangulos.map(([a, b, c]) => {
    const meio: Vec3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
    return dot(normalDe([a, b, c]), sub(meio, centro)) < 0 ? [a, c, b] : [a, b, c];
  });
}

const anel = (lados: number, raio: number, y: number, giro = 0): Vec3[] =>
  Array.from({ length: lados }, (_, i) => {
    const ang = (2 * Math.PI * i) / lados + giro;
    return [raio * Math.cos(ang), y, raio * Math.sin(ang)];
  });

/** Caixa alinhada aos eixos. */
function caixa(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Triangulo[] {
  const p = (x: number, y: number, z: number): Vec3 => [x, y, z];
  const [a, b, c, d] = [p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)];
  const [e, f, g, h] = [p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1)];
  const quad = (q1: Vec3, q2: Vec3, q3: Vec3, q4: Vec3): Triangulo[] => [
    [q1, q2, q3],
    [q1, q3, q4],
  ];
  return fechar([
    ...quad(a, b, c, d),
    ...quad(e, f, g, h),
    ...quad(a, b, f, e),
    ...quad(d, c, g, h),
    ...quad(a, d, h, e),
    ...quad(b, c, g, f),
  ]);
}

/** Tronco de cone (ou cilindro, se os raios forem iguais) com tampas. */
function tronco(lados: number, raioBase: number, raioTopo: number, y0: number, y1: number, cx = 0): Triangulo[] {
  const baixo = anel(lados, raioBase, y0).map((v): Vec3 => [v[0] + cx, v[1], v[2]]);
  const cima = anel(lados, raioTopo, y1).map((v): Vec3 => [v[0] + cx, v[1], v[2]]);
  const centroBaixo: Vec3 = [cx, y0, 0];
  const centroCima: Vec3 = [cx, y1, 0];
  const tris: Triangulo[] = [];
  for (let i = 0; i < lados; i++) {
    const j = (i + 1) % lados;
    tris.push([baixo[i], baixo[j], cima[i]], [baixo[j], cima[j], cima[i]]);
    tris.push([centroBaixo, baixo[i], baixo[j]], [centroCima, cima[i], cima[j]]);
  }
  return fechar(tris);
}

/** Pirâmide de base regular com o vértice em `topo`. */
function piramide(lados: number, raio: number, y0: number, topo: Vec3, giro = 0): Triangulo[] {
  const base = anel(lados, raio, y0, giro);
  const centro: Vec3 = [0, y0, 0];
  const tris: Triangulo[] = [];
  for (let i = 0; i < lados; i++) {
    const j = (i + 1) % lados;
    tris.push([topo, base[i], base[j]], [centro, base[i], base[j]]);
  }
  return fechar(tris);
}

/** Duas pirâmides coladas pela base (cristal, diamante). */
function bipiramide(lados: number, raio: number, topo: Vec3, base: Vec3): Triangulo[] {
  const equador = anel(lados, raio, 0);
  const tris: Triangulo[] = [];
  for (let i = 0; i < lados; i++) {
    const j = (i + 1) % lados;
    tris.push([topo, equador[i], equador[j]], [base, equador[i], equador[j]]);
  }
  return fechar(tris);
}

const areaAssinada = (poligono: Vec2[]) =>
  poligono.reduce((soma, [x, y], i) => {
    const [x2, y2] = poligono[(i + 1) % poligono.length];
    return soma + (x * y2 - x2 * y) / 2;
  }, 0);

/**
 * Extrusão de um polígono 2D (plano XY) ao longo de Z. Serve para formas côncavas (estrela,
 * coração): a tampa é um leque a partir de `centro`, que precisa enxergar todo o contorno.
 */
function extrusao(contorno: Vec2[], z0: number, z1: number, centro?: Vec2): Triangulo[] {
  const poligono = areaAssinada(contorno) < 0 ? [...contorno].reverse() : contorno;
  const meio: Vec2 =
    centro ?? [
      poligono.reduce((s, p) => s + p[0], 0) / poligono.length,
      poligono.reduce((s, p) => s + p[1], 0) / poligono.length,
    ];
  const tris: Triangulo[] = [];
  for (let i = 0; i < poligono.length; i++) {
    const [ax, ay] = poligono[i];
    const [bx, by] = poligono[(i + 1) % poligono.length];
    if ((ax - meio[0]) * (by - meio[1]) - (bx - meio[0]) * (ay - meio[1]) <= 0) {
      throw new Error('O centro do leque não enxerga todo o contorno da forma.');
    }
    tris.push([[meio[0], meio[1], z1], [ax, ay, z1], [bx, by, z1]]); // frente (+z)
    tris.push([[meio[0], meio[1], z0], [bx, by, z0], [ax, ay, z0]]); // fundo (-z)
    tris.push([[ax, ay, z0], [bx, by, z0], [bx, by, z1]], [[ax, ay, z0], [bx, by, z1], [ax, ay, z1]]); // lado
  }
  return tris;
}

const estrela = (pontas: number, raioExterno: number, raioInterno: number, cy: number): Vec2[] =>
  Array.from({ length: pontas * 2 }, (_, i): Vec2 => {
    const raio = i % 2 === 0 ? raioExterno : raioInterno;
    const ang = Math.PI / 2 + (Math.PI * i) / pontas;
    return [raio * Math.cos(ang), cy + raio * Math.sin(ang)];
  });

const polo = (lados: number, raio: number, cx: number, cy: number): Vec2[] =>
  Array.from({ length: lados }, (_, i): Vec2 => {
    const ang = (2 * Math.PI * i) / lados;
    return [cx + raio * Math.cos(ang), cy + raio * Math.sin(ang)];
  });

// ---------- modelos ----------

const parte = (
  nome: string,
  cor: Cor,
  triangulos: Triangulo[],
  opcoes: { emissiva?: Cor; metalico?: number; rugosidade?: number } = {},
): Parte => ({
  nome,
  cor,
  triangulos,
  emissiva: opcoes.emissiva ?? [cor[0] * 0.2, cor[1] * 0.2, cor[2] * 0.2],
  metalico: opcoes.metalico ?? 0.2,
  rugosidade: opcoes.rugosidade ?? 0.5,
});

const OURO: Cor = [1.0, 0.75, 0.1];

function coracao(): Vec2[] {
  const escala = 0.035;
  const pontos: Vec2[] = [];
  for (let i = 0; i < 64; i++) {
    const t = (2 * Math.PI * i) / 64;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pontos.push([x * escala, (y + 2) * escala + CENTRO_Y]);
  }
  return pontos;
}

const MODELOS: Record<string, Parte[]> = {
  cristal: [
    parte('Cristal', OURO, bipiramide(8, 0.5, [0, TOPO_Y, 0], [0, BASE_Y, 0]), {
      emissiva: [0.25, 0.17, 0.0],
      metalico: 0.6,
      rugosidade: 0.3,
    }),
  ],

  estrela: [
    parte('Estrela', OURO, extrusao(estrela(5, 0.72, 0.3, CENTRO_Y + 0.05), -0.1, 0.1), {
      emissiva: [0.3, 0.2, 0.0],
      metalico: 0.6,
      rugosidade: 0.3,
    }),
  ],

  cubo: [parte('Cubo', [0.1, 0.25, 0.8], caixa(-0.45, 0.45, BASE_Y, BASE_Y + 0.9, -0.45, 0.45), { metalico: 0.3 })],

  coracao: [parte('Coração', [1.0, 0.3, 0.55], extrusao(coracao(), -0.14, 0.14, [0, CENTRO_Y]), { rugosidade: 0.3 })],

  diamante: [
    parte('Diamante', [0.55, 0.9, 1.0], bipiramide(4, 0.5, [0, TOPO_Y, 0], [0, BASE_Y, 0]), {
      emissiva: [0.1, 0.25, 0.3],
      metalico: 0.8,
      rugosidade: 0.1,
    }),
  ],

  livro: [
    parte('Capa', [0.7, 0.1, 0.1], [
      ...caixa(-0.46, 0.4, BASE_Y + 0.05, TOPO_Y - 0.05, 0.18, 0.24),
      ...caixa(-0.46, 0.4, BASE_Y + 0.05, TOPO_Y - 0.05, -0.24, -0.18),
      ...caixa(-0.46, -0.4, BASE_Y + 0.05, TOPO_Y - 0.05, -0.24, 0.24),
    ]),
    parte('Páginas', [0.98, 0.95, 0.85], caixa(-0.4, 0.38, BASE_Y + 0.09, TOPO_Y - 0.09, -0.18, 0.18), {
      metalico: 0,
      rugosidade: 0.9,
    }),
  ],

  bandeira: [
    parte('Mastro', [0.7, 0.7, 0.72], tronco(12, 0.04, 0.04, BASE_Y, TOPO_Y, -0.5), { metalico: 0.7 }),
    parte('Verde', [0.0, 0.6, 0.25], extrusao([[-0.46, -0.15], [0.54, -0.15], [0.54, 0.55], [-0.46, 0.55]], -0.015, 0.015), {
      metalico: 0,
    }),
    parte('Amarelo', [1.0, 0.85, 0.0], extrusao([[0.04, -0.07], [0.42, 0.2], [0.04, 0.47], [-0.34, 0.2]], -0.03, 0.03), {
      metalico: 0,
    }),
    parte('Azul', [0.0, 0.15, 0.55], extrusao(polo(24, 0.16, 0.04, 0.2), -0.045, 0.045), { metalico: 0 }),
  ],

  capela: [
    parte('Paredes', [0.96, 0.95, 0.9], caixa(-0.4, 0.4, BASE_Y, -0.2, -0.35, 0.35), { metalico: 0, rugosidade: 0.8 }),
    parte('Telhado', [0.65, 0.2, 0.15], extrusao([[-0.5, -0.2], [0.5, -0.2], [0, 0.2]], -0.42, 0.42), {
      metalico: 0,
      rugosidade: 0.8,
    }),
    parte('Cruz', OURO, [...caixa(-0.03, 0.03, 0.2, 0.55, -0.02, 0.02), ...caixa(-0.13, 0.13, 0.38, 0.44, -0.02, 0.02)], {
      metalico: 0.6,
    }),
  ],

  trofeu: [
    parte('Base', [0.25, 0.2, 0.15], caixa(-0.3, 0.3, BASE_Y, BASE_Y + 0.1, -0.3, 0.3), { metalico: 0.1 }),
    parte('Taça', OURO, [
      ...tronco(12, 0.07, 0.07, BASE_Y + 0.1, BASE_Y + 0.4),
      ...tronco(16, 0.16, 0.42, BASE_Y + 0.4, TOPO_Y - 0.05),
    ], { emissiva: [0.3, 0.2, 0.0], metalico: 0.8, rugosidade: 0.25 }),
  ],

  piramide: [parte('Pirâmide', [1.0, 0.5, 0.1], piramide(4, 0.62, BASE_Y, [0, TOPO_Y, 0], Math.PI / 4), { metalico: 0.3 })],
};

// ---------- anel com a foto do local ----------

const ANEL_R = 0.55; // raio do centro do tubo
const ANEL_TUBO = 0.09;
// A foto (desenhada pelo app) tem raio ANEL_R - ANEL_TUBO + 0,02 = 0,48: entra um pouco sob o anel, sem fresta.

function toro(): Triangulo[] {
  const U = 40;
  const V = 12;
  const ponto = (i: number, j: number): Vec3 => {
    const u = (i / U) * 2 * Math.PI;
    const v = (j / V) * 2 * Math.PI;
    const raio = ANEL_R + ANEL_TUBO * Math.cos(v);
    return [raio * Math.cos(u), CENTRO_Y + raio * Math.sin(u), ANEL_TUBO * Math.sin(v)];
  };
  const tris: Triangulo[] = [];
  for (let i = 0; i < U; i++) {
    for (let j = 0; j < V; j++) {
      const a = ponto(i, j);
      const b = ponto(i + 1, j);
      const c = ponto(i + 1, j + 1);
      const d = ponto(i, j + 1);
      tris.push([a, b, c], [a, c, d]);
    }
  }
  return tris;
}

/**
 * Anel dourado (só a moldura). A foto do local é desenhada pelo app dentro dele, como imagem
 * (`anel-<slug>.png`, gerada abaixo): o carregador de GLB do Viro não aceitou texturas embutidas.
 */
function anelDourado(): Parte[] {
  return [parte('Anel', OURO, toro(), { emissiva: [0.35, 0.24, 0.0], metalico: 0.9, rugosidade: 0.2 })];
}

/** Recorta a foto em círculo (PNG com transparência). Sem foto, o miolo fica azul UVV. */
function gerarFotoCircular(slug: string, foto: string | null, destino: string) {
  const lado = 512;
  const mascara = `-size ${lado}x${lado} xc:none -fill white -draw "circle ${lado / 2},${lado / 2} ${lado / 2},0"`;
  const origem = foto
    ? `"${foto}" -resize ${lado}x${lado}^ -gravity center -extent ${lado}x${lado}`
    : `-size ${lado}x${lado} xc:"#1B2B5E"`;
  execSync(`magick ${origem} \\( ${mascara} \\) -alpha set -compose DstIn -composite "${destino}"`, {
    stdio: 'pipe',
  });
}

// ---------- GLB ----------

/** Completa o chunk até múltiplo de 4 bytes, como exige o formato GLB. */
const alinhar = (buf: Buffer, preenchimento: number) => {
  const resto = buf.length % 4;
  return resto === 0 ? buf : Buffer.concat([buf, Buffer.alloc(4 - resto, preenchimento)]);
};

const cabecalhoChunk = (tamanho: number, tipo: number) => {
  const h = Buffer.alloc(8);
  h.writeUInt32LE(tamanho, 0);
  h.writeUInt32LE(tipo, 4);
  return h;
};

function montarGlb(nome: string, partes: Parte[]) {
  const blocos: Buffer[] = [];
  const bufferViews: object[] = [];
  const accessors: object[] = [];
  let deslocamento = 0;

  const adicionar = (dados: number[]) => {
    const buf = Buffer.from(new Float32Array(dados).buffer);
    bufferViews.push({ buffer: 0, byteOffset: deslocamento, byteLength: buf.length, target: 34962 });
    blocos.push(buf);
    deslocamento += buf.length;
    return bufferViews.length - 1;
  };

  const primitivas = partes.map((p, indice) => {
    const posicoes: number[] = [];
    const normais: number[] = [];
    for (const tri of p.triangulos) {
      const normal = normalDe(tri);
      for (const v of tri) {
        posicoes.push(...v);
        normais.push(...normal);
      }
    }
    const total = posicoes.length / 3;
    const minimo = [0, 1, 2].map((e) => Math.min(...posicoes.filter((_, i) => i % 3 === e)));
    const maximo = [0, 1, 2].map((e) => Math.max(...posicoes.filter((_, i) => i % 3 === e)));

    const viewPos = adicionar(posicoes);
    const viewNor = adicionar(normais);
    accessors.push(
      { bufferView: viewPos, componentType: 5126, count: total, type: 'VEC3', min: minimo, max: maximo },
      { bufferView: viewNor, componentType: 5126, count: total, type: 'VEC3' },
    );
    const attributes: Record<string, number> = { POSITION: accessors.length - 2, NORMAL: accessors.length - 1 };

    // O Viro só carrega primitivas indexadas ("models without indexed vertices" não são aceitos).
    const indices = Buffer.from(new Uint16Array(Array.from({ length: total }, (_, i) => i)).buffer);
    bufferViews.push({ buffer: 0, byteOffset: deslocamento, byteLength: indices.length, target: 34963 });
    const indicesAlinhados = alinhar(indices, 0);
    blocos.push(indicesAlinhados);
    deslocamento += indicesAlinhados.length;
    accessors.push({ bufferView: bufferViews.length - 1, componentType: 5123, count: total, type: 'SCALAR' });
    const indiceAccessor = accessors.length - 1;
    if (p.uv) {
      const viewUv = adicionar(p.uv.flat());
      accessors.push({ bufferView: viewUv, componentType: 5126, count: total, type: 'VEC2' });
      attributes.TEXCOORD_0 = accessors.length - 1;
    }
    return { attributes, indices: indiceAccessor, material: indice };
  });

  const imagens: object[] = [];
  const texturas: object[] = [];
  const indiceTextura: Record<number, number> = {};
  partes.forEach((p, indice) => {
    if (!p.textura) return;
    const dados = alinhar(p.textura, 0);
    bufferViews.push({ buffer: 0, byteOffset: deslocamento, byteLength: p.textura.length });
    blocos.push(dados);
    deslocamento += dados.length;
    imagens.push({ bufferView: bufferViews.length - 1, mimeType: 'image/jpeg' });
    texturas.push({ source: imagens.length - 1 });
    indiceTextura[indice] = texturas.length - 1;
  });

  const bin = Buffer.concat(blocos);
  const gltf = {
    asset: { version: '2.0', generator: 'UVV Go — gerar-modelo-3d.ts' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: nome }],
    meshes: [{ name: nome, primitives: primitivas }],
    materials: partes.map((p, i) => ({
      name: p.nome,
      pbrMetallicRoughness: {
        baseColorFactor: [...p.cor, 1],
        ...(i in indiceTextura ? { baseColorTexture: { index: indiceTextura[i] } } : {}),
        metallicFactor: p.metalico,
        roughnessFactor: p.rugosidade,
      },
      emissiveFactor: p.emissiva,
    })),
    ...(texturas.length ? { textures: texturas, images: imagens } : {}),
    buffers: [{ byteLength: bin.length }],
    bufferViews,
    accessors,
  };

  const chunkJson = alinhar(Buffer.from(JSON.stringify(gltf)), 0x20);
  const chunkBin = alinhar(bin, 0);
  const corpo = Buffer.concat([
    cabecalhoChunk(chunkJson.length, 0x4e4f534a), // "JSON"
    chunkJson,
    cabecalhoChunk(chunkBin.length, 0x004e4942), // "BIN\0"
    chunkBin,
  ]);

  const cabecalho = Buffer.alloc(12);
  cabecalho.writeUInt32LE(0x46546c67, 0); // "glTF"
  cabecalho.writeUInt32LE(2, 4);
  cabecalho.writeUInt32LE(12 + corpo.length, 8);
  return Buffer.concat([cabecalho, corpo]);
}

const pasta = path.join(__dirname, '..', 'public', 'modelos');
fs.mkdirSync(pasta, { recursive: true });

// Um anel por ponto do campus. A foto vem de scripts/fotos/<slug>.jpg (quadrada, ~512 px).
const SLUGS_ANEL = [
  'predio-azul',
  'predio-rosa',
  'predio-branco',
  'biblioteca',
  'bandeira',
  'capela',
  'entrada',
  'ginasio',
  'cineteatro',
  'anfiteatro',
];
const pastaFotos = path.join(__dirname, 'fotos');
for (const slug of SLUGS_ANEL) {
  MODELOS[`anel-${slug}`] = anelDourado();
  const foto = path.join(pastaFotos, `${slug}.jpg`);
  const destino = path.join(__dirname, '..', 'public', 'modelos', `anel-${slug}.png`);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  gerarFotoCircular(slug, fs.existsSync(foto) ? foto : null, destino);
}

for (const [nome, partes] of Object.entries(MODELOS)) {
  const glb = montarGlb(nome, partes);
  fs.writeFileSync(path.join(pasta, `${nome}.glb`), glb);
  const vertices = partes.reduce((s, p) => s + p.triangulos.length * 3, 0);
  console.log(`Modelo gerado: ${nome}.glb (${vertices} vértices, ${glb.length} bytes)`);
}
