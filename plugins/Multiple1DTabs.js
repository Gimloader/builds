/**
 * @name Multiple1DTabs
 * @description Allows having multiple different tabs connected to a single 1D game
 * @author Gimloader Official
 * @version 0.2.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/Multiple1DTabs.js
 * @webpage https://gimloader.github.io/plugins/Multiple1DTabs
 * @changelog Removed need to reload after installing
 * @signature 8Kk9M6IRN9u0kRuYf9jGAHg+XscOqfyo+XrkNdCWrXhmkDuxu8FdkY/rafaUqxhux9so8G/IkNQzjaACU5udAQ==
 */

// plugins/Multiple1DTabs/src/index.ts
api.patcher.before(localStorage, "getItem", (_, args) => {
  if (args[0]?.startsWith?.("blueboat-id-")) return true;
});
