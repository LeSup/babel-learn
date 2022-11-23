const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;
const types = require('@babel/types');
const template = require('@babel/template').default;
const { transformSync } = require('@babel/core');
const insertConsole = require('./plugin');

// const targets = ['log', 'info', 'debug', 'error'].map(item => `console.${item}`);

const sourceCode = `
  console.log(1);

  function func() {
    console.info(2);
  }

  export default class Clazz {
    say() {
      console.debug(3);
    }
    render() {
      return <div>{console.error(4)}</div>
    }
  }
`;

// const ast = parser.parse(sourceCode, {
//   plugins: ['jsx'],
//   sourceType: 'unambiguous'
// });

// 任务一
// traverse(ast, {
//   CallExpression: {
//     enter(path, state) {
//       const caller = generator(path.node.callee).code;
//       if (targets.includes(caller)) {
//         const { line, column } = path.node.loc.start;
//         path.node.arguments.unshift(types.stringLiteral(`start line ${line} column ${column}`));
//       }
//     }
//   }
// })

// 任务二
// traverse(ast, {
//   CallExpression: {
//     enter(path, state) {
//       if (path.node.new) {
//         return;
//       }

//       const caller = generator(path.node.callee).code;
//       if (targets.includes(caller)) {
//         const { line, column } = path.node.loc.start;
        
//         const newNode = template.expression(`console.log('line: ${line}, column: ${column}')`)();
//         newNode.new = true;

//         if (path.find(p => p.isJSXExpressionContainer())) {
//           path.replaceWith(types.arrayExpression([newNode, path.node]));
//           path.skip();
//         } else {
//           path.insertBefore(newNode);
//         }
//       }
//     }
//   }
// })

// const { code } = generator(ast);

const { code } = transformSync(sourceCode, {
  parserOpts: {
    plugins: ['jsx'],
    sourceType: 'unambiguous'
  },
  plugins: [insertConsole]
})

console.log('code', code);