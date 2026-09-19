/**
 * Cálculos geográficos usados na validação de geofencing.
 *
 * A fórmula de Haversine calcula a distância sobre a superfície da esfera
 * terrestre entre dois pares de coordenadas. Para as distâncias curtas deste
 * projeto (dezenas de metros dentro do campus) o erro é desprezível.
 */

/** Raio médio da Terra em metros. */
const RAIO_TERRA_M = 6_371_000;

const paraRadianos = (graus: number): number => (graus * Math.PI) / 180;

/**
 * Distância em METROS entre dois pontos geográficos.
 *
 * @example distanciaEmMetros(-20.3417, -40.2917, -20.3410, -40.2923) // ≈ 100
 */
export function distanciaEmMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = paraRadianos(lat2 - lat1);
  const dLon = paraRadianos(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(paraRadianos(lat1)) *
      Math.cos(paraRadianos(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return RAIO_TERRA_M * c;
}

/**
 * Verifica se uma coordenada está dentro do raio de geofence de um ponto.
 */
export function dentroDoRaio(
  latAtual: number,
  lonAtual: number,
  ponto: { latitude: number; longitude: number; raioGeofence: number }
): boolean {
  return (
    distanciaEmMetros(latAtual, lonAtual, ponto.latitude, ponto.longitude) <=
    ponto.raioGeofence
  );
}
