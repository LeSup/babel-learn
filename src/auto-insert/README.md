# 自动插入

在 `console` 时，插入位置信息。

## 任务一

在 `console.xx` 中插入位置信息。

`console.log(1)` -> `console.log('start line x column y', 1)`

主要代码：

``` js
CallExpression: {
  enter(path, state) {
    const caller = generator(path.node.callee).code;
    if (targets.includes(caller)) {
      const { line, column } = path.node.loc.start;
      path.node.arguments.unshift(types.stringLiteral(`start line ${line} column ${column}`));
    }
  }
}
```

## 任务二

在 `console.xx` 前插入位置信息。

`console.log(1)` -> `console.log('start line x column y');console.log(1)`

主要代码：

``` js
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
```

## 任务三

封装成插件
