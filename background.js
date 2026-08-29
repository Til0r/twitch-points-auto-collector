const tabs = chrome.tabs;
const runtime = chrome.runtime;
const chromeLocalStorage = chrome.storage.local;

console.log("TwitchPointsAutoCollector ==> Background script running!");

runtime.onInstalled.addListener(() => {
  console.log("TwitchPointsAutoCollector ==> Extension installed!");
});

// Serializes every stats read-modify-write behind one promise chain so a
// "pointsClaimed" and a "watchTimeTick" landing close together (or two of the
// same type) can't race and silently drop one of them.
let statsQueue = Promise.resolve();

function updateStats(updater) {
  statsQueue = statsQueue
    .then(() => chromeLocalStorage.get("twitchPointsAutoCollectorStats"))
    .then((storage) => {
      const updatedStats = updater(storage.twitchPointsAutoCollectorStats || {});

      return chromeLocalStorage
        .set({ twitchPointsAutoCollectorStats: updatedStats })
        .then(() => updatedStats);
    })
    .catch((error) => {
      console.error("TwitchPointsAutoCollector ==> Failed to update stats", error);
      return {};
    });

  return statsQueue;
}

runtime.onMessage.addListener((message, sender) => {
  const { channel, avatarStreamer, nameStreamer, url } = message;

  if (channel === "pointsClaimed") {
    const { tab } = sender;

    updateStats((currentStats) => {
      const existing = currentStats[nameStreamer];
      const pointsClaimed = `${existing ? Number.parseInt(existing.points) + 1 : 1}`;

      return {
        ...currentStats,
        [nameStreamer]: {
          ...existing,
          points: pointsClaimed,
          avatarStreamer,
          nameStreamer,
          url,
        },
      };
    }).then((updatedStats) => {
      setBadge(tab.id, updatedStats[nameStreamer].points);
    });
  }

  if (channel === "watchTimeTick") {
    const { seconds } = message;

    updateStats((currentStats) => {
      const existing = currentStats[nameStreamer];
      const watchTimeSeconds = (existing?.watchTimeSeconds || 0) + seconds;

      return {
        ...currentStats,
        [nameStreamer]: {
          points: existing?.points || "0",
          ...existing,
          avatarStreamer,
          nameStreamer,
          url,
          watchTimeSeconds,
        },
      };
    });
  }
});

tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    tabs.sendMessage(tabId, {
      channel: "urlChanged",
      url: tab.url,
    }).catch(() => {});

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

function formatBadgeText(text) {
  if (!text) return text;
  const num = Number.parseInt(text);
  if (Number.isNaN(num)) return text;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${num}`;
}

function setBadge(tabId, text) {
  chrome.action.setBadgeText({
    tabId,
    text: formatBadgeText(text),
  });

  chrome.action.setBadgeBackgroundColor({
    color: "#a970ff",
    tabId,
  });
}
