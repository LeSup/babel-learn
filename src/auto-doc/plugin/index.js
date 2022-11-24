const path = require('path');
const { declare } = require('@babel/helper-plugin-utils');
const renderer = require('./renderer');
const doctrine = require('doctrine');
const fse = require('fs-extra');

function generate(docs, format = 'json') {
  if (format === 'markdown') {
    return {
      ext: '.md',
      content: renderer.markdown(docs)
    }
  } else {
    return {
      ext: '.json',
      content: renderer.json(docs)
    }        
  }
}

function save(file, doc) {
  const docs = file.get('docs');
  docs.push(doc);
  file.set('docs', docs);
}

function resolveType(typeAnnotation) {
  switch (typeAnnotation.type) {
    case 'TSStringKeyword': 
      return 'string';
    case 'TSNumberKeyword':
      return 'number';
    case 'TSBooleanKeyword':
      return 'boolean';
  }
}

function parseComment(commentStr) {
  if (!commentStr) {
    return;
  }
  return doctrine.parse(commentStr, {
    unwrap: true
  });
}

module.exports = declare((api, options, filename) => {
  api.assertVersion(7);

  return {
    pre(file) {
      file.set('docs', []);
    },
    visitor: {
      FunctionDeclaration(path, state) {
        const doc = {
          type: 'function',
          name: path.get('id').toString(),
          params: path.get('params').map(paramPath => {
            return {
              name: paramPath.toString(),
              type: resolveType(paramPath.getTypeAnnotation())
            }
          }),
          return: resolveType(path.get('returnType').getTypeAnnotation()),
          doc: path.node.leadingComments && parseComment(path.node.leadingComments[0].value)
        };
        save(state.file, doc);
      },
      ClassDeclaration(path, state) {
        const doc = {
          type: 'class',
          name: path.get('id').toString(),
          constructor: {},
          methods: [],
          properties: [],
          doc: path.node.leadingComments && parseComment(path.node.leadingComments[0].value)
        };
        
        // 处理属性及方法
        path.traverse({
          ClassProperty(curPath) {
            doc.properties.push({
              name: curPath.get('key').toString(),
              type: resolveType(curPath.getTypeAnnotation()),
              doc: (curPath.node.leadingComments || []).concat(curPath.node.trailingComments || []).map(comment => {
                  return parseComment(comment.value);
              }).filter(Boolean)
            });
          },
          ClassMethod(curPath) {
            const res = {
              params: curPath.get('params').map(paramPath => ({
                name: paramPath.toString(),
                type: resolveType(paramPath.getTypeAnnotation())
              })),
              doc: curPath.node.leadingComments && parseComment(curPath.node.leadingComments[0].value)
            };
            if (curPath.node.kind === 'method') {
              res.name = curPath.get('key').toString();
              res.return = resolveType(curPath.get('returnType').getTypeAnnotation());
              doc.methods.push(res);
            } else {
              doc.constructor = res;
            }
          }
        });

        save(state.file, doc);
      }
    },
    post(file) {
      const docs = file.get('docs');
      const res = generate(docs, options.format);
      fse.ensureDirSync(options.outputDir);
      fse.writeFileSync(path.join(options.outputDir, 'docs' + res.ext), res.content);
    }
  }
});