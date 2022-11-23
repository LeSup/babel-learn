const { declare } = require('@babel/helper-plugin-utils');

module.exports = declare((api, options, filename) => {
  api.assertVersion(7);

  return {
    visitor: {
      Program(path, state) {
        
      }
    }
  }
});