/**
 * @name AutoJoinName
 * @description Automatically joins games with a configured name
 * @author Gimloader Official
 * @version 0.1.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/AutoJoinName.js
 * @webpage https://gimloader.github.io/plugins/AutoJoinName
 * @hasSettings true
 * @changelog Updated webpage url
 * @signature kAkYeXdPYdVpUSq7bqhIuCcezeA20D4J57LGP9px/hyfjeViMtFjcPKHbdsrfcg5Il3gamk9wDnI/v0CZv1MBA==
 */

// plugins/AutoJoinName/src/index.ts
var settings = api.settings.create([
  {
    id: "name",
    type: "text",
    title: "Name",
    description: "The name that is automatically joined with",
    maxLength: 20
  }
]);
var localStorageName = "play-again-last-used-name";
settings.listen("name", (name) => {
  localStorage.setItem(localStorageName, name);
}, true);
api.onStop(() => localStorage.removeItem(localStorageName));
