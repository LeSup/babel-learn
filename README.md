# babel

`babel` 是 `compiler`，主要用来将 `ES Next` 语法编写的代码转化为目标环境的代码。

可以做以下工作：

- 语法转换
- 通过 `Polyfill` 方式在目标环境中添加缺失的特性 （通过引入第三方 `polyfill` 模块，例如 `core-js`）
- 源码转换（`codemods`）
- 其他（信息读取、代码压缩等）

## 工作流程

![babel工作流程](./images/workflow.png)

首先将字符串解析成 `ast`，然后对 `ast` 进行需要的转化，最后将转化后的 `ast` 生成字符串及 `source map`。

## 参考

- 节点类型: [AST Node Types](https://github.com/babel/babel/blob/main/packages/babel-parser/ast/spec.md)
- 小型编译器：[the-super-tiny-compiler](https://github.com/thejameskyle/the-super-tiny-compiler)
- AST探索：[astexplorer.net](https://astexplorer.net/#/KJ8AjD6maa)
- 插件手册：[generator-babel-plugin](https://github.com/babel/generator-babel-plugin)

- 概念
- 原理
- 配置
- 插件实现
