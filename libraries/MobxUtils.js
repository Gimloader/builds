/**
 * @name MobxUtils
 * @description Some simple utilities for react injection with MobX
 * @author Gimloader Official
 * @version 0.3.5
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/libraries/MobxUtils.js
 * @webpage https://gimloader.github.io/libraries/MobxUtils
 * @reloadRequired true
 * @changelog Deprecated in favor of native Gimloader apis
 * @isLibrary true
 * @deprecated MobxUtils has been superceded by native Gimloader apis
 * @signature cHL/5omwsdqLbj5Eb63V7Ob2GIK2m2R8n4NkRRNv+7j2Sh42VPZqG7hGeCivPstKovfgLPObZhSnjb5of6dgAA==
 */

// libraries/MobxUtils/src/index.ts
var observerIntercepts = [];
var wrapObserver = api.rewriter.createShared("ObserverWrapper", (func) => {
  return function() {
    if (api.libs.isEnabled("MobxUtils")) {
      const str = arguments[0].toString();
      for (const intercept of observerIntercepts) {
        if (intercept.match(str)) {
          const newVal = intercept.callback(arguments[0]);
          if (newVal) arguments[0] = newVal;
        }
      }
    }
    return func.apply(this, arguments);
  };
});
api.rewriter.addParseHook("mobxreact", (code) => {
  const index = code.indexOf("[mobx-react-lite]");
  if (index === -1) return code;
  const funcStart = code.lastIndexOf("function", index);
  const nameEnd = code.indexOf("(", funcStart);
  const name = code.slice(funcStart + 9, nameEnd);
  const funcEnd = code.indexOf("}", code.indexOf(".forwardRef)(", index)) + 1;
  const func = code.slice(funcStart, funcEnd);
  code = code.slice(0, funcStart) + `const ${name}=(${wrapObserver}??(v => v))(${func});` + code.slice(funcEnd);
  return code;
});
function interceptObserver(id, match, callback) {
  observerIntercepts.push({ match, callback, id });
}
function stopIntercepts(id) {
  observerIntercepts = observerIntercepts.filter((intercept) => intercept.id !== id);
}
export {
  interceptObserver,
  stopIntercepts
};
