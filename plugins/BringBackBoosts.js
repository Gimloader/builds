/**
 * @name BringBackBoosts
 * @description Restores boosts in Don't Look Down. Will cause you to desync, so others cannot see you move.
 * @author TheLazySquid
 * @version 0.6.3
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/BringBackBoosts.js
 * @webpage https://gimloader.github.io/plugins/BringBackBoosts
 * @needsPlugin Desynchronize | https://raw.githubusercontent.com/Gimloader/builds/main/plugins/Desynchronize.js
 * @hasSettings true
 * @gamemode dontLookDown
 * @changelog Allowed enabling mid-game
 * @signature 9zOWWOfJTY+zdCfVaJ8OWZmvIE7toA3OOo5gHotIDYvBYjgrlxaXl9JzyS+kPRq4uqjnCYhUePUMmvGzQw0ODA==
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

// plugins/BringBackBoosts/src/index.ts
var settings = api.settings.create([
  {
    type: "toggle",
    id: "useOriginalPhysics",
    title: "Use Release Physics",
    description: "Modifies air movement to more closely match the physics from the original launch of platforming",
    default: false
  }
]);
var defaultAirMovement = {
  accelerationSpeed: 0.08125,
  decelerationSpeed: 0.08125,
  maxAccelerationSpeed: 0.14130434782608697
};
var originalAirMovement = {
  accelerationSpeed: 0.121875,
  decelerationSpeed: 0.08125,
  maxAccelerationSpeed: 0.155
};
api.net.onLoad(() => {
  settings.listen("useOriginalPhysics", (usingOriginalPhysics) => {
    if (!GL.platformerPhysics) return;
    GL.platformerPhysics.movement.air = usingOriginalPhysics ? originalAirMovement : defaultAirMovement;
  }, true);
});
var calcGravity = null;
var calcMovementVelocity = api.rewriter.createShared("CalcMovmentVel", (A, t) => {
  var n = { default: api.stores }, a = { default: { normal: 310 } }, I = {
    PhysicsConstants: {
      tickRate: 12,
      debug: false,
      skipTilesDebug: false
    }
  };
  let e = 0, i = 0;
  const s = null == t ? void 0 : t.angle, g = null !== s && (s < 90 || s > 270) ? "right" : null !== s && s > 90 && s < 270 ? "left" : "none", C = n.default.me.movementSpeed / a.default.normal;
  let h = GL.platformerPhysics.platformerGroundSpeed * C;
  if (A.physics.state.jump.isJumping) {
    const t2 = Math.min(GL.platformerPhysics.jump.airSpeedMinimum.maxSpeed, h * GL.platformerPhysics.jump.airSpeedMinimum.multiplier);
    h = Math.max(t2, A.physics.state.jump.xVelocityAtJumpStart);
  }
  let l = 0;
  "left" === g ? l = -h : "right" === g && (l = h);
  const B = 0 !== l;
  if (g !== A.physics.state.movement.direction && (B && 0 !== A.physics.state.movement.xVelocity && (A.physics.state.movement.xVelocity = 0), A.physics.state.movement.accelerationTicks = 0, A.physics.state.movement.direction = g), A.physics.state.movement.xVelocity !== l) {
    A.physics.state.movement.accelerationTicks += 1;
    let t2 = 0, i2 = 0;
    A.physics.state.grounded ? B ? (t2 = GL.platformerPhysics.movement.ground.accelerationSpeed, i2 = GL.platformerPhysics.movement.ground.maxAccelerationSpeed) : t2 = GL.platformerPhysics.movement.ground.decelerationSpeed : B ? (t2 = GL.platformerPhysics.movement.air.accelerationSpeed, i2 = GL.platformerPhysics.movement.air.maxAccelerationSpeed) : t2 = GL.platformerPhysics.movement.air.decelerationSpeed;
    const s2 = 20 / I.PhysicsConstants.tickRate;
    t2 *= A.physics.state.movement.accelerationTicks * s2, i2 && (t2 = Math.min(i2, t2)), e = l > A.physics.state.movement.xVelocity ? Phaser.Math.Clamp(A.physics.state.movement.xVelocity + t2, A.physics.state.movement.xVelocity, l) : Phaser.Math.Clamp(A.physics.state.movement.xVelocity - t2, l, A.physics.state.movement.xVelocity);
  } else e = l;
  return A.physics.state.grounded && A.physics.state.velocity.y > GL.platformerPhysics.platformerGroundSpeed * C && Math.sign(e) === Math.sign(A.physics.state.velocity.x) && (e = A.physics.state.velocity.x), A.physics.state.movement.xVelocity = e, A.physics.state.gravity = calcGravity?.(A.id), i += A.physics.state.gravity, A.physics.state.forces.forEach((A2, _t) => {
    const s2 = A2.ticks[0];
    s2 && (e += s2.x, i += s2.y), A2.ticks.shift();
  }), {
    x: e,
    y: i
  };
});
api.rewriter.runInScope("App", (code, run) => {
  if (!code.includes(".physics.state.jump.xVelocityAtJumpStart),")) return;
  const calcGravName = getSection(code, ".overrideYTravelUntilMaxGravity?#coyoteJumpLimitMS#,@=");
  calcGravity = run(calcGravName);
  const name = getSection(code, ".physics.state.gravity+=#{x:0,y:0}#,@=");
  const originalCalcGrav = api.rewriter.createShared("OriginalCalcGrav", run(name));
  run(`${name} = ${calcMovementVelocity};`);
  api.onStop(() => {
    run(`${name} = ${originalCalcGrav}`);
  });
  return true;
});
