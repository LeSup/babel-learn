const { declare } = require('@babel/helper-plugin-utils');

const toBase54 = (function() {
  const DIGITS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_";
  return function(num) {
    let str = '';
    do {
      str = DIGITS.charAt(num % 54) + str;
      num = Math.floor(num / 54);
    } while (num > 0)
    return str;
  }
})();

module.exports = declare((api, options, filename) => {
  api.assertVersion(7);

  return {
    pre(file) {
    file.set('uid', 0);
    },
    visitor: {
      Scopable(path, state) {
        let uid = state.file.get('uid');
        const bindings = path.scope.bindings;
        Object.entries(bindings).forEach(([key, binding]) => {
          if (binding.mangled) return;
          binding.mangled = true;
          path.scope.rename(key, path.scope.generateUid(toBase54(uid++)));
        });
        state.file.set('uid', uid);
      }
    }
  }
})