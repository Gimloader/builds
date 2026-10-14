/**
 * @name KitTimesPlayed
 * @description Shows the number of times that kits have been played on the kits screen
 * @author Gimloader Official
 * @version 0.2.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/KitTimesPlayed.js
 * @webpage https://gimloader.github.io/plugins/KitTimesPlayed
 * @changelog Removed need to reload when installing
 * @signature K/crGomuoQ31yeoL+R9aAMKdUgMmE7lbSY2qHRCYeSh0BrMggh7A3+QyttCOpQl+pWKj4IOqLYUio93qWpUHCg==
 */

// plugins/KitTimesPlayed/src/index.ts
api.rewriter.swapVar("Container-", {
  check: "?`Created ${",
  find: /description}}\):null]}\)}\),(\w{1,3})/,
  callback: (val, initial) => {
    if (!initial) api.UI.forceReactUpdate();
    api.onStop(() => api.UI.forceReactUpdate());
    let hasPatched = false;
    return function() {
      if (hasPatched) return val.apply(this, arguments);
      const res = val.apply(this, arguments);
      const kitCards = res.props.children[1].props.children.props.children;
      const type = kitCards[0]?.props.children.type;
      if (!type) return res;
      const typeFn = type.type;
      api.onStop(() => type.type = typeFn);
      hasPatched = true;
      type.type = function(props) {
        const result = typeFn.apply(this, arguments);
        const created = result.props.children[0].props.children.props.children.props.children[0].props.children[1].props.children[1].props;
        const playCount = props.game.playCount;
        const message = playCount ? playCount > 1 ? `played ${playCount} times` : "played once" : "never played";
        created.children += ", " + message;
        return result;
      };
      return val.apply(this, arguments);
    };
  }
});
