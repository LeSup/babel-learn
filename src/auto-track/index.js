const path = require('path')
const { transformFileSync } = require('@babel/core');
const autoTracePlugin = require('./plugin');

const { code } = transformFileSync(path.resolve(__dirname, 'sourceCode.js'), {
  parserOpts: {
    sourceType: 'unambiguous'
  },
  plugins: [[autoTracePlugin, { source: 'track', identifier: 'track' }]]
});

console.log(code);