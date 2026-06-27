/**
 * @name CameraControl
 * @description Lets you freely move and zoom your camera
 * @author Gimloader Official
 * @version 0.7.3
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/CameraControl.js
 * @webpage https://gimloader.github.io/plugins/CameraControl
 * @optionalLib CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js
 * @hasSettings true
 * @gamemode 2d
 * @changelog Fixed freecam in spectator mode
 * @signature re0t0qYO5rnqTf18PkIkGlEA9P9yNdsDN3fs4HupRDXZPEHC7l5ffk8f/+QkSrTWhh+F1hwilS9auyxxmBunCw==
 */

// plugins/CameraControl/src/index.ts
var settings = api.settings.create([
  {
    type: "toggle",
    id: "shiftToZoom",
    title: "Hold Shift to Zoom",
    description: "Whether to only allow zooming with the scroll wheel when holding shift",
    default: true
  },
  {
    type: "toggle",
    id: "mouseControls",
    title: "Use mouse controls while freecamming",
    description: "Click and drag on the screen to move the camera while freecamming",
    default: true
  },
  {
    type: "number",
    id: "toggleZoomFactor",
    title: "Toggle Zoom Factor",
    description: "The factor to zoom in/out by when pressing the quick zoom toggle hotkey",
    min: 0.05,
    max: 20,
    default: 2
  },
  {
    type: "toggle",
    id: "capZoomOut",
    title: "Cap Zoom Out",
    description: "Prevents zooming out too far (below 0.1x zoom) to avoid lag and crashes",
    default: true
  }
]);
var freecamming = false;
var freecamPos = { x: 0, y: 0 };
var scrollMomentum = 0;
var changedZoom = false;
var stopDefaultArrows = false;
var stopKeys = ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight"];
for (const key of stopKeys) {
  api.hotkeys.addHotkey({
    key,
    preventDefault: false
  }, (e) => {
    if (stopDefaultArrows) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });
}
var updateFreecam = null;
var updateScroll = (dt) => {
  if (!camera) return;
  scrollMomentum *= 0.97 ** dt;
  camera.zoom += scrollMomentum * dt;
  if (scrollMomentum > 0) changedZoom = true;
  if (settings.capZoomOut) {
    if (camera.zoom <= 0.1) {
      scrollMomentum = 0;
    }
    camera.zoom = Math.max(0.1, camera.zoom);
  }
};
api.net.onLoad(() => {
  const worldManager = api.stores.phaser.scene.worldManager;
  api.patcher.after(worldManager, "update", (_, args) => {
    updateFreecam?.(args[0]);
    updateScroll(args[0]);
  });
});
var scene;
var camera;
var startFollowingObject;
var isPointerDown = false;
var setPointerDown = (e) => {
  if (!isTargetCanvas(e)) return;
  isPointerDown = true;
};
var setPointerUp = () => isPointerDown = false;
window.addEventListener("pointerdown", setPointerDown);
window.addEventListener("pointerup", setPointerUp);
var lastX;
var lastY;
function onPointermove(e) {
  const canvasZoom = api.stores.phaser.scene.resizeManager.usedDpi;
  if (isPointerDown && lastX && lastY) {
    freecamPos.x -= (e.clientX * canvasZoom - lastX) / camera.zoom;
    freecamPos.y -= (e.clientY * canvasZoom - lastY) / camera.zoom;
  }
  lastX = e.clientX * canvasZoom;
  lastY = e.clientY * canvasZoom;
}
function onWheel(e) {
  if (!isTargetCanvas(e)) return;
  if (!freecamming || !settings.mouseControls) {
    if (settings.shiftToZoom && !api.hotkeys.pressed.has("ShiftLeft")) return;
    scrollMomentum -= e.deltaY / 65e3;
    return;
  }
  if (camera.zoom === 0.1 && e.deltaY > 0 && settings.capZoomOut) return;
  const oldzoom = camera.zoom;
  const newzoom = oldzoom * (e.deltaY < 0 ? 1.1 : 0.9);
  const canvasZoom = api.stores.phaser.scene.resizeManager.usedDpi;
  const mouse_x = e.clientX * canvasZoom;
  const mouse_y = e.clientY * canvasZoom;
  const pixels_difference_w = camera.width / oldzoom - camera.width / newzoom;
  const side_ratio_x = (mouse_x - camera.width / 2) / camera.width;
  freecamPos.x += pixels_difference_w * side_ratio_x;
  const pixels_difference_h = camera.height / oldzoom - camera.height / newzoom;
  const side_ratio_h = (mouse_y - camera.height / 2) / camera.height;
  freecamPos.y += pixels_difference_h * side_ratio_h;
  camera.setZoom(newzoom);
  changedZoom = true;
}
api.net.onLoad(() => {
  scene = api.stores?.phaser?.scene;
  camera = scene?.cameras?.cameras?.[0];
  startFollowingObject = scene?.cameraHelper?.startFollowingObject;
  if (!scene) return;
  api.patcher.before(api.stores.phaser.scene.cameraHelper, "resize", () => {
    return changedZoom;
  });
  window.addEventListener("wheel", onWheel);
  api.commands.addCommand({
    text: "CameraControl: Set Zoom",
    keywords: ["camera", "zoom"]
  }, async (context) => {
    camera.zoom = await context.number({ title: "Zoom" });
  });
});
var lastInteractiveSlot = 0;
function stopFreecamming() {
  if (!scene || !camera) return;
  api.stores.me.inventory.activeInteractiveSlot = lastInteractiveSlot;
  GL.patcher.unpatchAll("CameraControl-helper");
  camera.useBounds = true;
  const charObj = api.stores.phaser.mainCharacter.body;
  startFollowingObject({ object: charObj });
  updateFreecam = null;
  stopDefaultArrows = false;
  window.removeEventListener("pointermove", onPointermove);
}
api.hotkeys.addConfigurableHotkey({
  category: "Camera Control",
  title: "Enable Freecam",
  preventDefault: false,
  default: {
    key: "KeyF",
    shift: true
  }
}, () => {
  if (!scene || !camera) return;
  if (freecamming) {
    stopFreecamming();
  } else {
    lastInteractiveSlot = api.stores.me.inventory.activeInteractiveSlot;
    api.stores.me.inventory.activeInteractiveSlot = 0;
    scene.cameraHelper.stopFollow();
    camera.useBounds = false;
    freecamPos = { x: camera.midPoint.x, y: camera.midPoint.y };
    stopDefaultArrows = true;
    GL.patcher.instead("CameraControl-helper", scene.cameraHelper, "setCameraSizeParams", () => {
    });
    GL.patcher.instead("CameraControl-helper", scene.cameraHelper, "startFollowingObject", () => {
    });
    updateFreecam = (dt) => {
      let moveAmount = 0.8 / camera.zoom * dt;
      const pressed = api.hotkeys.pressed;
      if (pressed.has("ControlLeft")) moveAmount *= 5;
      if (pressed.has("ArrowLeft")) freecamPos.x -= moveAmount;
      if (pressed.has("ArrowRight")) freecamPos.x += moveAmount;
      if (pressed.has("ArrowUp")) freecamPos.y -= moveAmount;
      if (pressed.has("ArrowDown")) freecamPos.y += moveAmount;
      scene.cameraHelper.goTo(freecamPos);
    };
    window.addEventListener("pointermove", onPointermove);
  }
  freecamming = !freecamming;
});
var commandLine = api.lib("CommandLine");
if (commandLine) {
  commandLine.addCommand("setzoom", [
    { "amount": "number" }
  ], (zoom) => {
    if (!camera) return;
    camera.zoom = parseFloat(zoom);
  });
}
var zoomToggled = false;
var initialZoom = 1;
var onDown = () => {
  if (!settings.toggleZoomFactor || !camera) return;
  if (zoomToggled) {
    camera.zoom = initialZoom;
  } else {
    initialZoom = camera.zoom;
    camera.zoom /= settings.toggleZoomFactor;
  }
  zoomToggled = !zoomToggled;
};
function isTargetCanvas(e) {
  if (!(e.target instanceof HTMLElement)) return false;
  if (e.target.nodeName === "CANVAS") return true;
  return e.target.matches(".sc-fyfgSA, .sc-gdmatS, .sc-djcAKz, .sc-emMPjM");
}
api.hotkeys.addConfigurableHotkey({
  category: "Camera Control",
  title: "Quick Zoom Toggle",
  preventDefault: false
}, onDown);
api.onStop(() => {
  if (commandLine) {
    commandLine.removeCommand("setzoom");
  }
  window.removeEventListener("wheel", onWheel);
  window.removeEventListener("mousedown", setPointerDown);
  window.removeEventListener("mouseup", setPointerUp);
  const cam = api.stores?.phaser.scene.cameras.main;
  if (cam) cam.zoom = 1;
  if (freecamming) {
    stopFreecamming();
  }
});
