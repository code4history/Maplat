const fs = require('fs');
const path = require('path');

const mapsDir = path.join(__dirname, '../maps');
const files = fs.readdirSync(mapsDir);

files.forEach(file => {
    if (file.endsWith('.json')) {
        const filePath = path.join(mapsDir, file);
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            let changed = false;

            // Check if maptype is NOT base/overlay/google/mapbox/maplibre/osm
            // If maptype is undefined, it defaults to 'maplat' which triggers the check in source_ex.ts
            const maptype = data.maptype || 'maplat';
            const isWmts = /^(?:base|overlay|google(?:_(?:roadmap|satellite|hybrid|terrain))?|mapbox|maplibre|osm)$/.test(maptype);

            if (!isWmts) {
                if (!data.compiled) {
                    console.log(`[${file}] 'compiled' object missing. Creating it.`);
                    data.compiled = {};
                    changed = true;
                }

                if (!data.compiled.wh) {
                    if (data.width && data.height) {
                        data.compiled.wh = [data.width, data.height];
                        console.log(`[${file}] Added compiled.wh = [${data.width}, ${data.height}]`);
                        changed = true;
                    } else {
                        console.warn(`[${file}] Missing width/height to create compiled.wh`);
                    }
                }
            }

            if (changed) {
                fs.writeFileSync(filePath, JSON.stringify(data, null, 0)); // Minified to save space/diff
                console.log(`[${file}] Updated.`);
            }
        } catch (e) {
            console.error(`[${file}] Error processing:`, e);
        }
    }
});
