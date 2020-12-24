module.exports = {
    verbose: true,
    setupFiles: ["jest-canvas-mock"],
    transformIgnorePatterns: [
        "node_modules/(?!(ol|weiwudi)/)", // <- exclude the OL lib
    ],
};