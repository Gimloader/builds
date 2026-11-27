/**
 * @name ConfirmClose
 * @description Ask for confirmation before closing the tab when in-game
 * @author Gimloader Official
 * @version 1.0.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/ConfirmClose.js
 * @webpage https://gimloader.github.io/plugins/ConfirmClose
 * @signature vPPo236bBotrM7PDFC+l5oT8XmXt6V/GaqJxBO+y1pnPcmI22dYMERpidTqyMh573sEDQ6yW9z8wr6ESrHR+BQ==
 */

// plugins/ConfirmClose/src/index.ts
api.net.onLoad(() => {
  const beforeUnload = (e) => {
    e.preventDefault();
  };
  window.addEventListener("beforeunload", beforeUnload);
  api.onStop(() => window.removeEventListener("beforeunload", beforeUnload));
});
