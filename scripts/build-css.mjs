import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass-embedded';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const distDir = path.join(rootDir, 'dist');
const outputPath = path.join(distDir, 'bp-calendar.css');
const resetCssCandidates = [
  path.join(rootDir, 'node_modules', '@braudypedrosa', 'bp-ui-components', 'dist', 'styles', 'widget-reset.css'),
  path.resolve(rootDir, '../bp-ui-components/dist/styles/widget-reset.css'),
];

async function readFirstAvailable(paths) {
  for (const candidate of paths) {
    try {
      return await readFile(candidate, 'utf8');
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unable to locate bp-ui-components widget reset stylesheet.');
}

const resetCss = await readFirstAvailable(resetCssCandidates);
const compiledCalendar = await sass.compileAsync(path.join(rootDir, 'bp-calendar.scss'), {
  style: 'expanded',
  sourceMap: false,
});

await mkdir(distDir, { recursive: true });
await writeFile(outputPath, `${resetCss}\n\n${compiledCalendar.css}`);
