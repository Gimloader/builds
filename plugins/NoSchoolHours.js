/**
 * @name NoSchoolHours
 * @description Bypasses the creative discovery page school hours
 * @author Gimloader Official
 * @version 0.2.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/NoSchoolHours.js
 * @webpage https://gimloader.github.io/plugins/NoSchoolHours
 * @signature EHBrd52jdQR35B8U7xF0FLlFv712oRpIYB+h4ofjaNj8Uy370e4hOX2Dabp66iQ+VaktrOlDBM2g52jDqweKCg==
 */

// plugins/NoSchoolHours/src/index.ts
api.rewriter.swapVar("App-", {
  check: "Discovery Is Closed During School Hours",
  find: /\n`,(\w{1,3})=\w{1,3}\(\w{1,3}\(\)\)/,
  callback: (_, initial) => {
    if (!initial) api.UI.forceReactUpdate();
    api.onStop(() => api.UI.forceReactUpdate());
    return {
      default: () => {
        return {
          day: () => 0,
          hour: () => 0
        };
      }
    };
  }
});
