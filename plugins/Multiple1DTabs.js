/**
 * @name Multiple1DTabs
 * @description Allows having multiple different tabs connected to a single 1D game
 * @author Gimloader Official
 * @version 0.1.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/Multiple1DTabs.js
 * @webpage https://gimloader.github.io/plugins/Multiple1DTabs
 * @reloadRequired ingame
 * @changelog Fixed for new Gimkit update
 * @signature vdbYrQoJThQUIR9nWYffW3l/dqUs3m19IPqrSaXrulxngZ52sHdWOMcJcVYtMWX6XXHXn1iN0KHP2hrNUc22DQ==
 */

// plugins/Multiple1DTabs/src/index.ts
api.rewriter.addParseHook("ObjectListener", (code) => code.replace("this.useClientIdSaving=!0", "this.useClientIdSaving=false"));
