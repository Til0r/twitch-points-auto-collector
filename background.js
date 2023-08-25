const tabs = chrome.tabs;
const runtime = chrome.runtime;
const chromeLocalStorage = chrome.storage.local;

console.log("TwitchPointsAutoCollector ==> Background script running!");

runtime.onInstalled.addListener(() => {
  console.log("TwitchPointsAutoCollector ==> Extension installed!");
});

runtime.onUpdateAvailable.addListener(() => {
  console.log("TwitchPointsAutoCollector ==> Extension updated!");
  runtime.reload();
});

runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { channel, avatarStreamer, nameStreamer, url } = message;

  if (channel === "pointsClaimed") {
    const { tab } = sender;

    chromeLocalStorage.get("twitchPointsAutoCollectorStats").then((storage) => {
      const { twitchPointsAutoCollectorStats } = storage;

      const pointsClaimed = `${
        twitchPointsAutoCollectorStats &&
        nameStreamer in twitchPointsAutoCollectorStats
          ? parseInt(twitchPointsAutoCollectorStats[nameStreamer].points) + 1
          : 1
      }`;

      const newTwitchPointsAutoCollectorStats = {
        twitchPointsAutoCollectorStats: {
          ...twitchPointsAutoCollectorStats,
          [nameStreamer]: {
            points: pointsClaimed,
            avatarStreamer,
            nameStreamer,
            url,
          },
        },
      };

      chromeLocalStorage.set(newTwitchPointsAutoCollectorStats).then(() => {
        setBadge(tab.id, pointsClaimed);
      });
    });
  }
});

tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete" && tab.url) {
    tabs.sendMessage(tabId, {
      channel: "urlChanged",
      url: tab.url,
    });

    chromeLocalStorage.get("twitchPointsAutoCollectorStats").then((storage) => {
      const { twitchPointsAutoCollectorStats } = storage;

      let text = null;

      if (twitchPointsAutoCollectorStats)
        text =
          Object.values(twitchPointsAutoCollectorStats).find(
            (el) => el.url === tab.url
          )?.points || null;

      setBadge(tab.id, text);
    });
  }
});

function setBadge(tabId, text) {
  chrome.action.setBadgeText({
    tabId,
    text,
  });

  chrome.action.setBadgeBackgroundColor({
    color: "#a970ff",
    tabId,
  });
}
