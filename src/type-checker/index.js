const path = require('path');
const { transformSync } = require('@babel/core');
const typeChecker = require('./plugin');

// const sourceCode = `
// let name: string;

// name = 111;
// `;

const sourceCode = `
function add<T>(a: T, b: T): number{
  return a + b;
}
add<number>(1, '2');
`;

transformSync(sourceCode, {
  parserOpts: {
    sourceType: 'unambiguous',
    plugins: ['typescript']
  },
  plugins: [typeChecker]
})