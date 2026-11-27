/**
 * @name ToggleTerrainType
 * @description Quickly toggle whether you are placing terrain as walls or as floor. Allows you to place tiles as floors in platformer mode.
 * @author Gimloader Official
 * @version 0.2.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/ToggleTerrainType.js
 * @webpage https://gimloader.github.io/plugins/ToggleTerrainType
 * @signature RWEio0MFIv8f4H+v7CvJ/bvbqeHv48BtEZApvMr3ypiLqMVsBg3gjbPl+TI9FWSpO6afEUTaba2qIvC8UfsuDw==
 */

// plugins/ToggleTerrainType/src/index.ts
function toggle() {
  const terrain = api.stores?.me?.adding?.terrain;
  if (!terrain) return;
  terrain.buildTerrainAsWall = !terrain.buildTerrainAsWall;
  api.UI.notification.open({
    message: `Placing terrain as a ${terrain.buildTerrainAsWall ? "wall" : "floor"}`
  });
}
api.hotkeys.addConfigurableHotkey({
  category: "ToggleTerrainType",
  title: "Switch between placing walls/floors",
  default: {
    key: "KeyT",
    alt: true
  }
}, toggle);
api.net.onLoad(() => {
  api.commands.addCommand({ text: "Toggle Terrain Type" }, toggle);
});
