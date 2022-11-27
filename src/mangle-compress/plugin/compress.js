const { declare } = require('@babel/helper-plugin-utils');

function canExistAfterCompletion(path) {
  return path.isFunctionDeclaration() || path.isVariableDeclaration({ kind: 'var '});
}

module.exports = declare((api, options, filename) => {
  api.assertVersion(7);

  return {
    visitor: {
      Program(path, state) {
        path.traverse({
          // 删除CompletionStatement后的无用代码
          BlockStatement(curPath) {
            let purge = false;
            curPath.get('body').forEach(statementPath => {
              if (statementPath.isCompletionStatement()) {
                purge = true;
                return;
              }

              if (purge && !canExistAfterCompletion(statementPath)) {
                statementPath.remove();
              }
            })
          }
        })
      },
      // 删除没有被引用的变量
      Scopable(path, state) {
        Object.entries(path.scope.bindings).forEach(([key, binding]) => {
          if (!binding.referenced) {
            const initPath = binding.path.get('init');
            if (initPath.isCallExpression()) {
              const comments = initPath.node.leadingComments;//拿到节点前的注释
              if (comments && comments[0]) {
                if (comments[0].value.includes('PURE')) {//有 PURE 注释就删除
                  binding.path.remove();
                  return;
                }
              }
            }

            const initNode = binding.path.node.init;
            if (!path.scope.isPure(initNode)) {
              binding.path.parentPath.replaceWith(api.types.expressionStatement(initNode));
            } else {
              binding.path.remove();
            }
          }
        });
      }
    }
  }
})