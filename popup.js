const localStorageChrome = chrome.storage.local;

localStorageChrome.onChanged.addListener((storage) => {
  const newValue = storage?.twitchPointsAutoCollectorStats?.newValue;
  if (newValue && Object.values(newValue).length) generateUi(newValue || []);
});

localStorageChrome.get("twitchPointsAutoCollectorStats").then((storage) => {
  const { twitchPointsAutoCollectorStats } = storage;
  generateUi(twitchPointsAutoCollectorStats || []);
});

function generateUi(twitchPointsAutoCollectorStats) {
  const statsElement = document.getElementById("stats");
  if (statsElement.innerHTML) statsElement.innerHTML = "";

  const twitchPointsAutoCollectorStatsList = Object.keys(
    twitchPointsAutoCollectorStats
  );

  if (twitchPointsAutoCollectorStatsList.length)
    twitchPointsAutoCollectorStatsList.forEach((key) => {
      const currentStreamer = twitchPointsAutoCollectorStats[key];

      statsElement.insertAdjacentHTML(
        "beforeend",
        `
        <div class="points-for-streamer">
          <div class="name-avatar-streamer">
            <img class="avatar-streamer" src="${currentStreamer.avatarStreamer}"/>
            <div class="name-streamer">
              ${currentStreamer.nameStreamer}
            </div>
          </div>
          <div>
            <span class="streamer">${currentStreamer.points}</span> <span class="points">times</span>
          </div>
        </div>
      `
      );
    });
  else {
    statsElement.innerHTML = `<div>No collected points yet</div>`;
  }
}
