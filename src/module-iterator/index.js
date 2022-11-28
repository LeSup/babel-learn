
const path = require('path');
const traverseModule = require('./traverseModule');

const dependencyGraph = traverseModule(path.resolve(__dirname, 'test-project/index.js'));
console.log(JSON.stringify(dependencyGraph, null, 2));