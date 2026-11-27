/**
 * @name InstantUse
 * @description Instantly use nearby devices without any wait
 * @author Gimloader Official
 * @version 0.2.6
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/InstantUse.js
 * @webpage https://gimloader.github.io/plugins/InstantUse
 * @signature NUo5808H0X3/4JHITUU97hcrZ/qVi6NS7OOR5xb5AcONIHiLWT1Sv0SbHcSXlU5VlS36W8O2f3tn34zh3yN3AQ==
 */

// plugins/InstantUse/src/index.ts
api.hotkeys.addConfigurableHotkey({
  category: "InstantUse",
  title: "Use Device",
  default: {
    key: "Enter"
  },
  preventDefault: false
}, () => {
  if (api.stores?.session?.gameSession?.phase !== "game") return;
  const devices = api.stores?.phaser?.scene?.worldManager?.devices;
  const body = api.stores?.phaser?.mainCharacter?.body;
  if (!devices || !body) return;
  const device = devices.interactives.findClosestInteractiveDevice(devices.devicesInView, body.x, body.y);
  device?.interactiveZones?.onInteraction?.();
});
