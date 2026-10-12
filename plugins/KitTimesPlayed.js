/**
 * @name KitTimesPlayed
 * @description Shows the number of times that kits have been played on the kits screen
 * @author Gimloader Official
 * @version 0.1.5
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/KitTimesPlayed.js
 * @webpage https://gimloader.github.io/plugins/KitTimesPlayed
 * @reloadRequired notingame
 * @changelog Fixed cleanup not working
 * @signature IngLLm9Suow7OHQro1GV6ehTBnXVM/wEj+j6pb8yaVsX8r9o1LfJqAbdxiCqwvyR0Z9fRtMlbEpEcs22cbGdDg==
 */

// plugins/KitTimesPlayed/src/index.ts
var isEnabled = api.rewriter.createShared("Enabled", true);
api.rewriter.addParseHook("Container-", (code) => {
  const index = code.indexOf(".createdAt?`Created");
  if (index === -1) return code;
  const varStart = code.lastIndexOf("=>", index) + 2;
  const varName = code.slice(varStart, index);
  const insertIndex = code.indexOf("}", index) + 1;
  const playCount = `${varName}.playCount`;
  const insert = `${isEnabled}?${playCount}?${playCount}==1?"played once":"played "+${playCount}+" times":"never played":""`;
  return code.slice(0, insertIndex) + ", ${" + insert + "}" + code.slice(insertIndex);
});
api.onStop(() => {
  if (location.pathname !== "/kits" && location.pathname !== "/gamemode") return;
  const kits = document.getElementsByClassName("ant-card ant-card-bordered ant-card-hoverable");
  for (const kit of kits) {
    const div = kit.children[0]?.children[0]?.children[0]?.children[1]?.children[1];
    if (!div?.innerHTML.includes(",")) return;
    div.innerHTML = div.innerHTML.split(",")[0];
  }
});
