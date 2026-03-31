/**
 * @name SingleTab
 * @description Opens gamemodes in the current tab instead of a new tab.
 * @author retrozy
 * @version 0.1.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/SingleTab.js
 * @webpage https://gimloader.github.io/plugins/SingleTab
 * @changelog Updated webpage url
 * @signature I8kuiHTokddsFkXyj5dpLfJ/azUdDSpeZ7qeqEZ6oHR8N5QvhKkGJA5jLlyyAGw1vJN1ynNfZijT4QmMBvPYBw==
 */

// plugins/SingleTab/src/index.ts
api.patcher.instead(window, "open", () => ({ location }));
