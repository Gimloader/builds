/**
 * @name SaveBlockCode
 * @description Allows you to save and load block code in creative via the command palette.
 * @author Gimloader Official
 * @version 1.0.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/SaveBlockCode.js
 * @webpage https://gimloader.github.io/plugins/SaveBlockCode
 * @gamemode creative
 * @signature rbpqWBLDjtZjpL34qYTJhLTi5jHSGieT8fHcxvKdwwFC0TxjvKYhTkWvv5zlZ+bm5I9V3ZrDwduU7qchp81+Dg==
 */

// shared/files.ts
function downloadFile(contents, name, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function readFile(accept) {
  return new Promise((res, rej) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return rej("No file selected");
      res(file);
    });
    input.click();
  });
}

// plugins/SaveBlockCode/src/index.ts
function error(message) {
  api.UI.notification.error({ message });
}
function getBlockJson() {
  const deviceEditing = api.stores.me.editing.device;
  const deviceId = deviceEditing.currentlyEditedDevice.id;
  const gridId = deviceEditing.currentlyEditedGridId;
  if (!deviceId || !gridId) return error("Could not detect a currently edited block");
  const codeGrids = api.stores.world.devices.codeGrids;
  const json = codeGrids.get(deviceId)?.items?.get(gridId)?.json;
  if (!json) return error("Could not find a currently edited block");
  return json;
}
function downloadBlocks() {
  const json = getBlockJson();
  if (!json) return;
  downloadFile(json, "block.json", "application/json");
}
async function copyBlocks() {
  const json = getBlockJson();
  if (!json) return;
  try {
    await navigator.clipboard.writeText(json);
    api.UI.notification.success({ message: "Copied block code to clipboard" });
  } catch (e) {
    api.logger.error("Failed to write to clipboard", e);
    error("Failed to write to clipboard");
  }
}
async function setBlockJson(json) {
  try {
    JSON.parse(json);
  } catch (e) {
    api.logger.error("Failed to parse json", e);
    return error("Failed to parse block json");
  }
  const deviceEditing = api.stores.me.editing.device;
  const deviceId = deviceEditing.currentlyEditedDevice.id;
  const gridId = deviceEditing.currentlyEditedGridId;
  if (!deviceId || !gridId) return error("Could not detect a currently edited block");
  try {
    const unsub = api.net.colyseus.state.world.devices.codeGrids.get(deviceId)?.items.get(gridId)?.listen("json", () => {
      api.UI.forceReactUpdate();
      clearTimeout(updateTimeout);
      unsub();
    }, false);
    const updateTimeout = setTimeout(() => {
      api.logger.warn("Code grid failed to update after 2 seconds");
      unsub();
    }, 2e3);
    api.net.colyseus.send("JOIN_CODE_GRID", {
      deviceId,
      gridId
    });
    api.net.colyseus.send("SET_CODE_GRID_JSON", {
      deviceId,
      gridId,
      json
    });
  } catch (e) {
    api.logger.error("Failed to read json", e);
  }
}
async function uploadBlocks() {
  const file = await readFile(".json");
  const json = await file.text();
  setBlockJson(json);
}
async function pasteBlocks() {
  try {
    const text = await navigator.clipboard.readText();
    setBlockJson(text);
  } catch (e) {
    api.logger.error("Failed to read from clipboard", e);
    error("Failed to read from clipboard");
  }
}
api.commands.addCommand({
  text: "SaveBlockCode: Download current block"
}, downloadBlocks);
api.commands.addCommand({
  text: "SaveBlockCode: Load block from file",
  keywords: ["upload"]
}, uploadBlocks);
api.commands.addCommand({
  text: "SaveBlockCode: Copy current block"
}, copyBlocks);
api.commands.addCommand({
  text: "SaveBlockCode: Paste to current block"
}, pasteBlocks);
