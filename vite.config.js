import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dts from 'vite-plugin-dts';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect build mode: 'package' for npm package, anything else for demo
const BUILD_MODE = process.env.BUILD_MODE;
const isPackageBuild = BUILD_MODE === 'package';

export default defineConfig(({ command }) => ({
    // Dev server: always use '/'
    // Package build: use '/' (library, base doesn't matter)
    // Demo build: use '/Maplat/' for GitHub Pages
    base: command === 'serve' ? '/' : (isPackageBuild ? '/' : '/Maplat/'),
    plugins: [
        {
            name: 'copy-locales',
            closeBundle() {
                const outDir = isPackageBuild ? 'dist' : 'dist-demo';
                const srcDir = path.resolve(__dirname, 'assets/locales');
                const destDir = path.resolve(__dirname, `${outDir}/assets/locales`);
                if (fs.existsSync(srcDir)) {
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true });
                    }
                    fs.cpSync(srcDir, destDir, { recursive: true, force: true });
                    console.log(`Copied assets/locales to ${outDir}/assets/locales`);
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
        ...(isPackageBuild ? [
            dts({
                insertTypesEntry: true,
            })
        ] : [])
    ],
    css: {
        preprocessorOptions: {
            scss: {
                silenceDeprecations: ['legacy-js-api', 'import', 'color-functions', 'global-builtin', 'if-function'],
                api: 'modern-compiler'
            }
        }
    },
    build: {
        outDir: isPackageBuild ? 'dist' : 'dist-demo',
        copyPublicDir: !isPackageBuild,
        ...(isPackageBuild ? {
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
                    /^.*\/service-worker\// // Exclude service-worker from library build
                ],
                output: {
                    globals: {
                        ol: 'ol',
                        'mapbox-gl': 'mapboxgl',
                        'maplibre-gl': 'maplibregl'
                    },
                    footer: 'if (typeof window !== "undefined" && window.MaplatUi && window.MaplatUi.MaplatUi) { window.MaplatUi = window.MaplatUi.MaplatUi; }'
                }
            }
        } : {
            // Demo build uses standard app mode (no lib config)
            rollupOptions: {
                // No external dependencies for demo - bundle everything except peer deps
            }
        })
    },
    test: {
        environment: 'jsdom',
        include: ['**/*.test.js', '**/*.test.ts', '**/*.spec.js', '**/*.spec.ts'],
        globals: true
    }
}));
