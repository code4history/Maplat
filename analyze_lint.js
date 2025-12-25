import fs from 'fs';
import path from 'path';

const results = JSON.parse(fs.readFileSync('lint-results.json', 'utf8'));
const summary = results
    .map(file => ({
        path: file.filePath.split('Maplat')[1],
        errorCount: file.errorCount,
        warningCount: file.warningCount,
        anyErrors: file.messages.filter(m => m.ruleId === '@typescript-eslint/no-explicit-any').length
    }))
    .filter(f => f.anyErrors > 0)
    .sort((a, b) => b.anyErrors - a.anyErrors);

console.log(JSON.stringify(summary, null, 2));
console.log('Total Any Errors:', summary.reduce((acc, curr) => acc + curr.anyErrors, 0));
