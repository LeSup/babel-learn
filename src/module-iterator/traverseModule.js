const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const DependencyNode = require('./dependencyNode');

const EXTS = ['.tsx','.ts','.jsx','.js'];

const IMPORT_TYPE = {
  deconstruct: 'deconstruct',
  default: 'default',
  namespace: 'namespace'
};

const EXPORT_TYPE = {
  all: 'all',
  default: 'default',
  named: 'named'
}

const visitedModules = new Set();

function isDirectory(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch(e) {}
  return false;
}

function tryCompletePath (resolvePath) {
  for (let i = 0; i < EXTS.length; i ++) {
    let tryPath = resolvePath(EXTS[i]);
    if (fs.existsSync(tryPath)) {
      return tryPath;
    }
  }
}

function returnOrThrow(modulePath) {
  if (!modulePath) {
    throw 'module not found: ' + modulePath;
  } else {
    return modulePath;
  }
}

function completeModulePath(modulePath) {
  if (isDirectory(modulePath)) {
    const tryModulePath = tryCompletePath((ext) => path.join(modulePath, 'index' + ext));
    return returnOrThrow(tryModulePath);
  } else {
    const tryModulePath = tryCompletePath((ext) => modulePath + ext);
    return returnOrThrow(tryModulePath);
  }
}

function moduleResolver(modulePath, requirePath) {
  requirePath = path.resolve(path.dirname(modulePath), requirePath);

  if (requirePath.includes('node_modules')) {
    return;
  }

  if (!requirePath.match(/\.[a-zA-Z]+$/)) {
    requirePath = completeModulePath(requirePath);
  }

  if (visitedModules.has(requirePath)) {
    return;
  } else {
    visitedModules.add(requirePath);
    return requirePath;
  }
}

function resolveBabelSyntaxPlugins(modulePath) {
  const plugins = [];
  if (['.tsx', '.jsx'].some(ext => modulePath.endsWith(ext))) {
    plugins.push('jsx');
  }
  if (['.ts', '.tsx'].some(ext => modulePath.endsWith(ext))) {
    plugins.push('typescript');
  }
  return plugins;
}

function traverseJsModule(modulePath, dependencyNode, allModules) {
  dependencyNode.path = modulePath;

  const moduleContent = fs.readFileSync(modulePath, {
    encoding: 'utf-8'
  });

  const ast = parser.parse(moduleContent, {
    sourceType: 'unambiguous',
    plugins: resolveBabelSyntaxPlugins(modulePath)
  });

  traverse(ast, {
    ImportDeclaration(path) {
      const subModulePath = moduleResolver(modulePath, path.get('source').node.value);
      if (!subModulePath) {
        return;
      }

      // 收集import 信息
      const specifierPaths = path.get('specifiers');
      dependencyNode.imports[subModulePath] = specifierPaths.map(specifierPath => {
        if (specifierPath.isImportDefaultSpecifier()) {
          return {
            type: IMPORT_TYPE.default,
            local: specifierPath.get('local').node.name
          }
        } else if (specifierPath.isImportNamespaceSpecifier()) {
          return {
            type: IMPORT_TYPE.namespace,
            local: specifierPath.get('local').node.name
          }
        } else {
          return {
            type: IMPORT_TYPE.deconstruct,
            imported: specifierPath.get('imported').node.name,
            local: specifierPath.get('local').node.name
          }
        }
      }); 
    
      // 递归处理依赖模块
      const subDependencyNode = new DependencyNode();
      traverseJsModule(subModulePath, subDependencyNode, allModules);
      dependencyNode.subModules[subModulePath] = subDependencyNode;
    },
    ExportDeclaration(path) {
      //收集 export 信息
      if (path.isExportNamedDeclaration()) {
        const specifiers = path.get('specifiers');
        dependencyNode.exports = specifiers.map(specifierPath => ({
          type: EXPORT_TYPE.named,
          exported: specifierPath.get('exported').node.name,
          local: specifierPath.get('local').node.name
        }));
      } else if (path.isExportDefaultDeclaration()) {
          let exportName;
          const declarationPath = path.get('declaration');
          if (declarationPath.isAssignmentExpression()) {
            exportName = declarationPath.get('left').toString();
          } else {
            exportName = declarationPath.toString()
          }
          dependencyNode.exports.push({
            type: EXPORT_TYPE.default,
            exported: exportName
          });
      } else {
        dependencyNode.exports.push({
          type: EXPORT_TYPE.all,
          exported: path.get('exported').node.name,
          source: path.get('source').node.value
        });
      }
    }
  });

  allModules[modulePath] = dependencyNode;
}

module.exports = function(mainModulePath) {
  const dependencyGraph = {
    root: new DependencyNode(),
    allModules: {}
  };
  traverseJsModule(mainModulePath, dependencyGraph.root, dependencyGraph.allModules);
  return dependencyGraph;
}