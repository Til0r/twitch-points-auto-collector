let genericMutationObserver = null;
let lastClaim = {
  key: null,
  claimedAt: 0,
};

const CLAIM_DEBOUNCE_MS = 2000;

function mutationObserverTwilightMain(url = window.location.href) {
  const twilightMain = document.getElementsByClassName("twilight-main")[0];

  if (!twilightMain) return;

  startMutationObserver(() => {
    const liveChannelStreamInformation = document.querySelector(
      "#live-channel-stream-information"
    );

    if (!liveChannelStreamInformation) {
      return;
    }

    const avatarStreamer =
      liveChannelStreamInformation.querySelector(".tw-image-avatar")?.getAttribute("src");

    const nameStreamer =
      liveChannelStreamInformation.querySelector(".tw-title")?.innerText;

    if (!nameStreamer || !avatarStreamer) {
      return;
    }

    const nameStreamerIsPresentInUrl = url.includes(
      nameStreamer.split(" ").filter(Boolean).join("").toLowerCase()
    );

    if (nameStreamerIsPresentInUrl) {
      mutationObserverChannelRootRightColumn(
        nameStreamer,
        avatarStreamer
      );
    }
  }, twilightMain);
}

function mutationObserverChannelRootRightColumn(nameStreamer, avatarStreamer) {
  const channelRootRightColumn = document.getElementsByClassName(
    "channel-root__right-column"
  )[0];

  if (!channelRootRightColumn) {
    disconnectMutationObserver();
    return;
  }

  startMutationObserver(() => {
    const communityPointsSummary = document.getElementsByClassName(
      "community-points-summary"
    )[0];

    if (!communityPointsSummary) {
      return;
    }

    const communityPointsSummaryButton =
      communityPointsSummary.querySelector("button:not([disabled])");

    if (!communityPointsSummaryButton) {
      return;
    }

    if (claimWasRecentlyHandled(nameStreamer)) {
      return;
    }

    communityPointsSummaryButton.click();
    markClaimHandled(nameStreamer);

    chrome.runtime.sendMessage({
      channel: "pointsClaimed",
      nameStreamer,
      avatarStreamer,
      url: window.location.href,
    });
  }, channelRootRightColumn)
}

function startMutationObserver(callback, element) {
  if (genericMutationObserver) disconnectMutationObserver();

  genericMutationObserver = new MutationObserver(callback);

  genericMutationObserver.observe(element, {
    subtree: true,
    childList: true,
  });
}

function disconnectMutationObserver() {
  if (genericMutationObserver) {
    genericMutationObserver.disconnect();
    genericMutationObserver = null;
  }
}

function claimWasRecentlyHandled(nameStreamer) {
  const claimKey = `${window.location.href}:${nameStreamer}`;
  const now = Date.now();

  return (
    lastClaim.key === claimKey &&
    now - lastClaim.claimedAt < CLAIM_DEBOUNCE_MS
  );
}

function markClaimHandled(nameStreamer) {
  lastClaim = {
    key: `${window.location.href}:${nameStreamer}`,
    claimedAt: Date.now(),
  };
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.channel === "urlChanged") mutationObserverTwilightMain(request.url);
});

mutationObserverTwilightMain();
