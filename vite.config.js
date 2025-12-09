import { defineConfig } from 'vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [],
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'MaplatUi',
            fileName: (format) => `maplat-ui.${format}.js`
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
