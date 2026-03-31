/**
 * @name UncappedSettings
 * @description Lets you start games with a much wider range of settings than normal
 * @author TheLazySquid
 * @version 0.3.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/UncappedSettings.js
 * @webpage https://gimloader.github.io/plugins/UncappedSettings
 * @changelog Updated webpage url
 * @signature 1vtSZdkuUfHIBBs4VY7lro9lWx0QI7Xt8Vlhepf30cGa8fe/rXW5aQKNTtdr+Foz+npM7FyfVC/8dvR7MlR7AQ==
 */

// plugins/UncappedSettings/src/index.ts
api.net.modifyFetchResponse("/api/experience/map/hooks", (data) => {
  for (const hook of data.hooks) {
    const key = hook.key.toLowerCase();
    if (key.includes("duration")) {
      hook.options.min = 1;
      hook.options.max = 60;
    } else if (key.includes("question")) {
      hook.options.min = -1e11 + 1;
      hook.options.max = 1e11 - 1;
    }
  }
});
