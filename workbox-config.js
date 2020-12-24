module.exports = {
    "globDirectory": ".",
    "globPatterns": [
        'index.html',
        'dist/maplat.js',
        'dist/maplat.css',
        'parts/*',
        'locales/*/*',
        'fonts/*'
    ],
    "swDest": ".//service-worker.js",
    "swSrc": "src/service-worker.js"
};