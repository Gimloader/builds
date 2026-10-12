/**
 * @name NoSchoolHours
 * @description Bypasses the creative discovery page school hours
 * @author Gimloader Official
 * @version 0.2.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/NoSchoolHours.js
 * @webpage https://gimloader.github.io/plugins/NoSchoolHours
 * @changelog Updated to not need a reload
 * @signature iWOpQo10nqIo0ozeSgYGNVJkNCybg+27+cUu2A6rNw8Wbtj840zjNxQ14B1u4/OT9hPpKD1l2UeI/EFT14m/BQ==
 */

// plugins/NoSchoolHours/src/index.ts
var FakeDate = api.rewriter.createShared("FakeDate", {
  default: () => {
    return {
      day: () => 0,
      hour: () => 0
    };
  }
});
api.rewriter.runInScope("App-", (code, run, initial) => {
  const index = code.indexOf("Discovery Is Closed During School Hours");
  if (index === -1) return;
  const startIndex = code.lastIndexOf("\n`,", index) + 3;
  const endIndex = code.indexOf("=", startIndex);
  const varName = code.slice(startIndex, endIndex);
  run(`${varName}=${FakeDate}`);
  if (!initial) api.UI.forceReactUpdate();
});
