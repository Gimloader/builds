/**
 * @name QuickCosmeticSelection
 * @description Allows you to select your cosmetics by only clicking on them.
 * @author Gimloader Official
 * @version 0.1.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/QuickCosmeticSelection.js
 * @webpage https://gimloader.github.io/plugins/QuickCosmeticSelection
 * @reloadRequired true
 * @signature WcPoXsjjDReiwg5WL6iy2MChUa9zdYXnEnluX73LYc0z40/7XkejqgQe+XvYm29+gAgfxRMSGlKslRCqF9GwDg==
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

// plugins/QuickCosmeticSelection/src/index.ts
api.rewriter.addParseHook("App", (code) => {
  if (!code.includes(".sticker?12:void")) return code;
  let selectCosmeticCode = getSection(code, '"Update":"Selected"#onClick#{#,@}}};');
  selectCosmeticCode = replaceSection(selectCosmeticCode, ".type,@onSuccess", "");
  const isStickerCode = getSection(code, ".sticker?12:void#if@return");
  const shouldShowInfo = getSection(code, '"Update":"Selected"#disabled:@&');
  code = insert(code, ".sticker?12:void 0#onClick#,@#", `(!(${shouldShowInfo}) && !${isStickerCode}) ? ${selectCosmeticCode} : `);
  return code;
});
