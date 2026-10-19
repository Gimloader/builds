/**
 * @name KitTimesPlayed
 * @description Shows the number of times that kits have been played on the kits screen
 * @author Gimloader Official
 * @version 0.2.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/KitTimesPlayed.js
 * @webpage https://gimloader.github.io/plugins/KitTimesPlayed
 * @changelog Removed need to reload when installing
 * @signature XiBgByslJdPbVaaavq2IRlVGOQt/FD35Ux9xNTIevI+warLess6LcknGvhrGUcpd4vU057iT/jeoEz1H53R1CQ==
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
