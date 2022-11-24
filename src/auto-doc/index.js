const path = require('path');
const { transformFileSync } = require('@babel/core');
const autoDoc = require('./plugin');

const { code } = transformFileSync(path.resolve(__dirname, 'sourceCode.ts'), {
  parserOpts: {
    sourceType: 'unambiguous',
    plugins: ['typescript']
  },
  plugins: [[autoDoc, {
    outputDir: path.resolve(__dirname, 'docs'),
    format: 'markdown'// markdown / json
  }]]
});

console.log(code);