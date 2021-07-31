#! /usr/bin/env node

const process = require('process');
const path = require('path');
const fs = require('fs-extra');

const fromPath = path.resolve(process.cwd(), "locales");
const toFPath = path.resolve(process.cwd(), "src/freeze_locales.js");

const files = fs.readdirSync(fromPath).filter(file => file.indexOf('.') !== 0).sort();
const fLists = {};

for (let i = 0; i < files.length; i++) {
  const lang = files[i];
  const json = require(path.resolve(fromPath, `${lang}${path.sep}translation.json`));
  fLists[lang] = {
    translation: json
  };
}
fs.writeFileSync(toFPath, `export default ${JSON.stringify(fLists, null, 2)};`, {});
