/**
 * @name Multiple1DTabs
 * @description Allows having multiple different tabs connected to a single 1D game
 * @author Gimloader Official
 * @version 0.1.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/Multiple1DTabs.js
 * @webpage https://gimloader.github.io/plugins/Multiple1DTabs
 * @reloadRequired ingame
 * @signature Cl43fySn41laEFeNLDQF/17ukKx3xb4ltzAWA6uy948tksqNlaCxUQzWIPr6YT1NuioIq5oqTkFyIdL+BDbVBg==
 */

// plugins/Multiple1DTabs/src/index.ts
api.rewriter.addParseHook("index", (code) => code.replace("this.useClientIdSaving=!0", "this.useClientIdSaving = false"));
