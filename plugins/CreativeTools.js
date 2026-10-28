/**
 * @name CreativeTools
 * @description Adds various quality of life improvements to the Creative editor
 * @author Gimloader Official
 * @version 0.3.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/CreativeTools.js
 * @webpage https://gimloader.github.io/plugins/CreativeTools
 * @reloadRequired ingame
 * @gamemode creative
 * @changelog Added find/replace for selected terrain
 * @signature e99lSpHD0YjmO2Gdmk4jmgCQfvuTzc+prcFkC/LcwCdcCPxHja2RlmryeQbwktijuSQhd4SSrraXhstUqpe6Dg==
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
async function readJsonFile() {
  const file = await readFile(".json");
  const text = await file.text();
  return JSON.parse(text);
}

// plugins/CreativeTools/src/tools/export.ts
function exportWholeMap() {
  const data = getWholeMapData();
  downloadFile(JSON.stringify(data), "map.json", "application/json");
}
function getWholeMapData() {
  const terrain = [];
  const layerManager = api.stores.phaser.scene.tileManager.layerManager;
  for (let i = 1; i <= 5; i++) {
    const layer = layerManager.layers.get(`terrain-${i}`);
    for (const tile of layer.tiles.values()) {
      terrain.push({
        x: tile.x,
        y: tile.y,
        terrain: tile.terrainOption.id,
        collides: tile.collides,
        depth: i
      });
    }
  }
  const devices = [];
  const deviceManager = api.stores.phaser.scene.worldManager.devices;
  for (const device of deviceManager.allDevices) {
    devices.push({
      x: device.x,
      y: device.y,
      depth: device.layers.depth,
      layerId: device.layers.layer,
      deviceId: device.deviceOption.id,
      id: device.id,
      options: device.options
    });
  }
  const wires = [];
  for (const wire of api.stores.world.wires.wires.values()) {
    wires.push({
      endConnection: wire.endConnection,
      endDevice: wire.endDevice,
      startConnection: wire.startConnection,
      startDevice: wire.startDevice
    });
  }
  const gridsStore = api.stores.world.devices.codeGrids;
  const codeGrids = {};
  for (const deviceId of gridsStore.keys()) {
    const items = gridsStore.get(deviceId)?.items;
    if (!items) continue;
    for (const gridId of items.keys()) {
      const grid = items.get(gridId);
      if (!grid) continue;
      codeGrids[deviceId] ??= {};
      codeGrids[deviceId][gridId] = {
        triggerType: grid.triggerType,
        triggerValue: grid.triggerValue,
        json: JSON.parse(grid.json)
      };
    }
  }
  return {
    terrain,
    devices,
    wires,
    codeGrids
  };
}

// plugins/CreativeTools/src/util.ts
function dataFromDevice(device) {
  return {
    x: device.x,
    y: device.y,
    depth: device.depth,
    layerId: device.layers.layer,
    deviceTypeId: device.deviceOption.id,
    id: device.id,
    options: JSON.stringify(prepareOptions(device.options))
  };
}
function dataFromDeviceInfo(device) {
  return {
    x: device.x,
    y: device.y,
    depth: device.depth,
    layerId: device.layerId,
    deviceTypeId: device.deviceOption.id,
    id: device.id,
    options: JSON.stringify(prepareOptions(device.options))
  };
}
function prepareOptions(options) {
  if (options.grantItemWhenDamaged || options.itemToGrant === void 0) return options;
  const { itemToGrant, ...rest } = options;
  return rest;
}

// plugins/CreativeTools/src/tools/import.ts
async function importWholeMap() {
  try {
    const data = await readJsonFile();
    api.UI.toast.promise(importWholeMapData(data), {
      loading: "Importing map data...",
      success: "Imported map data",
      error: "Something went wrong"
    });
  } catch {
  }
}
async function importWholeMapData(data) {
  for (const tile of data.terrain) {
    api.net.colyseus.send("PLACE_TERRAIN", tile);
  }
  for (const device of data.devices) {
    api.net.colyseus.send("PLACE_DEVICE", {
      x: device.x,
      y: device.y,
      id: device.id,
      deviceTypeId: device.deviceId,
      layerId: device.layerId,
      depth: device.depth,
      options: JSON.stringify(prepareOptions(device.options))
    });
  }
  for (const wire of data.wires) {
    api.net.colyseus.send("PLACE_WIRE", wire);
  }
  for (const deviceId in data.codeGrids) {
    for (const key in data.codeGrids[deviceId]) {
      const grid = data.codeGrids[deviceId][key];
      const json = JSON.stringify(grid.json);
      await createCodeGrid(deviceId, json, grid.triggerType, grid.triggerValue);
    }
  }
}
async function createCodeGrid(deviceId, json, triggerType, triggerValue) {
  api.net.colyseus.send("CREATE_CODE_GRID", {
    deviceId,
    triggerType,
    triggerValue
  });
  const gridId = await awaitGridCreation(deviceId);
  api.net.colyseus.send("JOIN_CODE_GRID", { deviceId, gridId });
  api.net.colyseus.send("SET_CODE_GRID_JSON", {
    json,
    deviceId,
    gridId
  });
  api.net.colyseus.send("LEAVE_CODE_GRID", { deviceId, gridId });
}
function awaitGridCreation(deviceId) {
  return new Promise((res) => {
    const existingDevice = api.net.colyseus.state.world.devices.codeGrids.get(deviceId);
    if (existingDevice) {
      const unsubGrids = existingDevice.items.onAdd((_, gridKey) => {
        unsubGrids();
        res(gridKey);
      }, false);
      return;
    }
    const unsubDevices = api.net.colyseus.state.world.devices.codeGrids.onAdd((device, deviceKey) => {
      if (deviceKey !== deviceId) return;
      unsubDevices();
      const unsubGrids = device.items.onAdd((_, gridKey) => {
        unsubGrids();
        res(gridKey);
      }, false);
    });
  });
}

// plugins/CreativeTools/src/tools/undo.ts
var maxUndoStackSize = 100;
var undoStack = [];
var redoStack = [];
var undoBatch = [];
var batchTimeoutStarted = false;
function addAction(type, data, mergeWithLast = false) {
  undoBatch.push({ type, data });
  redoStack.length = 0;
  if (batchTimeoutStarted) return;
  batchTimeoutStarted = true;
  setTimeout(() => {
    const lastBatch = undoStack[undoStack.length - 1];
    if (mergeWithLast && undoBatch.length === 1 && lastBatch?.length === 1 && undoBatch[0].type === lastBatch[0].type) {
      undoStack[undoStack.length - 1] = undoBatch;
    } else {
      undoStack.push(undoBatch);
    }
    undoBatch = [];
    batchTimeoutStarted = false;
    if (undoStack.length > maxUndoStackSize) undoStack.shift();
  }, 0);
}
function clearUndoStacks() {
  undoStack.length = 0;
  redoStack.length = 0;
}
api.net.onLoad(() => {
  const devices = api.stores.phaser.scene.worldManager.devices;
  const actionManager = api.stores.phaser.scene.actionManager;
  const layers = api.stores.phaser.scene.tileManager.layerManager.layers;
  let lastDestroyed;
  api.patcher.before(devices, "removeDeviceById", (_, [id]) => {
    const device = devices.getDeviceById(id);
    if (device) lastDestroyed = dataFromDevice(device);
  });
  api.net.colyseus.on("send:REMOVE_DEVICE", () => {
    addAction("REMOVE_DEVICE", lastDestroyed);
  });
  api.patcher.before(actionManager.removal, "removeSelectedItems", () => {
    if (api.stores.me.removing.deviceIdToRemove) return;
    const removeWire = api.stores.me.removing.wireIdToRemove;
    if (removeWire) {
      const wire = api.stores.world.wires.wires.get(removeWire);
      addAction("REMOVE_WIRE", {
        startDevice: wire.startDevice,
        startConnection: wire.startConnection,
        endDevice: wire.endDevice,
        endConnection: wire.endConnection
      });
      return;
    }
    for (const tile of api.stores.me.removing.tilesToRemove) {
      const layerTile = layers.get(`terrain-${tile.depth}`).tiles.get(`${tile.x}-${tile.y}`);
      if (!layerTile) continue;
      addAction("REMOVE_TERRAIN", {
        x: tile.x,
        y: tile.y,
        collides: layerTile.collides,
        depth: tile.depth,
        terrain: layerTile.terrainOption.id
      });
    }
  });
  api.net.colyseus.on("send:PLACE_TERRAIN", (terrain) => {
    addAction("PLACE_TERRAIN", terrain);
  });
  api.net.colyseus.on("send:PLACE_WIRE", (wire) => {
    addAction("PLACE_WIRE", wire, true);
  });
});
var onDeviceCreated = api.rewriter.createShared("onDeviceCreated", (info) => {
  if (!info.placedByClient || info.isPreview) return;
  const existing = api.stores.world.devices.devices.get(info.id);
  if (existing) {
    addAction("UPDATE_DEVICE", {
      from: dataFromDeviceInfo(existing),
      to: dataFromDeviceInfo(info)
    });
  } else {
    addAction("PLACE_DEVICE", dataFromDeviceInfo(info));
  }
});
api.rewriter.addParseHook("PlaceDevice-", (code) => {
  const index = code.indexOf(".callImmediately&&");
  if (index === -1) return code;
  const endIndex = code.indexOf("=>{", index);
  const startIndex = code.lastIndexOf("=", endIndex - 1) + 1;
  const argName = code.slice(startIndex, endIndex);
  const insertIndex = endIndex + 3;
  return code.slice(0, insertIndex) + `${onDeviceCreated}?.(${argName});` + code.slice(insertIndex);
});
function undo() {
  const actions = undoStack.pop();
  if (!actions) {
    api.UI.toast.error("Nothing to undo");
    return;
  }
  for (let i = actions.length - 1; i >= 0; i--) {
    const action = actions[i];
    if (action.type === "PLACE_DEVICE") {
      api.net.colyseus.sendDirect("REMOVE_DEVICE", { id: action.data.id });
    } else if (action.type === "UPDATE_DEVICE") {
      api.net.colyseus.sendDirect("PLACE_DEVICE", action.data.from);
    } else if (action.type === "REMOVE_DEVICE") {
      api.net.colyseus.sendDirect("PLACE_DEVICE", action.data);
    } else if (action.type === "PLACE_TERRAIN") {
      api.net.colyseus.sendDirect("REMOVE_TERRAIN", {
        x: action.data.x,
        y: action.data.y,
        depth: action.data.depth
      });
    } else if (action.type === "REMOVE_TERRAIN") {
      api.net.colyseus.sendDirect("PLACE_TERRAIN", action.data);
    } else if (action.type === "PLACE_WIRE") {
      api.net.colyseus.sendDirect("REMOVE_WIRE", {
        id: `${action.data.startDevice}-${action.data.endDevice}`
      });
    } else if (action.type === "REMOVE_WIRE") {
      api.net.colyseus.sendDirect("PLACE_WIRE", action.data);
    }
  }
  redoStack.push(actions);
  api.UI.toast.success(`Undid ${actions.length} action${actions.length > 1 ? "s" : ""}`);
}
function redo() {
  const actions = redoStack.pop();
  if (!actions) {
    api.UI.toast.error("Nothing to redo");
    return;
  }
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    if (action.type === "PLACE_DEVICE") {
      api.net.colyseus.sendDirect("PLACE_DEVICE", action.data);
    } else if (action.type === "UPDATE_DEVICE") {
      api.net.colyseus.sendDirect("PLACE_DEVICE", action.data.to);
    } else if (action.type === "REMOVE_DEVICE") {
      api.net.colyseus.sendDirect("REMOVE_DEVICE", { id: action.data.id });
    } else if (action.type === "PLACE_TERRAIN") {
      api.net.colyseus.sendDirect("PLACE_TERRAIN", action.data);
    } else if (action.type === "REMOVE_TERRAIN") {
      api.net.colyseus.sendDirect("REMOVE_TERRAIN", {
        x: action.data.x,
        y: action.data.y,
        depth: action.data.depth
      });
    } else if (action.type === "PLACE_WIRE") {
      api.net.colyseus.sendDirect("PLACE_WIRE", action.data);
    } else if (action.type === "REMOVE_WIRE") {
      api.net.colyseus.sendDirect("REMOVE_WIRE", {
        id: `${action.data.startDevice}-${action.data.endDevice}`
      });
    }
  }
  undoStack.push(actions);
  api.UI.toast.success(`Redid ${actions.length} action${actions.length > 1 ? "s" : ""}`);
}

// plugins/CreativeTools/src/tools/nuke.ts
async function nukeMap() {
  const warning = "Are you sure you want to remove everything from the map? This cannot be undone.";
  if (!await api.UI.confirm("Remove Everything Confirmation", warning)) return;
  removeTilesAndDevices();
  api.UI.toast.success("Removed everything from the map");
}
function removeTilesAndDevices() {
  const layerManager = api.stores.phaser.scene.tileManager.layerManager;
  clearUndoStacks();
  for (let i = 1; i <= 5; i++) {
    const layer = layerManager.layers.get(`terrain-${i}`);
    for (const tile of layer.tiles.values()) {
      api.net.colyseus.sendDirect("REMOVE_TERRAIN", {
        x: tile.x,
        y: tile.y,
        depth: i
      });
    }
  }
  const deviceManager = api.stores.phaser.scene.worldManager.devices;
  for (const device of deviceManager.allDevices) {
    if (device.deviceOption.id === "mapOptions") continue;
    api.net.colyseus.sendDirect("REMOVE_DEVICE", { id: device.id });
  }
  clearUndoStacks();
}

// plugins/CreativeTools/src/settings.ts
var settings = api.settings.create([
  {
    id: "copyWires",
    title: "Copy wires alongside devices",
    type: "toggle",
    default: true
  }
]);

// plugins/CreativeTools/src/tools/selection.ts
var selectedTileIds = /* @__PURE__ */ new Set();
var selectedTiles = [];
var currentlySelectedTiles = [];
var movingTiles = [];
var isMovingTiles = false;
var updateAction;
var multiselectMode = api.storage.getValue("multiselectMode", "all");
async function replaceSelection(ctx) {
  if (isMovingTiles) {
    api.UI.toast.error("Cannot replace selection while moving tiles");
    return;
  }
  if (selectedTiles.length === 0) {
    api.UI.toast.error("No tiles selected");
    return;
  }
  const terrainOptions = api.stores.worldOptions.terrainOptions;
  const terrainTypes = terrainOptions.map((t) => ({
    label: t.name,
    value: t.id
  }));
  const possibleTerrainTypes = terrainTypes.filter((t) => selectedTiles.some((tile) => tile.terrainOption.id === t.value));
  const fromId = await ctx.select({
    title: "Terrain type to replace",
    options: possibleTerrainTypes
  });
  const toId = await ctx.select({
    title: "Replace with",
    options: terrainTypes
  });
  const matchingTiles = selectedTiles.filter((tile) => tile.terrainOption.id === fromId);
  for (const tile of matchingTiles) {
    removeTile(tile);
    api.net.colyseus.send("PLACE_TERRAIN", {
      x: tile.realX,
      y: tile.realY,
      collides: tile.collides,
      depth: tile.depth,
      terrain: toId
    });
  }
  api.UI.toast.success(`Replaced ${matchingTiles.length} tile${matchingTiles.length === 1 ? "" : "s"}`);
}
api.net.onLoad(() => {
  const multiselect = api.stores.phaser.scene.actionManager.multiselect;
  const layerManager = api.stores.phaser.scene.tileManager.layerManager;
  const inputManager = api.stores.phaser.scene.inputManager;
  const terrainAdditionPreview = api.stores.phaser.scene.worldManager.terrain.terrainAdditionPreview;
  const devices = api.stores.phaser.scene.worldManager.devices;
  const addTile = (tile, depth) => {
    const id = `${depth}_${tile.x}_${tile.y}`;
    if (selectedTileIds.has(id)) return;
    selectedTileIds.add(id);
    selectedTiles.push({
      ...tile,
      realX: tile.x,
      realY: tile.y,
      x: tile.tilemapX,
      y: tile.tilemapY,
      width: 64,
      height: 64,
      depth
    });
  };
  api.patcher.before(multiselect, "findSelectedDevices", () => {
    currentlySelectedTiles.length = 0;
    if (!multiselect.modifierKeyDown) selectedTiles.length = 0;
    if (multiselectMode === "devices" || !multiselect.selection) return;
    for (let i = 1; i <= 5; i++) {
      const layer = layerManager.layers.get(`terrain-${i}`);
      for (const tile of layer.tiles.values()) {
        if (tile.tilemapX + 64 < multiselect.selection.x || tile.tilemapX > multiselect.selection.x + multiselect.selection.width || tile.tilemapY + 64 < multiselect.selection.y || tile.tilemapY > multiselect.selection.y + multiselect.selection.height) continue;
        currentlySelectedTiles.push({
          ...tile,
          realX: tile.x,
          realY: tile.y,
          x: tile.tilemapX,
          y: tile.tilemapY,
          width: 64,
          height: 64,
          depth: i
        });
      }
    }
  });
  api.patcher.before(multiselect, "unselectAll", clearTerrainSelection);
  api.patcher.after(multiselect, "endSelectionRect", () => {
    if (multiselectMode === "devices") return;
    selectedTiles.push(...currentlySelectedTiles);
    for (const tile of currentlySelectedTiles) {
      selectedTileIds.add(`${tile.depth}_${tile.realX}_${tile.realY}`);
    }
    currentlySelectedTiles.length = 0;
    api.stores.me.editing.device.usingMultiselect ||= selectedTiles.length > 0;
  });
  api.patcher.before(multiselect, "hideSelection", () => {
    currentlySelectedTiles.length = 0;
  });
  api.patcher.before(multiselect, "updateSelectedDevicesOverlay", () => {
    if (multiselectMode === "devices") return;
    if (multiselect.selectedDevices.length + multiselect.currentlySelectedDevices.length + selectedTiles.length + currentlySelectedTiles.length > 0) {
      const deviceBoxes = multiselect.selectedDevices.map((o) => o.boundingBox.getBoundingBox());
      const currentDeviceBoxes = multiselect.currentlySelectedDevices.map((o) => o.boundingBox.getBoundingBox());
      multiselect.selectedDevicesOverlay.show([...deviceBoxes, ...currentDeviceBoxes, ...selectedTiles, ...currentlySelectedTiles]);
    } else if (!multiselect.modifierKeyDown || multiselect.selectedDevicesOverlay.showing) {
      multiselect.selectedDevicesOverlay.hide();
    }
    return true;
  });
  api.onStop(
    inputManager.mouse.addClickListener({
      callback: (e) => {
        if (!multiselect.modifierKeyDown || multiselectMode === "devices") return;
        const tileX = e.worldX >> 6;
        const tileY = e.worldY >> 6;
        for (let i = 1; i <= 5; i++) {
          const layer = layerManager.layers.get(`terrain-${i}`);
          const tile = layer.tiles.get(`${tileX}_${tileY}`);
          if (!tile) continue;
          const id = `${i}_${tileX}_${tileY}`;
          if (selectedTileIds.has(id)) {
            const index = selectedTiles.findIndex((t) => t.realX === tileX && t.realY === tileY && t.depth === i);
            if (index !== -1) {
              selectedTiles.splice(index, 1);
              selectedTileIds.delete(id);
            }
          } else {
            addTile(tile, i);
          }
          multiselect.updateSelectedDevicesOverlay();
          break;
        }
      }
    })
  );
  api.patcher.after(terrainAdditionPreview, "update", () => {
    if (multiselectMode === "devices" || !multiselect.mouseStartPos) return;
    const offsetX = inputManager.mouse.worldX - multiselect.mouseStartPos.x >> 6;
    const offsetY = inputManager.mouse.worldY - multiselect.mouseStartPos.y >> 6;
    for (const tile of movingTiles) {
      terrainAdditionPreview.createPreviewTile({
        x: tile.realX + offsetX,
        y: tile.realY + offsetY,
        depth: 999,
        tileIndex: 0,
        terrainOption: tile.terrainOption
      });
    }
  });
  const startAction = (action) => {
    if (multiselectMode === "devices") return;
    const hoveringDevice = devices.findDeviceUnderMouse();
    if (hoveringDevice) return;
    const tileX = inputManager.mouse.worldX >> 6;
    const tileY = inputManager.mouse.worldY >> 6;
    if (!selectedTiles.some((tile) => tile.realX === tileX && tile.realY === tileY)) return;
    multiselect.setShiftParams();
    startTerrainAction(action);
    multiselect.boundingBoxAroundEverything ??= {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
    api.stores.me.adding.devices.existingDevice = {
      use: true,
      id: multiselect.selectedDevices[0]?.id ?? "",
      action
    };
    api.stores.me.adding.mode = "device";
    updateAction("adding");
  };
  api.hotkeys.addHotkey({
    key: "KeyM",
    preventDefault: false
  }, () => startAction("cut"));
  api.hotkeys.addHotkey({
    key: "KeyC",
    preventDefault: false
  }, () => startAction("copy"));
});
function clearTerrainSelection() {
  selectedTiles.length = 0;
  currentlySelectedTiles.length = 0;
  selectedTileIds.clear();
}
function startTerrainAction(action) {
  movingTiles = [...selectedTiles, ...currentlySelectedTiles];
  isMovingTiles = movingTiles.length > 0;
  api.stores.phaser.scene.actionManager.multiselect.updateSelectedDevicesOverlay();
  if (action !== "cut") return;
  for (const tile of movingTiles) {
    const layer = api.stores.phaser.scene.tileManager.layerManager.layers.get(`terrain-${tile.depth}`);
    const layerTile = layer.tiles.get(`${tile.realX}_${tile.realY}`);
    layerTile.alphaTopLeft = 0;
    layerTile.alphaTopRight = 0;
    layerTile.alphaBottomLeft = 0;
    layerTile.alphaBottomRight = 0;
  }
}
var roundDeviceMovement = api.rewriter.createShared("roundDeviceMovement", (device, type, pos) => {
  if (!isMovingTiles) return pos;
  const startPos = device[type];
  const offset = pos - startPos;
  const roundedOffset = Math.floor(offset / 64) * 64;
  return startPos + roundedOffset;
});
api.rewriter.addParseHook("App-", (code) => {
  const firstIndex = code.indexOf(".LockVertical()");
  if (firstIndex === -1) return code;
  code = wrapCoords(code, firstIndex);
  const secondIndex = code.indexOf(".LockVertical()", firstIndex + 1);
  if (secondIndex === -1) return code;
  return wrapCoords(code, secondIndex);
});
function wrapCoords(code, index) {
  const varStart = code.indexOf("forEach((", index) + 9;
  const varEnd = code.indexOf(",", varStart);
  const varName = code.slice(varStart, varEnd);
  const start1 = code.indexOf(":", code.indexOf(".x", index)) + 1;
  const end1 = code.indexOf(",", start1);
  const index2 = code.indexOf(":", end1) + 1;
  const end2 = code.indexOf(";", index2);
  const safeRound = `(${roundDeviceMovement}??((_,__,x)=>x))`;
  return code.slice(0, start1) + `${safeRound}(${varName},"x",` + code.slice(start1, end1) + ")" + code.slice(end1, index2) + `${safeRound}(${varName},"y",` + code.slice(index2, end2) + ")" + code.slice(end2);
}
var onActionStart = api.rewriter.createShared("onActionStart", startTerrainAction);
var onPlace = api.rewriter.createShared("onPlace", () => {
  if (multiselectMode === "devices" || !api.stores.me.editing.device.usingMultiselect) return;
  const multiselect = api.stores.phaser.scene.actionManager.multiselect;
  const inputManager = api.stores.phaser.scene.inputManager;
  if (api.stores.me.adding.devices.existingDevice.action === "cut") {
    for (const tile of movingTiles) {
      removeTile(tile);
    }
  } else if (settings.copyWires && multiselect.movedOrCopiedDevices.length > 1) {
    const movingDeviceIds = /* @__PURE__ */ new Map();
    let idIndex = 0;
    const onPlace2 = (data) => {
      movingDeviceIds.set(multiselect.movedOrCopiedDevices[idIndex].id, data.id);
      idIndex++;
      if (idIndex < multiselect.movedOrCopiedDevices.length) return;
      api.patcher.after(inputManager.keyboard, "isKeyDown", () => {
        for (const wire of api.stores.world.wires.wires.values()) {
          const start = movingDeviceIds.get(wire.startDevice);
          const end = movingDeviceIds.get(wire.endDevice);
          if (!start || !end) continue;
          api.net.colyseus.send("PLACE_WIRE", {
            startDevice: start,
            endDevice: end,
            startConnection: wire.startConnection,
            endConnection: wire.endConnection
          });
        }
      }, { once: true });
      api.net.colyseus.off("send:PLACE_DEVICE", onPlace2);
    };
    api.net.colyseus.on("send:PLACE_DEVICE", onPlace2);
  }
  if (multiselect.mouseStartPos) {
    for (const tile of movingTiles) {
      const offsetX = inputManager.mouse.worldX - multiselect.mouseStartPos.x >> 6;
      const offsetY = inputManager.mouse.worldY - multiselect.mouseStartPos.y >> 6;
      const newX = tile.realX + offsetX;
      const newY = tile.realY + offsetY;
      api.net.colyseus.send("PLACE_TERRAIN", {
        x: newX,
        y: newY,
        collides: tile.collides,
        depth: tile.depth,
        terrain: tile.terrainOption.id
      });
    }
  }
  if (inputManager.keyboard.isKeyDown(16)) return;
  setTimeout(() => isMovingTiles = false, 0);
  movingTiles.length = 0;
  if (multiselect.movedOrCopiedDevices.length === 0) {
    api.stores.me.editing.device.usingMultiselect = false;
    api.stores.gui.none.screen = "home";
    updateAction("none");
  }
});
var onDeleteSelection = api.rewriter.createShared("onDeleteSelection", () => {
  for (const tile of selectedTiles) {
    removeTile(tile);
  }
  clearTerrainSelection();
});
api.rewriter.addParseHook("Device-", (code) => {
  const index = code.indexOf("setShiftParams(),");
  if (index === -1) return code;
  const insertIndex = index + 17;
  const endIndex = code.indexOf("},", index);
  const startIndex = code.lastIndexOf(":", endIndex) + 1;
  const varName = code.slice(startIndex, endIndex);
  return code.slice(0, insertIndex) + `${onActionStart}?.(${varName}),` + code.slice(insertIndex);
});
api.rewriter.addParseHook("App", (code) => {
  const index = code.indexOf("()}).canCopy");
  if (index === -1) return code;
  const insertIndex = code.lastIndexOf("isListeningForInput)return;", index) + 27;
  return code.slice(0, insertIndex) + `${onPlace}?.();` + code.slice(insertIndex);
});
api.rewriter.addParseHook("App", (code) => {
  const index = code.indexOf("Are you sure you want to delete your selection?");
  if (index === -1) return code;
  const insertIndex = code.indexOf("onOk:()=>{", index) + 10;
  return code.slice(0, insertIndex) + `${onDeleteSelection}?.();` + code.slice(insertIndex);
});
var onCancel = api.rewriter.createShared("onCancel", () => {
  for (const tile of movingTiles) {
    const layer = api.stores.phaser.scene.tileManager.layerManager.layers.get(`terrain-${tile.depth}`);
    const layerTile = layer.tiles.get(`${tile.realX}_${tile.realY}`);
    layerTile.alphaTopLeft = 1;
    layerTile.alphaTopRight = 1;
    layerTile.alphaBottomLeft = 1;
    layerTile.alphaBottomRight = 1;
  }
  isMovingTiles = false;
  movingTiles.length = 0;
});
api.rewriter.addParseHook("App", (code) => {
  const index = code.indexOf("fireImmediately:!0}),[]),");
  if (index === -1) return code;
  const insertIndex = code.indexOf(".none),", index) + 7;
  return code.slice(0, insertIndex) + `${onCancel}?.();` + code.slice(insertIndex);
});
api.rewriter.exposeVar("setCurrentAction-", {
  find: /\.actionManager\.multiselect,(\w{1,3})=/,
  callback: (setAction) => updateAction = setAction
});
api.rewriter.swapVar("App-", {
  check: "`Cannot add additional ${",
  find: /\.maxUsedMemory}`:``},(\w{1,3})=\(\)=>/,
  callback: (getActionInfo) => {
    return function() {
      const actionInfo = getActionInfo();
      if (!isMovingTiles) return actionInfo;
      const multiselect = api.stores.phaser.scene.actionManager.multiselect;
      const movingDevices = multiselect.movedOrCopiedDevices.some((d) => d.deviceOption.id !== "prop");
      const movingProps = multiselect.movedOrCopiedDevices.some((d) => d.deviceOption.id === "prop");
      if (movingDevices && movingProps) {
        actionInfo.title = "Multiple devices/props/tiles";
      } else if (movingDevices) {
        actionInfo.title = "Multiple devices/tiles";
      } else if (movingProps) {
        actionInfo.title = "Multiple props/tiles";
      } else if (movingTiles.length > 1) {
        actionInfo.title = "Multiple tiles";
      } else {
        actionInfo.title = "A tile";
      }
      return actionInfo;
    };
  }
});
var multiselectModes = [
  { value: "all", children: "Devices/Props and Tiles" },
  { value: "devices", children: "Devices/Props only" }
  // { value: "tiles", children: "Tiles only" } TODO
];
api.rewriter.exposeVar("App-", {
  check: "Are other players allowed to remove things",
  find: /radius: 6px;\n`,(\w{1,3})=/,
  callback: (editingOptions) => {
    api.patcher.afterReact(editingOptions.type, (_, __, returnVal) => {
      const [mode, setMode] = api.React.useState(multiselectMode);
      const settings2 = returnVal.props.children.props.children.props.children;
      const newSetting = api.React.cloneElement(settings2[2]);
      newSetting.props.description = "Configure what multiselect applies to (added by CreativeTools)";
      newSetting.props.name = "Multiselect Mode";
      const newChildren = api.React.cloneElement(newSetting.props.children);
      const optionType = newChildren.props.children[0];
      const options = [];
      for (const mode2 of multiselectModes) {
        const element = api.React.cloneElement(optionType, mode2);
        element.key = mode2.value;
        options.push(element);
      }
      newChildren.props.children = options;
      newChildren.props.value = mode;
      newChildren.props.onChange = (value) => {
        multiselectMode = value;
        setMode(value);
        api.logger.log("Multiselect mode changed to", value);
      };
      newSetting.props.children = newChildren;
      settings2.unshift(newSetting);
    });
  }
});
function removeTile(tile) {
  api.net.colyseus.send("REMOVE_TERRAIN", {
    x: tile.realX,
    y: tile.realY,
    depth: tile.depth
  });
  addAction("REMOVE_TERRAIN", {
    x: tile.realX,
    y: tile.realY,
    collides: tile.collides,
    depth: tile.depth,
    terrain: tile.terrainOption.id
  });
}

// plugins/CreativeTools/src/tools/eraserSize.ts
api.rewriter.addParseHook("App", (code) => {
  const index = code.indexOf("Eraser Size:");
  if (index === -1) return code;
  return code.replace("Array.from([,,,]", "Array.from([,,,,,,]");
});

// plugins/CreativeTools/src/tools/renameBlocks.ts
api.rewriter.exposeVar("App-BZH0", {
  find: /ht/,
  callback: (display) => {
    api.UI.forceReactUpdate();
    api.patcher.afterReact(display.type, (_, args, returnVal) => {
      const gridIds = Array.from(args[0].codeGrids.keys());
      const deviceId = args[0].deviceId;
      const blocks = returnVal.props.children[1].props.children;
      for (let i = 0; i < blocks.length; i++) {
        const grid = api.stores.world.devices.codeGrids.get(deviceId)?.items.get(gridIds[i]);
        if (!grid || !grid.triggerValue) continue;
        const items = blocks[i].props.children.props.children.props.menu.items;
        items.push({
          key: "edit-grid",
          icon: "\u270F\uFE0F",
          label: "Edit block",
          onClick: (e) => {
            e.domEvent.stopPropagation();
            renameBlock(deviceId, gridIds[i], grid);
          }
        });
      }
    });
  }
});
async function renameBlock(deviceId, gridId, grid) {
  const newValue = await api.UI.prompt("Edit block channel", {
    text: "Enter a new channel for this block",
    defaultVal: grid.triggerValue
  });
  if (!newValue) return;
  const triggerType = grid.triggerType;
  api.net.colyseus.send("DELETE_CODE_GRID", { deviceId, gridId });
  await createCodeGrid(deviceId, grid.json, triggerType, newValue);
}

// plugins/CreativeTools/src/index.ts
var isNotInGame = () => api.net.type !== "Colyseus";
api.commands.addCommand({
  text: "CreativeTools: Export World",
  hidden: isNotInGame
}, exportWholeMap);
api.commands.addCommand({
  text: "CreativeTools: Import World",
  hidden: isNotInGame
}, importWholeMap);
api.commands.addCommand({
  text: "CreativeTools: Remove Everything From Map",
  hidden: isNotInGame
}, nukeMap);
api.commands.addCommand({
  text: "CreativeTools: Find/Replace Selected Terrain",
  hidden: isNotInGame
}, replaceSelection);
api.net.onLoad(() => {
  api.hotkeys.addHotkey({
    ctrl: true,
    shift: false,
    key: "KeyZ",
    stopPropagation: true
  }, undo);
  api.hotkeys.addHotkey({
    ctrl: true,
    shift: true,
    key: "KeyZ",
    stopPropagation: true
  }, redo);
  api.hotkeys.addHotkey({
    ctrl: true,
    key: "KeyY",
    stopPropagation: true
  }, redo);
});
