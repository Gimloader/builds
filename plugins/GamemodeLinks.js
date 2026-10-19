/**
 * @name GamemodeLinks
 * @description Creates game rooms from links, particularly useful in bookmarks.
 * @author Gimloader Official
 * @version 0.4.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/GamemodeLinks.js
 * @webpage https://gimloader.github.io/plugins/GamemodeLinks
 * @hasSettings true
 * @changelog Removed requirement to reload the page
 * @signature 6EfbCguI7VrK22h38DROmB8gA+yoLEigOLhEQ7CGFXnSgYE6021tOPuBgEU80Y3dBa6/JDw8gjXPAPbBnq2EBg==
 */

// plugins/GamemodeLinks/src/makeGame.ts
var matchmakerOptions = {
  group: "",
  joinInLate: true
};
async function makeGame(id2, entries) {
  if (!id2) throw new Error("Gamemode ID is missing");
  const hooksRes = await fetch("/api/experience/map/hooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ experience: id2 })
  });
  const hooksJson = await hooksRes.json();
  if (hooksJson.name === "CastError") throw new Error("Invalid gamemode");
  if (hooksJson.message?.text) {
    const gameRes = await fetch("/api/matchmaker/intent/map/edit/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mapId: id2 })
    });
    if (gameRes.status === 500) throw new Error("This map doesn't exist.");
    return await gameRes.text();
  }
  const { hooks: hooks2 } = hooksJson;
  const defaultHooks = {};
  for (const hook of hooks2) {
    if (hook.type === "selectBox") {
      defaultHooks[hook.key] = hook.options.defaultOption;
    } else if (hook.type === "number") {
      defaultHooks[hook.key] = hook.options.defaultValue;
    }
  }
  const savedHooksString = localStorage.getItem("gimkit-hook-saved-options");
  const savedHooks = savedHooksString ? JSON.parse(savedHooksString) : {};
  const urlHooks = {};
  for (const [key, value] of entries) {
    if (key === "joinInLate" || key === "useRandomNamePicker") {
      matchmakerOptions[key] = value !== "0" && value.toLowerCase() !== "false" && value.toLowerCase() !== "no";
    }
    const hook = hooks2.find((hook2) => hook2.key === key);
    if (!hook) continue;
    if (hook.type === "selectBox") {
      if (!hook.options.options.includes(value)) {
        throw new Error(`"${value}" is not an option of ${hook.key}. The available options are: ${hook.options.options.join(", ")}.`);
      }
      urlHooks[key] = value;
    } else if (hook.type === "number") {
      const numberHook = Number(value);
      if (Number.isNaN(numberHook)) throw new Error(`${key} requires a number`);
      urlHooks[key] = numberHook;
    }
  }
  const body = {
    experienceId: id2,
    matchmakerOptions,
    options: {
      allowGoogleTranslate: false,
      cosmosBlocked: false,
      hookOptions: {
        ...defaultHooks,
        ...savedHooks[id2],
        ...urlHooks
      }
    }
  };
  const kitHook = hooks2.find((hook) => hook.type === "kit");
  if (kitHook) {
    if (!api.settings.kit) {
      const meRes = await fetch("/api/games/summary/me");
      const { games } = await meRes.json();
      if (!games.length) throw new Error("You don't have any kits");
      api.settings.kit = games[0]._id;
    }
    body.options.hookOptions[kitHook.key] = api.settings.kit;
  }
  const creationRes = await fetch("/api/matchmaker/intent/map/play/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (creationRes.status === 500) throw new Error("This map doesn't exist, or you had invalid search parameters");
  return await creationRes.text();
}

// plugins/GamemodeLinks/src/index.ts
var setLink = (path) => {
  const href = new URL(path, location.href).href;
  if (location.href === href) return;
  history.pushState({}, "", href);
};
var experienceId = "";
var hooks = {};
var selectOpen = false;
var gamemodeTitle = "";
var pathname = location.pathname;
var title = document.title;
function updatePage() {
  if (api.settings.updateLink) {
    if (!selectOpen || !experienceId) {
      setLink(pathname);
    } else {
      const newSearch = new URLSearchParams(hooks);
      setLink(`/gamemode/${experienceId}?${newSearch.toString()}`);
    }
  }
  if (api.settings.updateTitle) {
    if (!selectOpen || !gamemodeTitle) {
      document.title = title;
    } else {
      document.title = gamemodeTitle;
    }
  }
}
api.onStop(() => {
  setLink(pathname);
  document.title = title;
});
api.rewriter.swapVar("App-", {
  check: "`EXPERIENCE_HOOKS`",
  find: /}\):null]}\)},(\w{1,3})=.=>{let{options/,
  callback: (updateHooks, initial) => {
    if (!initial) api.UI.forceReactUpdate();
    return function(props) {
      const options = { ...props.options };
      const kitKey = Object.keys(options).find((hook) => hook.toLowerCase().includes("kit"));
      if (kitKey) delete options[kitKey];
      experienceId = props.experienceId;
      hooks = options;
      updatePage();
      return updateHooks.apply(this, arguments);
    };
  }
});
api.rewriter.exposeVar("App-", {
  check: "`EXPERIENCE_GROUP_CACHE`",
  find: /EXPERIENCE_GROUP_CACHE`,(\w{1,3})=/,
  callback: (modal) => {
    api.patcher.afterReact(modal, (_, props, returnVal) => {
      pathname = location.pathname;
      title = document.title;
      const close = props[0].close;
      props[0].close = () => {
        close();
        selectOpen = false;
        experienceId = "";
        gamemodeTitle = "";
        updatePage();
      };
      selectOpen = returnVal.props.children.props.children.props.children[1].props.game !== void 0;
      updatePage();
    });
  }
});
api.rewriter.exposeVar("App-", {
  check: "(min-height: 650px)",
  find: /image:`gamepad`}},(\w{1,3})=/,
  callback: (titleComponent) => {
    api.patcher.beforeReact(titleComponent, (_, props) => {
      gamemodeTitle = props[0].title;
      updatePage();
    });
  }
});
var [root, id] = location.pathname.split("/").slice(1);
if (root === "gamemode") {
  makeGame(id, new URLSearchParams(location.search).entries()).then((gameId) => {
    location.href = `/host?id=${gameId}`;
  }).catch((err) => {
    api.UI.modal.error({
      content: err.message
    });
  });
} else {
  fetch("/api/games/summary/me").then((res) => res.json()).then(({ games }) => {
    api.settings.create([
      {
        type: "dropdown",
        id: "kit",
        title: "Kit",
        description: "Which kit should be used when starting a game from a link?",
        options: games.map((g) => ({ label: g.title, value: g._id }))
      },
      {
        id: "updateLink",
        type: "toggle",
        title: "Update Tab Link",
        description: "If the tab link text should be updated to the gamemode link when using the gamemode selector",
        default: true,
        onChange: updatePage
      },
      {
        id: "updateTitle",
        type: "toggle",
        title: "Update Tab Title",
        description: "If the tab title should be updated to the gamemode name using the gamemode selector",
        default: true,
        onChange: updatePage
      }
    ]);
  }, api.logger.error);
}
