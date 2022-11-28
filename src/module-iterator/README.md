# 模块遍历器

分析模块间的依赖关系，获取import、export信息，构建依赖图谱。

实现思路：

- 读取文件内容
- 通过 `babel parser` 把文件内容 `parse` 成 `ast`
- 遍历 `AST`，对 `ImportDeclaration`、`ExportDeclaration` 分别做处理
- 对分析出的依赖路径进行处理，变成绝对路径，并尝试补全
- 递归处理分析出来的依赖路径
