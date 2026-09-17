/**
 * @name Healthbars
 * @description Adds healthbars underneath players' names
 * @author Gimloader Official
 * @version 1.0.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/Healthbars.js
 * @webpage https://gimloader.github.io/plugins/Healthbars
 * @needsLib CharacterLabels | https://raw.githubusercontent.com/Gimloader/builds/main/libraries/CharacterLabels.js
 * @gamemode 2d
 * @changelog Bump version to force update
 * @signature MilmPXBawfOyIr59tft/NO+V/5hwkki0faref5MnhOEJZ+I6XwlCkkxzk2/A06LBFkXysZHvrIGaUkfh1dppCQ==
 */

// plugins/Healthbars/src/index.ts
api.net.onLoad(() => {
  const options = JSON.parse(api.stores.world.mapOptionsJSON);
  let visible = options.showHealthAndShield && options.healthMode === "healthAndShield";
  api.onStop(api.net.colyseus.state.listen("mapSettings", (settingsJson) => {
    const options2 = JSON.parse(settingsJson);
    visible = options2.showHealthAndShield && options2.healthMode === "healthAndShield";
  }, false));
  const { scene } = api.stores.phaser;
  const width = 130;
  const blue = 6853868;
  const red = 16711680;
  const gray = 5592405;
  const addLabel = api.lib("CharacterLabels");
  const destroy = addLabel((character) => {
    const stateChar = api.net.colyseus.state.characters.get(character.id);
    if (!stateChar) return;
    const bg = scene.add.rectangle(0, 0, width, 10, gray);
    const health = scene.add.rectangle(0, 0, width, 10, red);
    const shield = scene.add.rectangle(0, 0, width, 10, blue);
    shield.setStrokeStyle(2, 16777215);
    return {
      gameObjects: [bg, health, shield],
      update() {
        const hp = stateChar.health;
        health.width = hp.health / hp.maxHealth * width;
        shield.width = hp.shield / hp.maxShield * width;
        bg.visible = health.visible = shield.visible = visible;
      }
    };
  });
  api.onStop(destroy);
});
