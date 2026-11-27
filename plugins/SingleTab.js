/**
 * @name SingleTab
 * @description Opens gamemodes in the current tab instead of a new tab.
 * @author Gimloader Official
 * @version 0.1.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/SingleTab.js
 * @webpage https://gimloader.github.io/plugins/SingleTab
 * @signature LmxyeZoQBsKYmQGbSvXQw5VWF5+HIIWbYw2A++tVqTHdf7qE3HBB/HGn1A1DgdBVljY1F6DTT35AHpmeuOsbCQ==
 */

// plugins/SingleTab/src/index.ts
api.patcher.instead(window, "open", () => ({ location }));
