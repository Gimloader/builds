/**
 * @name FixCrashes
 * @description Attempts to prevent natural game crashes
 * @author retrozy
 * @version 0.1.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/FixCrashes.js
 * @webpage https://gimloader.github.io/plugins/FixCrashes
 * @reloadRequired ingame
 * @changelog Fixed an issue by a recent Gimloader update
 * @signature qe3U4zB9PM6r5XKaK5b454eU9tl6gbu7gXrBRLKBTppOHBhorafrxc1Yq1Kq4BO74Jw8KeG4kVGYdnLN1tN2Cw==
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
function getSection(code, match) {
  const { startIndex, endIndex } = getRange(code, match);
  return code.slice(startIndex, endIndex);
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
function insert(code, match, string) {
  const { endIndex } = getRange(code, match);
  const start = code.slice(0, endIndex);
  const end = code.slice(endIndex);
  return start + string + end;
}

// plugins/FixCrashes/src/index.ts
api.rewriter.addParseHook("App", (code) => {
  if (!code.includes(".previewDepth).removeTileAt(this.previewingTile.x")) return code;
  code = insert(code, "clearConsumeErrorMessage=()=>{let#.itemId)@.", "?");
  return insert(code, ".isHoldingDown;this.wasDown#.itemId);if(#@.", "?");
});
api.rewriter.addParseHook("FixSpinePlugin", (code) => {
  const imageData = getSection(code, "this.height=#this.imageData=@,this.data");
  return replaceSection(
    code,
    "this.height=#this.imageData=@this.data",
    `null; try { this.imageData = ${imageData} } catch {}; `
  );
});
