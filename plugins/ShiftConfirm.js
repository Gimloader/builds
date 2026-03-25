/**
 * @name ShiftConfirm
 * @description Makes confirm popups resolve instantly when holding shift.
 * @author retrozy
 * @version 0.1.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/ShiftConfirm.js
 * @webpage https://gimloader.github.io/plugins/ShiftConfirm
 * @changelog Fixed plugin crashing
 */

// plugins/ShiftConfirm/src/index.ts
api.UI.onComponentLoad("modal", (modal) => {
  const originalConfirm = modal.confirm;
  api.patcher.swap(modal, "confirm", (props) => {
    if (api.hotkeys.pressed.has("ShiftLeft")) {
      props.onOk?.();
      return {
        destroy() {
        },
        update() {
        }
      };
    } else {
      return originalConfirm(props);
    }
  });
});
