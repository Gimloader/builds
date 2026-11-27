/**
 * @name Teleport
 * @description Ctrl+Click to teleport anywhere and adds a command to teleport to a player client-side
 * @author Gimloader Official
 * @version 1.0.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/Teleport.js
 * @webpage https://gimloader.github.io/plugins/Teleport
 * @needsPlugin Desynchronize | https://raw.githubusercontent.com/Gimloader/builds/main/plugins/Desynchronize.js
 * @gamemode 2d
 * @signature VDeCbvizAJI9YUsla2W7H2aEQ6z8bFlG6p/rUOwowN2O/6z0S5RNtqAJbraNgZ+Tba8aIKIkwoQh1YUIQ8r2Bw==
 */

// plugins/Teleport/src/index.ts
api.net.onLoad(() => {
  const rb = api.stores.phaser.mainCharacter.physics.getBody().rigidBody;
  const onClick = (e) => {
    if (!e.ctrlKey) return;
    const pos = api.stores.phaser.scene.inputManager.getMouseWorldXY();
    rb.setTranslation({ x: pos.x / 100, y: pos.y / 100 }, true);
  };
  window.addEventListener("click", onClick);
  api.onStop(() => window.removeEventListener("click", onClick));
  const otherPlayers = () => [...api.stores.characters.characters.values()].filter((char) => char.type === "player" && char.id !== api.stores.network.authId);
  api.commands.addCommand({
    text: "Teleport: Teleport to Player",
    hidden: () => otherPlayers().length === 0
  }, async (context) => {
    const player = await context.select({
      title: "Player",
      options: otherPlayers().map((player2) => ({
        label: player2.name,
        value: player2.id
      }))
    });
    const pos = api.stores.phaser.scene.characterManager.characters.get(player)?.body;
    if (!pos) return;
    rb.setTranslation({ x: pos.x / 100, y: pos.y / 100 }, true);
  });
});
