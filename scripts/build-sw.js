
import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

// Node.js globals like process are available, but require is not.
const isWatch = process.argv.includes('--watch');

const now = new Date();
// Format: YYYY-MM-DD-HH-mm
const version = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + '-' +
    String(now.getHours()).padStart(2, '0') + '-' +
    String(now.getMinutes()).padStart(2, '0');

console.log(`Building Service Worker with version: ${version}`);

const buildOptions = {
    entryPoints: ['src/service-worker/index.ts'],
    bundle: true,
    outfile: isWatch ? 'public/service-worker.js' : 'dist/service-worker.js',
    format: 'iife',
    define: {
        'self.__WB_MANIFEST': '[]',
        'SW_VERSION': `"${version}"`
    },
};

if (isWatch) {
    esbuild.context(buildOptions).then(ctx => {
        ctx.watch();
        console.log('Watching for Service Worker changes...');
    }).catch(() => process.exit(1));
} else {
    esbuild.build(buildOptions).then(() => {
        if (!isWatch) {
             try {
                fs.copyFileSync('dist/service-worker.js', 'public/service-worker.js');
                console.log('Copied service-worker.js to public/');
             } catch (e) {
                 console.error('Failed to copy service-worker.js to public/', e);
             }
        }
        console.log('Service Worker build complete.');
    }).catch(() => process.exit(1));
}
