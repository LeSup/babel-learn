const { codeFrameColumns } = require('@babel/code-frame');

const sourceCode = `
const a = 1;
const b = 2;
console.log(a + b);
`;

const res = codeFrameColumns(sourceCode, {
  start: { line: 2, column: 1 },
  end: { line: 3, column: 5 }
}, {
  highlightCode: true,
  message: '出错了'
});

console.log(res);
