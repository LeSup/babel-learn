const path = require('path');
const { transformFile } = require('@babel/core');
const autoI18n = require('./plugin');

const { code } = transformFile(path.resolve(__dirname, 'sourceCode.js'), {
  parserOpts: {
    sourceType: 'unambiguous',
    plugins: ['jsx']
  },
  plugins: [[autoI18n]]
});

console.log(code);