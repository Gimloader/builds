/**
 * @name QuickCosmeticSelection
 * @description Allows you to select your cosmetics by only clicking on them.
 * @author Gimloader Official
 * @version 0.2.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/QuickCosmeticSelection.js
 * @webpage https://gimloader.github.io/plugins/QuickCosmeticSelection
 * @signature o3FxCnMdY9BysqU2ru9T2cDDeubw959MUUolJgfXTXqUKTIEXvLj8euoFpFAZoVk/GCZeNHh9zTgU0xsohfRAg==
 */

// plugins/QuickCosmeticSelection/src/index.ts
api.rewriter.swapVar("App-", {
  check: "useLocalstorageState:",
  find: /0.93\);\n`,(\w{1,3})=/,
  callback: (val, initial) => {
    if (!initial) api.UI.forceReactUpdate();
    api.onStop(() => api.UI.forceReactUpdate());
    return function(props) {
      const result = val.apply(this, arguments);
      const iconProps = result.props.children[0].props;
      const onClick = iconProps.onClick;
      iconProps.onClick = () => {
        if (props.selected || props.type === "sticker") {
          onClick();
          return;
        }
        const actions = result.props.children[1].props.callToAction({
          editStyles: props.editStyles
        });
        actions.onClick();
      };
      return result;
    };
  }
});
