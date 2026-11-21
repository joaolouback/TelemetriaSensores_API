/**
 * Armazenamento das fotos de perfil em `public/avatares/` (servidas em `/avatares/*`).
 * O tipo do arquivo é decidido pelos bytes, não pelo cabeçalho enviado pelo cliente.
 */
import fs from 'fs/promises';
import path from 'path';

export const PASTA_AVATARES = path.join(__dirname, '..', '..', '..', 'public', 'avatares');
export const TAMANHO_MAXIMO_FOTO_BYTES = 5 * 1024 * 1024;

/** Extensão do formato reconhecido (JPEG, PNG ou WebP), ou `null` se não for imagem aceita. */
export function detectarFormato(b: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length > 12 && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

/** Grava a foto e devolve o caminho público (ex.: `/avatares/3-1730000000000.jpg`). */
export async function salvarFoto(usuarioId: number, dados: Buffer, extensao: string): Promise<string> {
  await fs.mkdir(PASTA_AVATARES, { recursive: true });
  const arquivo = `${usuarioId}-${Date.now()}.${extensao}`;
  await fs.writeFile(path.join(PASTA_AVATARES, arquivo), dados);
  return `/avatares/${arquivo}`;
}

/** Apaga uma foto antiga. Ignora caminhos que não sejam de `/avatares/` e arquivos já inexistentes. */
export async function apagarFoto(fotoUrl: string | null | undefined): Promise<void> {
  if (!fotoUrl?.startsWith('/avatares/')) return;
  const arquivo = path.basename(fotoUrl);
  await fs.rm(path.join(PASTA_AVATARES, arquivo), { force: true });
}
