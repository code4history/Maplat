
import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

// Node.js globals like process are available, but require is not.
const isWatch = process.argv.includes('--watch');

console.log('Building Service Worker');

const buildOptions = {
    entryPoints: ['src/service-worker/index.ts'],
    bundle: true,
    outfile: isWatch ? 'public/service-worker.js' : 'dist/service-worker.js',
    format: 'iife',
    define: {
        'self.__WB_MANIFEST': '[]'
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
