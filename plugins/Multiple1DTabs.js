/**
 * @name Multiple1DTabs
 * @description Allows having multiple different tabs connected to a single 1D game
 * @author Gimloader Official
 * @version 0.2.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/Multiple1DTabs.js
 * @webpage https://gimloader.github.io/plugins/Multiple1DTabs
 * @signature byURhbKBvmLuZ6BzDw9ATn1ht3+peqU6Yk8ZX2uyVBL6vPByAeVNAjCqiKV99aKbC+XY0AQsu6rccPB9hwo7Aw==
 */

// plugins/Multiple1DTabs/src/index.ts
api.patcher.before(localStorage, "getItem", (_, args) => {
  if (args[0]?.startsWith?.("blueboat-id-")) return true;
});
