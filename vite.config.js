import { defineConfig, build } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dts from 'vite-plugin-dts';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect build mode: 'package' for npm package, anything else for demo
const BUILD_MODE = process.env.BUILD_MODE;
const isPackageBuild = BUILD_MODE === 'package';
const PACKAGE_EXTERNAL = [
    'ol',
    'mapbox-gl',
    'maplibre-gl',
    /^.*\/service-worker\// // Exclude service-worker from library build
];
const PACKAGE_GLOBALS = {
    ol: 'ol',
    'mapbox-gl': 'mapboxgl',
    'maplibre-gl': 'maplibregl'
};
const UMD_FOOTER = 'if (typeof window !== "undefined" && window.MaplatUi && window.MaplatUi.MaplatUi) { window.MaplatUi = window.MaplatUi.MaplatUi; }';

export default defineConfig(({ command }) => ({
    // Dev server: always use '/'
    // Package build: use '/' (library, base doesn't matter)
    // Demo build: use '/Maplat/' for GitHub Pages
    base: command === 'serve' ? '/' : (isPackageBuild ? '/' : '/Maplat/'),
    resolve: {},
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
                entryRoot: 'src',
            }),
            {
                // ES は複数の入口（`.` と `./element`）を 1 回で作れるが、UMD は Vite が
                // 「output formats に umd/iife を含むときは複数の入口を許さない」と断る。
                // そこで UMD（と CSS）だけを、ES のビルドが終わったあとに 1 入口で作り直す。
                // `configFile: false` なので、このプラグインは入れ子のビルドには入らない。
                name: 'maplat-ui-legacy-umd',
                apply: 'build',
                async closeBundle() {
                    if (!isPackageBuild) return;
                    await build({
                        configFile: false,
                        logLevel: 'warn',
                        build: {
                            outDir: 'dist',
                            emptyOutDir: false,
                            copyPublicDir: false,
                            lib: {
                                entry: path.resolve(__dirname, 'src/index.ts'),
                                name: 'MaplatUi',
                                formats: ['umd'],
                                fileName: () => 'maplat_ui.umd.js',
                                cssFileName: 'maplat_ui'
                            },
                            rollupOptions: {
                                external: PACKAGE_EXTERNAL,
                                output: {
                                    globals: PACKAGE_GLOBALS,
                                    footer: UMD_FOOTER
                                }
                            }
                        }
                    });
                }
            }
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
                // 入口は 2 つ: 旧 UI（`.`）と UI Elements API（`./element`）。どちらも ES で出す。
                entry: {
                    index: path.resolve(__dirname, 'src/index.ts'),
                    'element/index': path.resolve(__dirname, 'src/element/index.ts')
                },
                name: 'MaplatUi',
                formats: ['es'],
                fileName: (_format, entryName) =>
                    entryName === 'index'
                        ? 'maplat_ui.es.js'
                        : `${entryName}.js`,
                cssFileName: 'maplat_ui'
            },
            rollupOptions: {
                external: PACKAGE_EXTERNAL,
                output: {
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.name && assetInfo.name.endsWith('.css')) return 'maplat_ui.css';
                        return assetInfo.name;
                    },
                    globals: PACKAGE_GLOBALS
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
        include: ['spec/**/*.test.ts', 'spec/**/*.spec.ts'],
        exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
        globals: true
    }
}));
