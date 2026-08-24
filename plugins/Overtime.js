/**
 * @name Overtime
 * @description Gives automatic overtime when the score is tied in knockout games
 * @author Gimloader Official
 * @version 0.1.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/Overtime.js
 * @webpage https://gimloader.github.io/plugins/Overtime
 * @hasSettings true
 * @gamemode 2d
 * @signature /QHTjU5s9fFBCGkkeFa7scwTbOuaP+qa2En6JkOl7CTrHZxeg+IcdVaPPeAzHnNuSC+iIxj/ikUZUyQvjdYkCQ==
 */

// plugins/Overtime/src/index.ts
var settings = api.settings.create([
  {
    type: "number",
    id: "length",
    title: "Overtime Length (in minutes)",
    min: 1,
    step: 1,
    default: 3
  },
  {
    type: "toggle",
    id: "suddenDeath",
    title: "Sudden Death",
    description: "Ends the game immediately upon a knockout during overtime.",
    default: true
  }
]);
function maxRepeatedTwice(scores) {
  let max = -1;
  let repeated = false;
  for (const score of scores) {
    if (score > max) {
      max = score;
      repeated = false;
    } else if (score === max) {
      repeated = true;
    }
  }
  return repeated;
}
var Overtime = class {
  constructor(mapOptions, getScoreboard) {
    this.mapOptions = mapOptions;
    this.getScoreboard = getScoreboard;
    this.timeout = this.getTimeout();
    this.unsubFromStateChange = api.patcher.after(this.mapOptions, "onStateChange", () => {
      const countdownEndTimestamp = this.mapOptions.state.countdownEndTimestamp;
      if (countdownEndTimestamp !== this.lastCountdownEndTimestamp) {
        clearTimeout(this.timeout);
        this.timeout = this.getTimeout();
      }
    });
  }
  overtimeCount = 0;
  timeout;
  lastCountdownEndTimestamp = 0;
  unsubFromStateChange;
  getTimeout() {
    return setTimeout(() => this.handleEnd(), this.getTimeoutDuration());
  }
  getTimeoutDuration() {
    const countdownEndTimestamp = this.mapOptions.state.countdownEndTimestamp;
    this.lastCountdownEndTimestamp = countdownEndTimestamp;
    return countdownEndTimestamp - Date.now() - 1e3;
  }
  isTied() {
    const scoreboard = this.getScoreboard();
    return maxRepeatedTwice(scoreboard.map((s) => s.score));
  }
  async handleEnd() {
    if (!this.isTied()) return;
    this.overtimeCount++;
    for (let i = 0; i < settings.length; i++) {
      api.net.send("ADD_GAME_TIME");
    }
    api.UI.notification.info({
      message: `Overtime #${this.overtimeCount}`
    });
  }
  stop() {
    clearTimeout(this.timeout);
    this.unsubFromStateChange();
  }
  suddenDeath() {
    if (!this.overtimeCount || this.isTied()) return;
    this.stop();
    api.net.send("END_GAME");
  }
};
api.net.onLoad(async () => {
  if (!api.net.isHost) return;
  const getScoreboard = await new Promise((res) => {
    api.rewriter.exposeVar("App", {
      check: "().includeSpectatorsInScoreboard===!1",
      find: /if\(\w+\)return \w+\.\w+===\w+\.\w+\},(\w+)=\(\)=>/,
      callback: res
    });
  });
  const allDevices = api.stores.phaser.scene.worldManager.devices.allDevices;
  const getMapOptions = () => {
    return allDevices.find((d) => d.deviceOption.id === "mapOptions");
  };
  const mapOptions = getMapOptions();
  if (!mapOptions) return;
  if (mapOptions.options.scoreType !== "Knockout" || !mapOptions.options.useScoreboard) return;
  let overtime = null;
  const session = api.net.state.session;
  api.onStop(
    session.gameSession.listen("phase", (phase) => {
      if (phase !== "results") return;
      overtime?.stop();
      overtime = null;
    }, false)
  );
  api.onStop(
    session.listen("loadingPhase", (loading) => {
      if (loading || session.gameSession.phase !== "game") return;
      const mapOptions2 = getMapOptions();
      if (!mapOptions2) return;
      overtime = new Overtime(mapOptions2, getScoreboard);
    })
  );
  api.net.colyseus.on("KNOCKOUT", () => {
    if (!settings.suddenDeath) return;
    overtime?.suddenDeath();
  });
  api.onStop(() => {
    overtime?.stop();
  });
});
