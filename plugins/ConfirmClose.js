/**
 * @name ConfirmClose
 * @description Ask for confirmation before closing the tab when in-game
 * @author Gimloader Official
 * @version 1.0.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/ConfirmClose.js
 * @webpage https://gimloader.github.io/plugins/ConfirmClose
 * @changelog Updated webpage url
 * @signature 0J+al9OvyTMhVGKQQYt0tsuxPrb9HPqRsF/jQLLN9YjLoBKGo+3q1A0oWSf/KH7/mwzKFPmxrFiihlaERtQgDQ==
 */

// plugins/ConfirmClose/src/index.ts
api.net.onLoad(() => {
  const beforeUnload = (e) => {
    e.preventDefault();
  };
  window.addEventListener("beforeunload", beforeUnload);
  api.onStop(() => window.removeEventListener("beforeunload", beforeUnload));
});
