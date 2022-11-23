const path = require('path');
const { transformFileSync } = require('@babel/core');
const autoI18n = require('./plugin');

const { code } = transformFileSync(path.resolve(__dirname, 'sourceCode.js'), {
  parserOpts: {
    sourceType: 'unambiguous',
    plugins: ['jsx']
  },
  plugins: [[autoI18n, {
    source: 'intl',
    identifier: 'intl',
    outputDir: path.resolve(__dirname, 'i18n')
  }]]
});

console.log(code);