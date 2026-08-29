const localStorageChrome = chrome.storage.local;

localStorageChrome.onChanged.addListener((storage) => {
  if ("twitchPointsAutoCollectorStats" in storage) {
    generateUi(storage.twitchPointsAutoCollectorStats.newValue || {});
  }
});

localStorageChrome.get("twitchPointsAutoCollectorStats").then((storage) => {
  const { twitchPointsAutoCollectorStats } = storage;
  generateUi(twitchPointsAutoCollectorStats || {});
});

const REFRESH_INTERVAL_MS = 30000;

// Asks the active Twitch tab's content script to flush its exact elapsed
// watch time right now, instead of waiting for its own 30s timer. The
// storage listener above then picks up the update and re-renders — no need
// to re-fetch here ourselves.
function requestWatchTimeRefresh() {
  chrome.tabs
    .query({ active: true, currentWindow: true, url: "*://www.twitch.tv/*" })
    .then((tabs) => {
      const tab = tabs[0];
      if (!tab) return;

      chrome.tabs
        .sendMessage(tab.id, { channel: "requestWatchTimeTick" })
        .catch(() => {
          // No content script listening (e.g. not on a live channel page) —
          // nothing to refresh.
        });
    });
}

document
  .getElementById("refresh-watchtime")
  .addEventListener("click", requestWatchTimeRefresh);

requestWatchTimeRefresh();
setInterval(requestWatchTimeRefresh, REFRESH_INTERVAL_MS);

function generateUi(twitchPointsAutoCollectorStats) {
  const statsElement = document.getElementById("stats");
  statsElement.innerHTML = "";

  const streamers = Object.keys(twitchPointsAutoCollectorStats);

  if (!streamers.length) {
    statsElement.innerHTML = `<div>No collected points yet</div>`;
    return;
  }

  streamers.forEach((key) => {
    const currentStreamer = twitchPointsAutoCollectorStats[key];

    const block = document.createElement("div");
    block.className = "streamer-block";

    const row = document.createElement("div");
    row.className = "points-for-streamer";

    const nameAvatar = document.createElement("div");
    nameAvatar.className = "name-avatar-streamer";

    const avatar = document.createElement("img");
    avatar.className = "avatar-streamer";
    avatar.src = currentStreamer.avatarStreamer;

    const name = document.createElement("div");
    name.className = "name-streamer";
    name.textContent = currentStreamer.nameStreamer;

    nameAvatar.append(avatar, name);

    const pointsContainer = document.createElement("div");

    const pointsCount = document.createElement("span");
    pointsCount.className = "streamer";
    pointsCount.textContent = currentStreamer.points;

    const pointsLabel = document.createElement("span");
    pointsLabel.className = "points";
    pointsLabel.textContent = " times";

    pointsContainer.append(pointsCount, pointsLabel);
    row.append(nameAvatar, pointsContainer);
    block.append(row);

    const watchTimeText = formatWatchTimeInfo(currentStreamer);

    if (watchTimeText) {
      const watchTime = document.createElement("div");
      watchTime.className = "watch-time-info";
      watchTime.textContent = watchTimeText;
      block.append(watchTime);
    }

    statsElement.appendChild(block);
  });
}

function formatWatchTimeInfo(currentStreamer) {
  const watchTimeSeconds = currentStreamer.watchTimeSeconds || 0;

  if (!watchTimeSeconds) {
    return null;
  }

  const watched = `Watched ${formatClock(watchTimeSeconds)}`;
  const points = Number.parseInt(currentStreamer.points) || 0;

  if (!points) {
    return watched;
  }

  const averageSecondsPerClaim = Math.round(watchTimeSeconds / points);

  return `${watched} · 1 claim / ${formatDuration(averageSecondsPerClaim)}`;
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function formatClock(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (value) => `${value}`.padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
