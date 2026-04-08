/**
 * @name Multiple1DTabs
 * @description Allows having multiple different tabs connected to a single 1D game
 * @author retrozy
 * @version 0.1.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/Multiple1DTabs.js
 * @webpage https://gimloader.github.io/plugins/Multiple1DTabs
 * @reloadRequired ingame
 * @signature qoAphMJcs66kwWzGFtQoONAjkKu6C9H8mV1n11jDkaKTO/mYIoCvZJ6ACd0jfNmTKLvJdEjVocqBm7KuBs+eBQ==
 */

// plugins/Multiple1DTabs/src/index.ts
api.rewriter.addParseHook("index", (code) => code.replace("this.useClientIdSaving=!0", "this.useClientIdSaving = false"));
