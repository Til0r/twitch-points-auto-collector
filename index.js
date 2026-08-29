let genericMutationObserver = null;
let watchTimeIntervalId = null;
// Set once the extension has been reloaded/updated while this tab's content
// script kept running. From that point chrome.runtime is disconnected and
// every call throws "Extension context invalidated" — nothing we do can
// reconnect it, so we stop trying instead of erroring on every claim/tick.
let extensionContextInvalidated = false;

function sendMessageSafely(payload) {
  if (extensionContextInvalidated) {
    return;
  }

  try {
    chrome.runtime.sendMessage(payload);
  } catch (error) {
    extensionContextInvalidated = true;
    disconnectMutationObserver();
    if (watchTimeIntervalId) clearInterval(watchTimeIntervalId);
    console.log(
      "TwitchPointsAutoCollector ==> Extension was reloaded/updated; refresh this page to resume tracking."
    );
  }
}
// The bonus button we've already clicked, tracked by DOM node identity
// rather than by any derived string (URL, streamer name, ...). Twitch's SPA
// can restart our observers (e.g. on a query-string-only URL change) without
// the actual button changing, so identity is the only thing that reliably
// survives that churn and still lets us tell "already clicked, not yet
// cleared" apart from "a genuinely new bonus".
let claimedButtonElement = null;

function getCurrentStreamerInfo(url = window.location.href) {
  const liveChannelStreamInformation = document.querySelector(
    "#live-channel-stream-information"
  );

  if (!liveChannelStreamInformation) {
    return null;
  }

  const avatarStreamer =
    liveChannelStreamInformation.querySelector(".tw-image-avatar")?.getAttribute("src");

  const nameStreamer =
    liveChannelStreamInformation.querySelector(".tw-title")?.innerText;

  if (!nameStreamer || !avatarStreamer) {
    return null;
  }

  const nameStreamerIsPresentInUrl = url.includes(
    nameStreamer.split(" ").filter(Boolean).join("").toLowerCase()
  );

  if (!nameStreamerIsPresentInUrl) {
    return null;
  }

  return { nameStreamer, avatarStreamer };
}

function mutationObserverTwilightMain(url = window.location.href) {
  const twilightMain = document.getElementsByClassName("twilight-main")[0];

  if (!twilightMain) return;

  startMutationObserver(() => {
    const streamerInfo = getCurrentStreamerInfo(url);

    if (!streamerInfo) {
      return;
    }

    mutationObserverChannelRootRightColumn(
      streamerInfo.nameStreamer,
      streamerInfo.avatarStreamer
    );
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

    const communityPointsSummaryButton = getClaimBonusButton(communityPointsSummary);

    if (!communityPointsSummaryButton) {
      // No bonus available right now, so the next one we see is a genuinely
      // new opportunity and should be allowed to be counted.
      claimedButtonElement = null;
      return;
    }

    if (communityPointsSummaryButton === claimedButtonElement) {
      // Already clicked this exact button; waiting for it to actually clear.
      return;
    }

    communityPointsSummaryButton.click();
    claimedButtonElement = communityPointsSummaryButton;

    sendMessageSafely({
      channel: "pointsClaimed",
      nameStreamer,
      avatarStreamer,
      url: window.location.href,
    });
  }, channelRootRightColumn)
}

function getClaimBonusButton(communityPointsSummary) {
  // The button itself uses an auto-generated styled-components class that
  // changes across Twitch deploys, so we can't match on that directly. Its
  // icon, however, always carries the stable "claimable-bonus__icon" class —
  // present only on the real claim button, never the balance/toggle button —
  // regardless of the Twitch UI's language.
  const bonusIcon = communityPointsSummary.querySelector(".claimable-bonus__icon");
  return bonusIcon?.closest("button:not([disabled])") || null;
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

chrome.runtime.onMessage.addListener((request) => {
  if (request.channel === "urlChanged") mutationObserverTwilightMain(request.url);
  if (request.channel === "requestWatchTimeTick") sendWatchTimeTick();
});

mutationObserverTwilightMain();

const WATCH_TICK_SECONDS = 30;
let lastWatchTickAt = Date.now();

// Tracks watch time independently of the claim-detection observers above, so
// it can't be affected by their setup/teardown churn. Only counts while the
// tab is actually visible, so a backgrounded tab doesn't inflate the total.
// Sends the *actual* elapsed time since the last tick (rather than a fixed
// amount) so an on-demand tick — from the interval below or the popup's
// refresh button — is always accurate, however long it's really been.
function sendWatchTimeTick() {
  const now = Date.now();
  const elapsedSeconds = Math.round((now - lastWatchTickAt) / 1000);
  lastWatchTickAt = now;

  if (document.hidden || elapsedSeconds <= 0) {
    return;
  }

  const streamerInfo = getCurrentStreamerInfo();

  if (!streamerInfo) {
    return;
  }

  sendMessageSafely({
    channel: "watchTimeTick",
    nameStreamer: streamerInfo.nameStreamer,
    avatarStreamer: streamerInfo.avatarStreamer,
    seconds: elapsedSeconds,
    url: window.location.href,
  });
}

watchTimeIntervalId = setInterval(sendWatchTimeTick, WATCH_TICK_SECONDS * 1000);
