/**
 * @name SingleTab
 * @description Opens gamemodes in the current tab instead of a new tab.
 * @author Gimloader Official
 * @version 0.1.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/SingleTab.js
 * @webpage https://gimloader.github.io/plugins/SingleTab
 * @changelog Updated webpage url
 * @signature vmNp9kcTkEybi80WJs/WxfSFVhPWPbUkZ4VoHI/LF25xMyrsySjEG6KwITNNuMPuNf3htngKqI9457UxTawbBQ==
 */

// plugins/SingleTab/src/index.ts
api.patcher.instead(window, "open", () => ({ location }));
