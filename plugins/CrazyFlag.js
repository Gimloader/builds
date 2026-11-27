/**
 * @name CrazyFlag
 * @description Make the flags in capture the flag or creative swing like crazy!
 * @author Gimloader Official
 * @version 1.3.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/CrazyFlag.js
 * @webpage https://gimloader.github.io/plugins/CrazyFlag
 * @hasSettings true
 * @signature 1/CpMvaaqJmsmbRgM5/p3VrSOk6B7fcoVyZoZixfjdpdavZuyh5KYwaXiQaxOmS/RTZ1G2uQpN0Tm4wyemJDAA==
 */

// plugins/CrazyFlag/src/index.ts
var settings = api.settings.create([
  {
    type: "number",
    id: "swingSpeed",
    title: "Swing Speed",
    description: "1 = normal speed",
    default: 2,
    min: 0
  },
  {
    type: "number",
    id: "swingAmount",
    title: "Swing Amount",
    description: "1 = normal speed",
    default: 120,
    min: 0
  }
]);
var flagConsts = null;
function applySettings() {
  if (!flagConsts) return;
  flagConsts.FlagSwingInterval = 1 / settings.swingSpeed;
  flagConsts.FlagSwingAmplitude = settings.swingAmount / 10;
}
settings.listen("swingSpeed", applySettings);
settings.listen("swingAmount", applySettings);
api.rewriter.exposeVar("FlagDevice", {
  find: /(\w)={FlagOriginX/,
  callback: (consts) => {
    const defaults = Object.assign({}, consts);
    flagConsts = consts;
    applySettings();
    api.onStop(() => {
      if (!flagConsts) return;
      Object.assign(flagConsts, defaults);
    });
  }
});
