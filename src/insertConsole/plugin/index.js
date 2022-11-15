const generator = require('@babel/generator').default;

const targets = ['log', 'info', 'debug', 'error'].map(item => `console.${item}`);

module.exports = ({ types, template }) => {
  return {
    visitor: {
      CallExpression: {
        enter(path, state) {
          if (path.node.new) {
            return;
          }
    
          const caller = generator(path.node.callee).code;
          if (targets.includes(caller)) {
            const { line, column } = path.node.loc.start;
            
            const newNode = template.expression(`console.log('line: ${line}, column: ${column}')`)();
            newNode.new = true;
    
            if (path.find(p => p.isJSXExpressionContainer())) {
              path.replaceWith(types.arrayExpression([newNode, path.node]));
              path.skip();
            } else {
              path.insertBefore(newNode);
            }
          }
        }
      }
    }
  }
}