import { z } from 'zod';

const MSG =
  'Informe os parâmetros numéricos `lat` e `lon`. Ex: /api/pontos/proximos?lat=-20.3417&lon=-40.2917';

const numero = z.preprocess((v) => parseFloat(String(v)), z.number({ error: MSG }));

/** Query de `GET /api/pontos/proximos?lat=&lon=`. */
export const pontosProximosSchema = z.object({ lat: numero, lon: numero });

export type PontosProximosDto = z.output<typeof pontosProximosSchema>;
