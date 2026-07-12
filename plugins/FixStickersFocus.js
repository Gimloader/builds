/**
 * @name FixStickersFocus
 * @description Fixes the in-game stickers button keeping focus after being closed
 * @author Gimloader Official
 * @version 0.1.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/FixStickersFocus.js
 * @webpage https://gimloader.github.io/plugins/FixStickersFocus
 * @reloadRequired ingame
 * @signature 0XTghVELfP9oP0XG9L65DEhzyYTx2sk3v4ky82X3Hq03LWmns5WhvahBF1GtgA8eewiypQkMZMj4ndfRZQGEAg==
 */

// shared/rewritingUtils.ts
function getRange(code, match) {
  const snippets = [];
  let currentWord = "";
  for (const letter of match) {
    if (letter === "#") {
      snippets.push(currentWord);
      currentWord = "";
    } else if (letter === "@") {
      snippets.push(currentWord);
      currentWord = "";
      snippets.push("@");
    } else {
      currentWord += letter;
    }
  }
  snippets.push(currentWord);
  const matchIndex = snippets.indexOf("@");
  const snippetsBeforeMatch = snippets.slice(0, matchIndex);
  let startIndex = 0;
  for (const snippet of snippetsBeforeMatch) {
    startIndex = code.indexOf(snippet, startIndex) + snippet.length;
  }
  const snippetAfterMatch = snippets[matchIndex + 1];
  const endIndex = code.indexOf(snippetAfterMatch, startIndex);
  return {
    startIndex,
    endIndex
  };
}
function replaceSection(code, match, replacement) {
  const { startIndex, endIndex } = getRange(code, match);
  const start = code.slice(0, startIndex);
  const end = code.slice(endIndex);
  if (typeof replacement === "function") {
    replacement = replacement(code.slice(startIndex, endIndex));
  }
  return start + replacement + end;
}

// plugins/FixStickersFocus/src/index.ts
api.rewriter.addParseHook("App", (code) => {
  if (!code.includes("sticker.svg")) return code;
  return replaceSection(code, ".sticker-drawer#onClick:@,", (onclick) => `() => { ${onclick}(); document.activeElement?.blur() }`);
});
