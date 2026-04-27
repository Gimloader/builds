/**
 * @name GameCodeHider
 * @description Allows hiding/revealing your game code everywhere
 * @author retrozy
 * @version 0.1.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/GameCodeHider.js
 * @webpage https://gimloader.github.io/plugins/GameCodeHider
 * @changelog Fixed code not being hidden when building in Creative editor
 * @signature V9ck+1f9ErsL3scNVLCT//BmFSrjgxcuLoKyzBh0LOPAX/ogH39osu4CVa1OUGGvCpMlTgvEShaV2C5KZkC3DA==
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

// plugins/GameCodeHider/src/wrapper.tsx
var hiddenStyles = `.ant-popover .ant-qrcode {
    display: none;
}`;
var removeStyles;
updateHidden(api.storage.getValue("hidden", false));
function updateHidden(value) {
  if (value) {
    removeStyles = api.UI.addStyles(hiddenStyles);
  } else {
    removeStyles?.();
  }
}
function CodeWrapper({ children, small, prefix = "" }) {
  const React = GL.React;
  const [hidden, setHidden] = React.useState(api.storage.getValue("hidden", false));
  if (children.props?.showLargeCode) return children;
  const toggleHidden = (e) => {
    e.stopPropagation();
    setHidden((prev) => {
      api.storage.setValue("hidden", !prev);
      updateHidden(!prev);
      return !prev;
    });
  };
  const text = hidden ? `${prefix}######` : children.props.children;
  const eye = /* @__PURE__ */ GL.React.createElement("div", { className: `${small ? "gch-toggle-small" : "gch-toggle"} far ${hidden ? "fa-eye-slash" : "fa-eye"}`, onClick: toggleHidden });
  const onClick = children.props?.onClick;
  if (onClick) {
    children.props.onClick = (e) => {
      if (e.target.className.includes("gch-toggle")) return;
      onClick(e);
    };
  }
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
var createWrapper = api.rewriter.createShared("createWrapper", (Element, small, prefix) => {
  return (props) => /* @__PURE__ */ GL.React.createElement(CodeWrapper, { small, prefix }, /* @__PURE__ */ GL.React.createElement(Element, { ...props }));
});

// plugins/GameCodeHider/src/index.ts
api.UI.addStyles(styles_default);
var BigCode = api.rewriter.createShared("BigCode", null);
api.rewriter.runInScope("SixteenByNineScaler", (code, run, initial) => {
  const nameStart = code.indexOf("font-size: 32px;") + 19;
  const nameEnd = code.indexOf("=", nameStart);
  const component = code.slice(nameStart, nameEnd);
  run(`${BigCode}=${component};${component}=${createWrapper}(${component},false)`);
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
  run(`${TwoDCode}=${component};${component}=${createWrapper}(${component},true)`);
  if (!initial) api.UI.forceReactUpdate();
  api.onStop(() => {
    run(`${component}=${TwoDCode}`);
    api.UI.forceReactUpdate();
  });
  return true;
});
var CreativeCode = api.rewriter.createShared("CreativeCode", null);
api.rewriter.runInScope("App", (code, run, initial) => {
  const index = code.indexOf("Join Code: ");
  if (index === -1) return;
  const afterIndex = code.indexOf("light-shadow", index);
  const nameEnd = code.lastIndexOf("=", afterIndex);
  const nameStart = code.lastIndexOf(",", nameEnd) + 1;
  const component = code.slice(nameStart, nameEnd);
  run(`${CreativeCode}=${component};${component}=${createWrapper}(${component},true,"Join Code: ")`);
  if (!initial) api.UI.forceReactUpdate();
  api.onStop(() => {
    run(`${component}=${CreativeCode}`);
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
  run(`${OneDCode}=${component};${component}=${createWrapper}(${component},true)`);
  if (!initial) api.UI.forceReactUpdate();
  api.onStop(() => {
    run(`${component}=${OneDCode}`);
    api.UI.forceReactUpdate();
  });
  return true;
});
