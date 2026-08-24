/**
 * @name PreventKickForSpam
 * @description Attempts to prevent automatic 1D kicks from answering questions too quickly
 * @author Gimloader Official
 * @version 0.1.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/PreventKickForSpam.js
 * @webpage https://gimloader.github.io/plugins/PreventKickForSpam
 * @gamemode 1d
 * @signature kMieODnHxDiY965idtWPHhMAQAK1yyL1wQvHUu64+2yZhPJpwyoFCOhT0PD1V0rqTJ+ZwqnbXyXsqvYcd1W4Bw==
 */

// plugins/PreventKickForSpam/src/index.ts
api.net.onLoad(() => {
  let firstAnswerTime = 0;
  let lastAnswerTime = 0;
  api.net.blueboat.on("send:QUESTION_ANSWERED", (_, editFn) => {
    const now = Date.now();
    firstAnswerTime ||= now;
    if (now - firstAnswerTime < 25e3) return;
    if (now - lastAnswerTime <= 750) {
      editFn(null);
    } else {
      lastAnswerTime = now;
    }
  });
});
