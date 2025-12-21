import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { VitePWA } from 'vite-plugin-pwa';
import dts from 'vite-plugin-dts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [
        {
            name: 'copy-locales',
            closeBundle() {
                const srcDir = path.resolve(__dirname, 'assets/locales');
                const destDir = path.resolve(__dirname, 'dist/assets/locales');
                if (fs.existsSync(srcDir)) {
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true });
                    }
                    fs.cpSync(srcDir, destDir, { recursive: true, force: true });
                    console.log('Copied assets/locales to dist/assets/locales');
                }
            }
        },
        {
            name: 'serve-static-assets-files',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.url.startsWith('/assets/')) {
                        const file = path.join(__dirname, req.url);
                        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
                            if (req.url.endsWith('.json')) res.setHeader('Content-Type', 'application/json');
                            if (req.url.endsWith('.woff')) res.setHeader('Content-Type', 'font/woff');
                            if (req.url.endsWith('.woff2')) res.setHeader('Content-Type', 'font/woff2');
                            if (req.url.endsWith('.ttf')) res.setHeader('Content-Type', 'font/ttf');

                            const stream = fs.createReadStream(file);
                            stream.pipe(res);
                            return;
                        }
                    }
                    next();
                });
            }
        },
        dts({
            insertTypesEntry: true,
        })
    ],
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'MaplatUi',
            fileName: (format) => `maplat-ui.${format}.js`,
            formats: ['es', 'umd']
        },
        rollupOptions: {
            external: [
                'ol',
                'mapbox-gl',
                'maplibre-gl',
                '@maplat/core',
                '@maplat/transform'
            ],
            output: {
                globals: {
                    ol: 'ol',
                    'mapbox-gl': 'mapboxgl',
                    'maplibre-gl': 'maplibregl',
                    '@maplat/core': 'MaplatCore',
                    '@maplat/transform': 'MaplatTransform'
                }
            }
        }
    },
    test: {
        environment: 'jsdom',
        include: ['**/*.test.js', '**/*.test.ts', '**/*.spec.js', '**/*.spec.ts'],
        globals: true
    }
});
