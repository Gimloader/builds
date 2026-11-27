/**
 * @name KitTimesPlayed
 * @description Shows the number of times that kits have been played on the kits screen
 * @author Gimloader Official
 * @version 0.2.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/KitTimesPlayed.js
 * @webpage https://gimloader.github.io/plugins/KitTimesPlayed
 * @signature pANMoNzAopOfRxPmTempM8FVoifiOZqDWGOKpxSE1U5ET7lNswYXsBE8aPuFlAAehV543pdyQAi4l5ugM4QGDw==
 */

// plugins/KitTimesPlayed/src/index.ts
api.rewriter.exposeVar("Container-", {
  check: "?`Created ${",
  find: /content: center;\n`,(\w{1,3})=/,
  callback: (val, initial) => {
    if (!initial) api.UI.forceReactUpdate();
    api.onStop(() => api.UI.forceReactUpdate());
    api.patcher.afterReact(val.type, (_, args, result) => {
      const created = result.props.children[0].props.children.props.children.props.children[0].props.children[1].props.children[1].props;
      const playCount = args[0].game.playCount;
      const message = playCount ? playCount > 1 ? `played ${playCount} times` : "played once" : "never played";
      created.children += ", " + message;
    });
  }
});
