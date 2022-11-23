const { declare } = require('@babel/helper-plugin-utils');
const { addDefault } = require('@babel/helper-module-imports');
const generator = require('@babel/generator').default;

module.exports = declare((api, options, filename) => {
  api.assertVersion(7);
  return {
    visitor: {
      Program(path, state) {
        // 遍历导入声明，获取已引入的插桩函数信息
        path.traverse({
          ImportDeclaration(curPath) {
            if (curPath.get('source').node.value === options.source) {
              state.trackUid = curPath.get('specifiers.0.local').node.name;
              state.trackCallStr = `${state.trackUid}();`;
              state.trackCallAst = api.template.ast(state.trackCallStr);
              // 终止此次遍历
              curPath.stop();
            }
          }
        });

        // 没有引入的插桩函数
        if (!state.trackUid) {
          // state.trackUid = path.scope.generateUid(options.identifier);
          // 使用辅助函数插入引入语句
          state.trackUid = addDefault(path, options.source, {
            nameHint: path.scope.generateUid(options.identifier)
          }).name;
          state.trackCallStr = `${state.trackUid}();`;
          state.trackCallAst = api.template.ast(state.trackCallStr);
          // 插入插桩函数引入语句
          // path.node.body.unshift(api.template.ast(`import ${state.trackUid} from '${options.source}'`));
          
        }
      },
      'FunctionDeclaration|ClassMethod|FunctionExpression|ArrowFunctionExpression'(path, state) {
        // TODO: 判断是否存在插入函数的调用
        const bodyPath = path.get('body');
        // 函数体是否是块语句
        if (!bodyPath.isBlockStatement()) {
          const bodyAst = api.template.statement(`{${state.trackCallStr}return PREV_BODY}`)({ PREV_BODY: bodyPath.body });
          bodyPath.replaceWith(bodyAst);
        } else {
          // 是否引入函数调用
          // if (bodyPath.node.body.every(p => generator(p.node).code !== state.trackCallStr)) {
          //   bodyPath.node.body.unshift(state.trackCallAst);
          // }
          bodyPath.node.body.unshift(state.trackCallAst);
        }
      }
    }
  };
});