/**
 * @name GameCodeHider
 * @description Allows hiding/revealing your game code everywhere
 * @author retrozy
 * @version 0.1.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/GameCodeHider.js
 * @webpage https://gimloader.github.io/plugins/GameCodeHider
 * @signature XJdqpnaR1kKY//HANY/eGC1yYbxT879Bo+fA2N7hEb0FBxqYZCfZRaczoD/03cuEZFAX+AwU5ZVcQctUdC5LAg==
 */

// plugins/GameCodeHider/src/styles.css
var styles_default = `.gch-wrap {
    display: flex;
    gap: 24px;
    align-items: center;
}

.gch-wrap-small {
    display: flex;
    gap: 10px;
    align-items: center;
}

.gch-toggle {
    cursor: pointer;
    font-size: 40px;
    margin-top: 13px;
}

.gch-toggle-small {
    cursor: pointer;
    font-size: 16px;
}
`;

// plugins/GameCodeHider/src/index.tsx
api.UI.addStyles(styles_default);
function CodeWrapper({ children, small }) {
  const React = GL.React;
  const [hidden, setHidden] = React.useState(api.storage.getValue("hidden", false));
  if (children.props?.showLargeCode) return children;
  const toggleHidden = (e) => {
    e.stopPropagation();
    setHidden((prev) => {
      api.storage.setValue("hidden", !prev);
      return !prev;
    });
  };
  const text = hidden ? "######" : children.props.children;
  const eye = /* @__PURE__ */ GL.React.createElement("div", { className: `${small ? "gch-toggle-small" : "gch-toggle"} far ${hidden ? "fa-eye-slash" : "fa-eye"}`, onClick: toggleHidden });
  if (small) {
    return React.cloneElement(children, {
      children: /* @__PURE__ */ GL.React.createElement("div", { className: "gch-wrap-small" }, text, eye)
    });
  } else {
    const code = React.cloneElement(children, {
      ...children.props,
      children: text
    });
    return /* @__PURE__ */ GL.React.createElement("div", { className: "gch-wrap" }, code, eye);
  }
}
var createWrapper = api.rewriter.createShared("createWrapper", (small, Element) => {
  return (props) => {
    return /* @__PURE__ */ GL.React.createElement(CodeWrapper, { small }, /* @__PURE__ */ GL.React.createElement(Element, { ...props }));
  };
});
var BigCode = api.rewriter.createShared("BigWrapper", null);
api.rewriter.runInScope("SixteenByNineScaler", (code, run, initial) => {
  const nameStart = code.indexOf("font-size: 32px;") + 19;
  const nameEnd = code.indexOf("=", nameStart);
  const component = code.slice(nameStart, nameEnd);
  run(`${BigCode}=${component};${component}=${createWrapper}(false,${component})`);
  if (!initial) api.UI.forceReactUpdate();
  api.onStop(() => {
    run(`${component}=${BigCode}`);
    api.UI.forceReactUpdate();
  });
  return true;
});
var TwoDCode = api.rewriter.createShared("TwoDCode", null);
api.rewriter.runInScope("App", (code, run, initial) => {
  if (!code.includes("Game Code (Click to enlarge)")) return;
  const index = code.indexOf("padding: 8px 10px;");
  const nameEnd = code.lastIndexOf("=", index);
  const nameStart = code.lastIndexOf(",", nameEnd) + 1;
  const component = code.slice(nameStart, nameEnd);
  run(`${TwoDCode}=${component};${component}=${createWrapper}(true,${component})`);
  if (!initial) api.UI.forceReactUpdate();
  api.onStop(() => {
    run(`${component}=${TwoDCode}`);
    api.UI.forceReactUpdate();
  });
  return true;
});
var OneDCode = api.rewriter.createShared("OneDCode", null);
api.rewriter.runInScope("index", (code, run, initial) => {
  const index = code.indexOf(".showLargeCode?");
  if (index === -1) return;
  const nameStart = code.lastIndexOf(",", code.lastIndexOf(".div`", index)) + 1;
  const nameEnd = code.indexOf("=", nameStart);
  const component = code.slice(nameStart, nameEnd);
  run(`${OneDCode}=${component};${component}=${createWrapper}(true,${component})`);
  if (!initial) api.UI.forceReactUpdate();
  api.onStop(() => {
    run(`${component}=${OneDCode}`);
    api.UI.forceReactUpdate();
  });
  return true;
});
