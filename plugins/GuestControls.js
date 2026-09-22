/**
 * @name GuestControls
 * @description Allows guests to perform host actions in 2d modes, when the host has this plugin on
 * @author Gimloader Official
 * @version 0.2.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/GuestControls.js
 * @webpage https://gimloader.github.io/plugins/GuestControls
 * @needsLib Communication | https://raw.githubusercontent.com/Gimloader/builds/main/libraries/Communication.js
 * @gamemode 2d
 * @changelog Allowed guests to start the game
 * @signature e0b/EbOfJysJaGU+SpqRoL03SWELaSKp7Q/Y0uUMkAITxJNnNoMfoycy7pcHYWJZr2FrOjavOnS7KFobuRH3AQ==
 */

// plugins/GuestControls/src/index.ts
var settings = api.settings.create([
  {
    id: "notification",
    type: "toggle",
    title: "Control Notifications",
    description: "Notify when a guest performs a control",
    default: true
  }
]);
api.net.onLoad(() => {
  const Comms = api.lib("Communication");
  const comms = new Comms("GuestControls");
  const characters = () => [...api.stores.characters.characters.values()];
  comms.onMessage((message, char) => {
    if (!settings.notification || message === 1 /* PluginOff */ || message === 0 /* PluginOn */) return;
    if (Array.isArray(message)) {
      api.UI.notification.info({ message: `${char.name} started the game` });
      return;
    }
    switch (message) {
      case 3 /* EndGame */:
        api.UI.notification.info({ message: `${char.name} ended the game` });
        break;
      case 4 /* ResetToLobby */:
        api.UI.notification.info({ message: `${char.name} reset back to lobby` });
        break;
      case 5 /* AddGameTime */:
        api.UI.notification.info({ message: `${char.name} added game time` });
        break;
      default: {
        const character = characters()[message - 10];
        if (!character) return;
        api.UI.notification.info({ message: `${char.name} kicked ${character.name}` });
      }
    }
  });
  if (api.net.isHost) {
    comms.onEnabledChanged(() => {
      if (!Comms.enabled) return;
      comms.send(0 /* PluginOn */);
    });
    api.onStop(() => {
      if (!Comms.enabled) return;
      comms.send(1 /* PluginOff */);
      comms.destroy();
    });
    comms.onMessage((message) => {
      if (Array.isArray(message)) {
        const customTeams = {};
        if (message.length > 0) {
          for (let i = 0; i < message.length; i += 2) {
            const [index, team] = message.slice(i, i + 2);
            const id = characters()[index]?.id;
            if (!id) return;
            customTeams[id] = team.toString();
          }
        }
        api.net.colyseus.send("START_GAME", {
          customTeams,
          modeType: api.stores.me.preferences.startGameWithMode,
          ownerAsSpectator: api.stores.session.ownerRole === "spectator"
        });
        return;
      }
      switch (message) {
        case 2 /* GuestJoined */:
          if (Comms.enabled) comms.send(0 /* PluginOn */);
          break;
        case 3 /* EndGame */:
          api.net.colyseus.send("END_GAME");
          break;
        case 4 /* ResetToLobby */:
          api.net.colyseus.send("RESTORE_MAP_EARLIER");
          break;
        case 5 /* AddGameTime */:
          api.net.colyseus.send("ADD_GAME_TIME");
          break;
        default: {
          const character = characters()[message - 10];
          if (!character) return;
          api.net.colyseus.send("KICK_PLAYER", {
            characterId: character.id
          });
        }
      }
    });
  } else {
    const { session } = api.stores;
    if (Comms.enabled) comms.send(2 /* GuestJoined */);
    comms.onMessage((message) => {
      if (message === 0 /* PluginOn */) {
        session.amIGameOwner = true;
      } else if (message === 1 /* PluginOff */) {
        session.amIGameOwner = false;
      }
    });
    api.onStop(() => {
      session.amIGameOwner = false;
      comms.destroy();
    });
    api.net.colyseus.on("send:START_GAME", (data, editFn) => {
      const teams = [];
      for (const [playerId, team] of Object.entries(data.customTeams)) {
        const index = characters().findIndex((char) => char.id === playerId);
        teams.push(index, Number(team));
      }
      comms.send(teams);
      editFn(null);
    });
    api.net.colyseus.on("send:END_GAME", (_, editFn) => {
      comms.send(3 /* EndGame */);
      editFn(null);
    });
    api.net.colyseus.on("send:RESTORE_MAP_EARLIER", (_, editFn) => {
      comms.send(4 /* ResetToLobby */);
      editFn(null);
    });
    api.net.colyseus.on("send:ADD_GAME_TIME", (_, editFn) => {
      comms.send(5 /* AddGameTime */);
      editFn(null);
    });
    api.net.colyseus.on("send:KICK_PLAYER", ({ characterId }, editFn) => {
      const index = characters().findIndex((char) => char.id === characterId) + 10;
      comms.send(index);
      editFn(null);
    });
  }
});
