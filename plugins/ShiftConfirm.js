/**
 * @name ShiftConfirm
 * @description Makes confirm popups resolve instantly when holding shift.
 * @author retrozy
 * @version 0.1.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/ShiftConfirm.js
 * @webpage https://gimloader.github.io/plugins/ShiftConfirm
 * @changelog Updated webpage url
 */

// plugins/ShiftConfirm/src/index.ts
var originalConfirm = api.UI.modal.confirm;
api.patcher.swap(api.UI.modal, "confirm", (props) => {
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
