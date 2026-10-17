/**
 * Gera o modelo 3D padrão dos pontos do campus: um cristal facetado em GLB (glTF binário).
 *
 * O modelo é montado à mão (sem Blender) para o repositório não depender de assets
 * baixados de terceiros. Para trocar por um modelo próprio, coloque o .glb em
 * `public/modelos/` e aponte o `assetUrl` do Objeto3D para ele no seed.
 *
 * Uso: npm run modelos:gerar
 */
import fs from 'fs';
import path from 'path';

type Vec3 = [number, number, number];

const LADOS = 8;
const RAIO = 0.5;
const TOPO: Vec3 = [0, 0.55, 0];
const BASE: Vec3 = [0, -0.85, 0];
/** Amarelo-ouro, com leve brilho próprio para aparecer bem mesmo em ambiente escuro. */
const COR_BASE = [1.0, 0.75, 0.1, 1.0];
const COR_EMISSIVA = [0.25, 0.17, 0.0];

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

const equador: Vec3[] = Array.from({ length: LADOS }, (_, i) => {
  const ang = (2 * Math.PI * i) / LADOS;
  return [RAIO * Math.cos(ang), 0, RAIO * Math.sin(ang)];
});

const triangulos: [Vec3, Vec3, Vec3][] = [];
for (let i = 0; i < LADOS; i++) {
  const a = equador[i];
  const b = equador[(i + 1) % LADOS];
  triangulos.push([TOPO, a, b], [BASE, a, b]);
}

// Vértices não compartilhados: cada face tem a própria normal (visual facetado).
const posicoes: number[] = [];
const normais: number[] = [];
for (let [a, b, c] of triangulos) {
  let normal = normalizar(cross(sub(b, a), sub(c, a)));
  const centro: Vec3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
  // Garante a ordem anti-horária vista de fora (a face aponta para longe do centro).
  if (dot(normal, centro) < 0) {
    [b, c] = [c, b];
    normal = [-normal[0], -normal[1], -normal[2]];
  }
  for (const v of [a, b, c]) {
    posicoes.push(...v);
    normais.push(...normal);
  }
}

const totalVertices = posicoes.length / 3;
const binPosicoes = Buffer.from(new Float32Array(posicoes).buffer);
const binNormais = Buffer.from(new Float32Array(normais).buffer);
const bin = Buffer.concat([binPosicoes, binNormais]);

const minimo = [0, 1, 2].map((eixo) => Math.min(...posicoes.filter((_, i) => i % 3 === eixo)));
const maximo = [0, 1, 2].map((eixo) => Math.max(...posicoes.filter((_, i) => i % 3 === eixo)));

const gltf = {
  asset: { version: '2.0', generator: 'UVV Go — gerar-modelo-3d.ts' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: 'Cristal' }],
  meshes: [{ name: 'Cristal', primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, material: 0 }] }],
  materials: [
    {
      name: 'Ouro',
      pbrMetallicRoughness: { baseColorFactor: COR_BASE, metallicFactor: 0.6, roughnessFactor: 0.3 },
      emissiveFactor: COR_EMISSIVA,
    },
  ],
  buffers: [{ byteLength: bin.length }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: binPosicoes.length, target: 34962 },
    { buffer: 0, byteOffset: binPosicoes.length, byteLength: binNormais.length, target: 34962 },
  ],
  accessors: [
    { bufferView: 0, componentType: 5126, count: totalVertices, type: 'VEC3', min: minimo, max: maximo },
    { bufferView: 1, componentType: 5126, count: totalVertices, type: 'VEC3' },
  ],
};

/** Completa o chunk até múltiplo de 4 bytes, como exige o formato GLB. */
const alinhar = (buf: Buffer, preenchimento: number) => {
  const resto = buf.length % 4;
  return resto === 0 ? buf : Buffer.concat([buf, Buffer.alloc(4 - resto, preenchimento)]);
};

const chunkJson = alinhar(Buffer.from(JSON.stringify(gltf)), 0x20);
const chunkBin = alinhar(bin, 0);

const cabecalhoChunk = (tamanho: number, tipo: number) => {
  const h = Buffer.alloc(8);
  h.writeUInt32LE(tamanho, 0);
  h.writeUInt32LE(tipo, 4);
  return h;
};

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

const destino = path.join(__dirname, '..', 'public', 'modelos', 'cristal.glb');
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, Buffer.concat([cabecalho, corpo]));

console.log(`Modelo gerado: ${destino} (${totalVertices} vértices, ${12 + corpo.length} bytes)`);
