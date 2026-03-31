/**
 * @name ConfirmClose
 * @description Ask for confirmation before closing the tab when in-game
 * @author TheLazySquid
 * @version 1.0.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/ConfirmClose.js
 * @webpage https://gimloader.github.io/plugins/ConfirmClose
 * @changelog Updated webpage url
 * @signature rcZcG9M850629exjYkYxkTGESZqGRyCVJ7F8H37sjSVt28pMq4w/BDXPUTUEsVY0/roVxTIaN+HloNGfGGH8BQ==
 */

// plugins/ConfirmClose/src/index.ts
api.net.onLoad(() => {
  const beforeUnload = (e) => {
    e.preventDefault();
  };
  window.addEventListener("beforeunload", beforeUnload);
  api.onStop(() => window.removeEventListener("beforeunload", beforeUnload));
});
