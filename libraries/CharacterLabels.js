/**
 * @name CharacterLabels
 * @description Allows easily making labels that follow players in 2d gamemodes
 * @author Gimloader Official
 * @version 0.1.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/libraries/CharacterLabels.js
 * @webpage https://gimloader.github.io/libraries/CharacterLabels
 * @gamemode 2d
 * @isLibrary true
 * @signature Oxwb5Yt2vkbAFpBb23RbdxBvWWyp2A2FR38ACukWKyv8noO9MyXLzlBxjrSSgzyQQnDacA96xjL4L5Ge9F5mDA==
 */

// libraries/CharacterLabels/src/index.ts
var labelCreators = [];
var characterLabels = /* @__PURE__ */ new Map();
var padding = 10;
function addLabel(setupLabel) {
  const creator = { setupLabel, destroyers: /* @__PURE__ */ new Map() };
  labelCreators.push(creator);
  for (const [character, labelInstances] of characterLabels) {
    const onStop = setupForCharacter(character, setupLabel, labelInstances);
    if (onStop) creator.destroyers.set(character, onStop);
  }
  return () => {
    for (const destroy of creator.destroyers.values()) destroy();
    const index = labelCreators.indexOf(creator);
    if (index === -1) return;
    labelCreators.splice(index, 1);
  };
}
function setupForCharacter(character, setupLabel, instances) {
  const label = setupLabel(character);
  if (!label) return;
  instances.push(label);
  return () => {
    for (const object of label.gameObjects) object.destroy();
    const index = instances.indexOf(label);
    if (index === -1) return;
    instances.splice(index, 1);
  };
}
function getMaxHeight(objects) {
  let labelHeight = 0;
  for (const object of objects) {
    if ("visible" in object && !object.visible || !("height" in object)) continue;
    if (object.height > labelHeight) labelHeight = object.height;
  }
  return labelHeight;
}
function patchCharacter(character) {
  if (!characterLabels.has(character)) characterLabels.set(character, []);
  const labels = characterLabels.get(character);
  for (const creator of labelCreators) {
    const onStop = setupForCharacter(character, creator.setupLabel, labels);
    if (onStop) creator.destroyers.set(character, onStop);
  }
  const unpatchUpdate = api.patcher.after(character.nametag, "update", () => {
    if (!character.nametag.tag) return;
    const { x, y, depth } = character.nametag.tag;
    const stateChar = api.net.colyseus.state.characters.get(character.id);
    let offset = 22;
    if (character.nametag.fragilityTag) offset += 15;
    for (const label of labels) {
      for (const object of label.gameObjects) {
        object.visible = true;
        object.x = x;
        object.y = y + offset;
        object.setDepth(depth);
      }
      label.update?.();
      if (stateChar?.isRespawning || stateChar?.teamId === "__SPECTATORS_TEAM") {
        for (const object of label.gameObjects) {
          object.visible = false;
        }
      }
      offset += getMaxHeight(label.gameObjects) + padding;
    }
  });
  const unpatchDestroy = api.patcher.after(character.nametag, "destroy", () => {
    for (const creator of labelCreators) {
      creator.destroyers.get(character)?.();
      creator.destroyers.delete(character);
    }
    unpatchUpdate();
    unpatchDestroy();
  });
}
api.net.onLoad(() => {
  const characterManager = api.stores.phaser.scene.characterManager;
  api.patcher.after(characterManager, "addCharacter", (_, __, character) => {
    patchCharacter(character);
  });
  for (const character of characterManager.characters.values()) {
    patchCharacter(character);
  }
});
export {
  addLabel as default
};
