import { mkdir, cp, rm, writeFile } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('index.html', 'dist/index.html');
await cp('app', 'dist/app', { recursive: true });
await writeFile('dist/.nojekyll', '');
console.log('Static site built in dist/. All paths are relative; no install or bundler needed.');
