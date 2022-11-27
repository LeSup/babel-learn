const { transformSync } = require('@babel/core');
const compress = require('./plugin/compress');
const mangle = require('./plugin/mangle');

const sourceCode = `
function func() {
  const num1 = 1;
  const num2 = 2;
  const num3 = /*@__PURE__*/add(1, 2);
  const num4 = add(3, 4);
  console.log(num2);
  return num2;
  console.log(num1);
  function add (aaa, bbb) {
    return aaa + bbb;
  }
}
func();
`;

const { code } = transformSync(sourceCode, {
  parserOpts: {
    sourceType: 'unambiguous'
  },
  plugins: [compress, mangle]
});

console.log(code);
