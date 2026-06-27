/**
 * @name CameraControl
 * @description Lets you freely move and zoom your camera
 * @author Gimloader Official
 * @version 1.0.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/CameraControl.js
 * @webpage https://gimloader.github.io/plugins/CameraControl
 * @optionalLib CommandLine | https://raw.githubusercontent.com/Blackhole927/gimkitmods/main/libraries/CommandLine/CommandLine.js
 * @hasSettings true
 * @gamemode 2d
 * @changelog Cleaned up code significantly
 * @signature 3xVf1CJt44gQVRcdslz1XZYwkBZ8fYdiQhbQL7GIA+T4EQPLmCtCfdA4fnCRVkMmVd/laWSZ3WXC63zx6mT6Bw==
 */

// plugins/CameraControl/src/settings.ts
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

// plugins/CameraControl/src/util.ts
function isTargetCanvas(e) {
  if (!(e.target instanceof HTMLElement)) return false;
  if (e.target.nodeName === "CANVAS") return true;
  return e.target.matches(".sc-fyfgSA, .sc-gdmatS, .sc-djcAKz, .sc-emMPjM");
}
var getCamera = () => api.stores.phaser.scene.cameras.cameras[0];

// plugins/CameraControl/src/freecam.ts
var isFreecamming = false;
var freecamPos = { x: 0, y: 0 };
function updateFreecam(dt) {
  if (!isFreecamming) return;
  const scene = api.stores.phaser.scene;
  const camera = scene.cameras.cameras[0];
  let moveAmount = 0.8 / camera.zoom * dt;
  const pressed = api.hotkeys.pressed;
  if (pressed.has("ControlLeft")) moveAmount *= 5;
  if (pressed.has("ArrowLeft")) freecamPos.x -= moveAmount;
  if (pressed.has("ArrowRight")) freecamPos.x += moveAmount;
  if (pressed.has("ArrowUp")) freecamPos.y -= moveAmount;
  if (pressed.has("ArrowDown")) freecamPos.y += moveAmount;
  scene.cameraHelper.goTo(freecamPos);
}
var preFreecamInteractiveSlot = 0;
function stopFreecam() {
  api.stores.me.inventory.activeInteractiveSlot = preFreecamInteractiveSlot;
  GL.patcher.unpatchAll("CameraControl-helper");
  getCamera().useBounds = true;
  const charObj = api.stores.phaser.mainCharacter.body;
  api.stores.phaser.scene.cameraHelper.startFollowingObject({ object: charObj });
}
function startFreecam() {
  preFreecamInteractiveSlot = api.stores.me.inventory.activeInteractiveSlot;
  api.stores.me.inventory.activeInteractiveSlot = 0;
  const scene = api.stores.phaser.scene;
  const camera = scene.cameras.cameras[0];
  scene.cameraHelper.stopFollow();
  camera.useBounds = false;
  freecamPos = { x: camera.midPoint.x, y: camera.midPoint.y };
  GL.patcher.instead("CameraControl-helper", scene.cameraHelper, "setCameraSizeParams", () => {
  });
  GL.patcher.instead("CameraControl-helper", scene.cameraHelper, "startFollowingObject", () => {
  });
  window.addEventListener("pointermove", onPointermove);
}
function toggleFreecam() {
  isFreecamming = !isFreecamming;
  if (isFreecamming) startFreecam();
  else stopFreecam();
}
var stopKeys = ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight"];
for (const key of stopKeys) {
  api.hotkeys.addHotkey({
    key,
    preventDefault: false
  }, (e) => {
    if (!isFreecamming) return;
    e.stopImmediatePropagation();
    e.preventDefault();
  });
}
var isPointerDown = false;
function onPointerDown(e) {
  if (!isTargetCanvas(e)) return;
  isPointerDown = true;
}
function onPointerUp() {
  isPointerDown = false;
}
var lastMouseX;
var lastMouseY;
function onPointermove(e) {
  const canvasZoom = api.stores.phaser.scene.resizeManager.usedDpi;
  if (isFreecamming && settings.mouseControls && isPointerDown && lastMouseX && lastMouseY) {
    const camera = getCamera();
    freecamPos.x -= (e.clientX * canvasZoom - lastMouseX) / camera.zoom;
    freecamPos.y -= (e.clientY * canvasZoom - lastMouseY) / camera.zoom;
  }
  lastMouseX = e.clientX * canvasZoom;
  lastMouseY = e.clientY * canvasZoom;
}
api.net.onLoad(() => {
  window.addEventListener("pointermove", onPointermove);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);
  api.onStop(() => {
    window.removeEventListener("pointermove", onPointermove);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointerup", onPointerUp);
    if (isFreecamming) stopFreecam();
  });
});

// plugins/CameraControl/src/zoom.ts
function setZoom(zoom) {
  getCamera().zoom = zoom;
}
var scrollMomentum = 0;
function onWheel(e) {
  if (!isTargetCanvas(e)) return;
  if (!isFreecamming || !settings.mouseControls) {
    if (settings.shiftToZoom && !api.hotkeys.pressed.has("ShiftLeft")) return;
    scrollMomentum -= e.deltaY / 65e3;
    return;
  }
  const camera = getCamera();
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
}
function updateZoom(dt) {
  const camera = getCamera();
  scrollMomentum *= 0.97 ** dt;
  camera.zoom += scrollMomentum * dt;
  if (!settings.capZoomOut) return;
  if (camera.zoom <= 0.1) scrollMomentum = 0;
  camera.zoom = Math.max(0.1, camera.zoom);
}
var zoomToggled = false;
var preToggleZoom = 1;
function toggleZoom() {
  if (!settings.toggleZoomFactor) return;
  const camera = getCamera();
  if (zoomToggled) {
    camera.zoom = preToggleZoom;
  } else {
    preToggleZoom = camera.zoom;
    camera.zoom /= settings.toggleZoomFactor;
  }
  zoomToggled = !zoomToggled;
}
var initialZoom = 1;
api.net.onLoad(() => {
  const camera = getCamera();
  initialZoom = camera.zoom;
  api.onStop(() => camera.zoom = initialZoom);
  api.patcher.before(api.stores.phaser.scene.cameraHelper, "resize", () => true);
  window.addEventListener("wheel", onWheel);
  api.onStop(() => window.removeEventListener("wheel", onWheel));
});

// plugins/CameraControl/src/index.ts
api.net.onLoad(() => {
  const worldManager = api.stores.phaser.scene.worldManager;
  api.patcher.after(worldManager, "update", (_, args) => {
    updateFreecam(args[0]);
    updateZoom(args[0]);
  });
});
api.hotkeys.addConfigurableHotkey({
  category: "Camera Control",
  title: "Enable Freecam",
  preventDefault: false,
  default: {
    key: "KeyF",
    shift: true
  }
}, toggleFreecam);
api.hotkeys.addConfigurableHotkey({
  category: "Camera Control",
  title: "Quick Zoom Toggle",
  preventDefault: false
}, toggleZoom);
api.net.onLoad(() => {
  api.commands.addCommand({
    text: "CameraControl: Set Zoom",
    keywords: ["camera", "zoom"]
  }, async (context) => {
    const zoom = await context.number({ title: "Zoom" });
    setZoom(zoom);
  });
  const commandLine = api.lib("CommandLine");
  if (!commandLine) return;
  commandLine.addCommand("setzoom", [
    { "amount": "number" }
  ], (zoom) => {
    setZoom(parseFloat(zoom));
  });
  api.onStop(() => commandLine.removeCommand("setzoom"));
});
