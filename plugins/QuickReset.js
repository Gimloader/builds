/**
 * @name QuickReset
 * @description Quickly lets you restart 2d gamemodes
 * @author Gimloader Official
 * @version 0.5.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/QuickReset.js
 * @webpage https://gimloader.github.io/plugins/QuickReset
 * @gamemode 2d
 * @changelog Allowed completely restarting the game when using GuestControls
 * @signature l0omcDtsfHRLppdo2qnaEBXqxXzRDi9tyQA4qqVPx9KDL/75uaHIHaveBUJe4f6sFio6dA4c8yl4eqzZxFtTCA==
 */

// plugins/QuickReset/src/index.ts
var startMessage = null;
var ignoreNextStart = false;
api.net.colyseus.on("send:START_GAME", (message) => {
  if (ignoreNextStart) return;
  startMessage = message;
});
function reset() {
  if (api.net.type !== "Colyseus" || !api.stores.session.amIGameOwner) return;
  exitToLobby();
  const gameSession = api.net.colyseus.state.session.gameSession;
  if (gameSession.phase === "countdown") return;
  ignoreNextStart = true;
  const interval = setInterval(() => {
    api.net.colyseus.send("START_GAME", startMessage);
  }, 100);
  const unsub = gameSession.listen("phase", (phase) => {
    if (phase !== "countdown") return;
    ignoreNextStart = false;
    clearInterval(interval);
    unsub();
  });
}
function exitToLobby() {
  if (api.net.type !== "Colyseus" || !api.stores.session.amIGameOwner) return;
  api.net.colyseus.send("END_GAME");
  api.net.colyseus.send("RESTORE_MAP_EARLIER");
}
api.hotkeys.addConfigurableHotkey({
  category: "Quick Reset",
  title: "Reset",
  preventDefault: false,
  default: {
    key: "KeyR",
    alt: true
  }
}, reset);
api.hotkeys.addConfigurableHotkey({
  category: "Quick Reset",
  title: "Exit to Lobby",
  preventDefault: true,
  default: {
    key: "KeyL",
    alt: true
  }
}, exitToLobby);
api.net.onLoad(() => {
  api.commands.addCommand({
    text: "QuickReset: Restart Game",
    keywords: ["reset"]
  }, reset);
  api.commands.addCommand({
    text: "QuickReset: Exit to Lobby",
    keywords: ["restart", "reset"]
  }, exitToLobby);
});
export {
  exitToLobby,
  reset
};
