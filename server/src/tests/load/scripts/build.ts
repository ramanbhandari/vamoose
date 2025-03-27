import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

const inputDir = path.resolve('src/tests/load/scripts');
const outDir = path.resolve('src/tests/load/bundled');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const modules = fs
  .readdirSync(inputDir)
  .filter((f) => f.endsWith('.load.test.ts'))
  .map((f) => f.replace('.load.test.ts', ''));

for (const mod of modules) {
  const banner = `
    export const options = {
      vus: __ENV.VUS ? parseInt(__ENV.VUS) : 10,           // Number of virtual users (default: 10)
      duration: __ENV.DURATION || '30s',                   // Test duration (default: 30s)
      thresholds: {
        http_req_duration: ['p(95)<1000'],                 // 95% of requests must finish < 1 second
        http_req_failed: ['rate==0'],                      // No failed requests allowed
      },
    };


    export function handleSummary(data) {
        const path = __ENV.REPORT_PATH || 'report.json';
        return { [path]: JSON.stringify(data) };
      }
  `;

  build({
    entryPoints: [path.join(inputDir, `${mod}.load.test.ts`)],
    outfile: path.join(outDir, `${mod}.bundle.js`),
    bundle: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2020',
    external: ['k6', 'k6/*'],
    banner: {
      js: banner,
    },
  })
    .then(() => {
      console.log(
        `✅ Bundled ${mod}.load.test.ts with options + handleSummary`,
      );
    })
    .catch((err) => {
      console.error(`❌ Error bundling ${mod}:`, err);
    });
}
