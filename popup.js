const localStorageChrome = chrome.storage.local;

localStorageChrome.onChanged.addListener((storage) => {
  const newValue = storage?.twitchPointsAutoCollectorStats?.newValue;
  if (newValue && Object.keys(newValue).length) generateUi(newValue);
});

localStorageChrome.get("twitchPointsAutoCollectorStats").then((storage) => {
  const { twitchPointsAutoCollectorStats } = storage;
  generateUi(twitchPointsAutoCollectorStats || {});
});

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
    statsElement.appendChild(row);
  });
}
