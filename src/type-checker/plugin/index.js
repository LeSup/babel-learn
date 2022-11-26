const { declare } = require('@babel/helper-plugin-utils');

function resolveType(tsType) {
  const type = tsType.type || tsType;
  switch(type) {
    case 'TSBooleanKeyword':
    case 'BooleanTypeAnnotation':
        return 'boolean';
    case 'TSNumberKeyword':
    case 'NumberTypeAnnotation':
      return 'number';
    case 'TSStringKeyword':
    case 'StringTypeAnnotation':
      return 'string';
    case 'TSTypeReference':
      return tsType.typeName.name;
  }
}

module.exports = declare((api, options, filename) => {
  api.assertVersion(7);

  return {
    pre(file) {
      file.set('errors', []);
    },
    visitor: {
      // 赋值语句的类型检查
      // AssignmentExpression(path, state) {
      //   const errors = state.file.get('errors');
      //   const rightType = resolveType(path.get('right').getTypeAnnotation());
      //   const leftBinding = path.scope.getBinding(path.get('left'));
      //   const leftType = resolveType(leftBinding.path.get('id').getTypeAnnotation());

      //   if (rightType !== leftType) {
      //     const tmp = Error.stackTraceLimit;
      //     Error.stackTraceLimit = 0;
      //     errors.push(path.get('right').buildCodeFrameError(`${rightType} can not assign to ${leftType}`, Error));
      //     Error.stackTraceLimit = tmp;
      //   }

      //   state.file.set('errors', errors);
      // }
      // 函数调用
      CallExpression(path, state) {
        const errors = state.file.get('errors');
        // 实参类型
        const argumentsTypes = path.get('arguments').map(p => resolveType(p.getTypeAnnotation()));
        // 传入的泛型类型
        const realTypes = path.node.typeParameters.params.map(i => resolveType(i));
        // 获取函数声明
        const functionDeclarePath = path.scope.getBinding(path.get('callee')).path;
        // 获取定义的泛型类型映射 
        const realTypeMap = {};
        functionDeclarePath.node.typeParameters.params.map((item, index) => realTypeMap[item.name] = realTypes[index]);
        const declareParamsTypes = functionDeclarePath.get('params').map(p => resolveType(p.getTypeAnnotation()))
          .map(i => realTypeMap[i] || i);

        argumentsTypes.forEach((argumentType, index) => {
          const declareParamType = declareParamsTypes[index];
          if (argumentType !== declareParamType) {
            const tmp = Error.stackTraceLimit;
            Error.stackTraceLimit = 0;
            errors.push(path.get(`arguments.${index}`).buildCodeFrameError(`${argumentType} can not assign to ${declareParamType}`, Error));
            Error.stackTraceLimit = tmp;
          }
        });

        state.file.set('errors', errors);
      }
    },
    post(file) {
      console.log(file.get('errors'));
    }
  }
})