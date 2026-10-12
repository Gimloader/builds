/**
 * @name PhysicsSettings
 * @description Allows you to configure various things about the physics in platformer modes (client-side only)
 * @author Gimloader Official
 * @version 0.3.3
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/PhysicsSettings.js
 * @webpage https://gimloader.github.io/plugins/PhysicsSettings
 * @needsPlugin Desynchronize | https://raw.githubusercontent.com/Gimloader/builds/main/plugins/Desynchronize.js
 * @hasSettings true
 * @gamemode 2d
 * @changelog Fixed for new Gimkit update
 * @signature Eb+xpVHpzIjR0Q5SfSZf6LrT0QIYeLuhrtlTCTPmE0L2KGac+1QKiCHclnVwFlExfNN83opDB27X9uXcy3JxCw==
 */

// plugins/PhysicsSettings/src/index.ts
var settings = api.settings.create([
  {
    type: "number",
    id: "jumps",
    title: "Number of Jumps",
    description: "How many jumps should the character get, including the one on the ground? 2 by default.",
    min: 0,
    step: 1,
    default: 2
  },
  {
    type: "number",
    id: "jumpheight",
    title: "Jump Height",
    description: "How high should the character jump? 1.92 by default.",
    default: 1.92
  },
  {
    type: "number",
    id: "speed",
    title: "Grounded Move Speed",
    description: "How fast should the character move on the ground? 310 by default.",
    default: 310
  },
  {
    type: "number",
    id: "tps",
    title: "Ticks Per Second",
    description: "The amount of physics ticks per second the game runs at, higher values feel more instant. Updating requires a reload. 12 by default.",
    default: 12,
    onChange() {
      if (api.net.type === "None") return;
      api.requestReload();
    }
  }
]);
var rewritten = false;
var getTps = api.rewriter.createShared("GetTPS", () => settings.tps);
var triggerRewritten = api.rewriter.createShared("TriggerRewritten", () => rewritten = true);
api.rewriter.addParseHook("FixPhaserBootProcess-", (code) => {
  if (!code.includes("{tickRate:12")) return code;
  code = code.replace("{tickRate:12", `{tickRate:${getTps}?.()??12`);
  return code + `${triggerRewritten}?.();`;
});
var updateMapOption = (key, value) => {
  const options = JSON.parse(api.stores.world.mapOptionsJSON);
  options[key] = value;
  api.stores.world.mapOptionsJSON = JSON.stringify(options);
};
var applyAll = () => {
  const options = JSON.parse(api.stores.world.mapOptionsJSON);
  options.maxJumps = settings.jumps;
  options.jumpHeight = settings.jumpheight;
  api.stores.world.mapOptionsJSON = JSON.stringify(options);
};
api.net.onLoad(() => {
  if (!rewritten && settings.tps !== 12) api.requestReload();
  if (api.stores?.session?.mapStyle !== "platformer") return;
  api.net.colyseus.state.listen("mapSettings", () => {
    applyAll();
  });
  const dldTas = api.plugin("DLDTAS");
  dldTas?.setMoveSpeed(settings.speed);
  api.stores.me.movementSpeed = settings.speed;
  settings.listen("jumps", (jumps) => updateMapOption("maxJumps", jumps));
  settings.listen("jumpheight", (height) => updateMapOption("jumpHeight", height));
  settings.listen("speed", (speed) => {
    dldTas?.setMoveSpeed(settings.speed);
    api.stores.me.movementSpeed = speed;
  });
  api.onStop(() => {
    const options = JSON.parse(api.stores.world.mapOptionsJSON);
    options.maxJumps = 2;
    options.jumpHeight = 1.92;
    api.stores.world.mapOptionsJSON = JSON.stringify(options);
    dldTas?.setMoveSpeed(310);
    api.stores.me.movementSpeed = 310;
    if (settings.tps !== 12) api.requestReload();
  });
});
