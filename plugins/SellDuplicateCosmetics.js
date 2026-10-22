/**
 * @name SellDuplicateCosmetics
 * @description Automatically sell duplicate cosmetics you own
 * @author Gimloader Official
 * @version 1.0.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/plugins/SellDuplicateCosmetics.js
 * @webpage https://gimloader.github.io/plugins/SellDuplicateCosmetics
 * @signature K86sE5A2XEEbqu9UbTr5iLhMpAU7jY6OhFuwAHIIO6XRJ6g/lHXN5dg8pFSs5pU4soSRMaDMQjXi2wVndyAYBQ==
 */

// plugins/SellDuplicateCosmetics/src/index.ts
var querier;
api.rewriter.exposeVar(true, {
  find: /View Steps To Fix`}\)]}\)},(\w{1,3})=new/,
  callback: (found, initial) => {
    querier = found;
    if (!initial) querier.invalidateQueries(["cosmos-owned-cosmetics"]);
  }
});
api.net.modifyFetchResponse("/api/cosmos/owned-cosmetics", (data) => {
  const excess = data.ownedCosmetics.filter((c) => c.count > 1);
  if (excess.length === 0) return;
  sellCosmetics(excess);
});
async function sellCosmetics(excess) {
  const totalToSell = excess.reduce((acc, item) => acc + (item.count - 1), 0);
  const responses = await Promise.all(excess.map(async (item) => {
    return fetch("/api/cosmos/sell", {
      method: "POST",
      body: JSON.stringify({
        cosmeticId: item.cosmetic.id,
        count: item.count - 1
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });
  }));
  const json = await Promise.all(responses.map((res) => res.json()));
  const totalSold = json.reduce((acc, item) => acc + item.amount, 0);
  api.UI.toast.success(`AutoSell: Sold ${totalToSell} duplicate cosmetic${totalToSell > 1 ? "s" : ""} for ${totalSold} coins`);
  if (!querier) return;
  querier.invalidateQueries(["cosmos-basics"]);
  querier.invalidateQueries(["cosmos-owned-cosmetics"]);
}
