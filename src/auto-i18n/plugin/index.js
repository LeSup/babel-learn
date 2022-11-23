const path = require('path');
const { declare } = require('@babel/helper-plugin-utils');
const generator = require('@babel/generator').default;
const fse = require('fs-extra');

module.exports = declare((api, options, filename) => {
  let intlIndex = 0;
  function nextIntlKey() {
    return `intl${++intlIndex}`;
  }

  function save(file, key, value) {
    const allText = file.get('allText');
    allText.push({
      key,
      value
    });
    file.set('allText', allText);
  }

  api.assertVersion(7);
  return {
    pre(file) {
      file.set('allText', []);
    },
    visitor: {
      Program(path, state) {
        // 遍历导入是否已引入国际化
        path.traverse({
          ImportDeclaration(curPath) {
            if (curPath.get('source').node.value === options.source) {
              state.i18nUid = curPath.get('specifiers.0.local').node.name;
              // 结束此次遍历
              curPath.stop();
            }
          }
        });

        // 引入国际化
        if (!state.i18nUid) {
          state.i18nUid = path.scope.generateUid(options.identifier);
          path.node.body.unshift(api.template.ast(`import ${state.i18nUid} from '${options.source}'`));
        }

        // 标记不需要转化的字符串
        path.traverse({
          'StringLiteral|TemplateLiteral'(curPath) {
            // 引入语句不需要转化
            if (curPath.findParent(p => p.isImportDeclaration())) {
              curPath.node.skipTransform = true;
            }

            // 有i18n-disable注释的不需要转化
            if (curPath.node.leadingComments) {
              curPath.node.leadingComments = curPath.node.leadingComments.filter(comment => {
                if (comment.value === 'i18n-disable') {
                  curPath.node.skipTransform = true;
                  return false;
                }
                return true;
              });
            }
          }
        });
      },
      'StringLiteral|TemplateLiteral'(path, state) {
        if (path.node.skipTransform) {
          return;
        }

        const key = nextIntlKey();
        let value, intlAst;

        if (path.isStringLiteral()) {
          value = path.node.value;
          intlAst = api.template.ast(`${state.i18nUid}.t(${key})`);
          
          // 处理不在{}内的jsx属性值
          if (path.findParent(p => p.isJSXAttribute()) && !path.findParent(p => p.isJSXExpressionContainer())) {
            intlAst = api.types.JSXExpressionContainer(intlAst.expression);
          }
        } else {
          value = path.get('quasis').map(p => p.node.value.raw).join('{placeholder}');

          const otherArgs = path.node.expressions.map(i => generator(i).code);
          intlAst = api.template.ast(`${state.i18nUid}.t(${key}${otherArgs ? ',' + otherArgs.join(',') : ''})`);
        }
        
        save(state.file, key, value);
        path.replaceWith(intlAst);
        // 跳过替换节点
        path.skip();
      }
    },
    post(file) {
      const allText = file.get('allText');
      const result = allText.reduce((acc, cur) => {
        acc[cur.key] = cur.value;
        return acc;
      }, {});
      const source = `const source = ${JSON.stringify(result, null, 2)};\nexport default source;`

      fse.ensureDirSync(options.outputDir);
      fse.writeFileSync(path.resolve(options.outputDir, 'zh_CN.js'), source);
    }
  }
});