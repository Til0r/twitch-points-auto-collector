let genericMutationObserver = null;

function mutationObserverTwilightMain(url) {
  const twilightMain = document.getElementsByClassName("twilight-main")[0];

  if (!url) { url = window.location.href; }

  startMutationObserver(() => {
    const liveChannelStreamInformation = document.querySelector(
      "#live-channel-stream-information"
    );

    if (!liveChannelStreamInformation) {
      return
    }

    const avatarStreamer =
      liveChannelStreamInformation.querySelector(".tw-image-avatar").getAttribute("src");

    const nameStreamer =
      liveChannelStreamInformation.querySelector(".tw-title")?.innerText;

    const nameStreamerIsPresentInUrl = url.includes(
      nameStreamer.split(" ").filter(Boolean).join("").toLowerCase()
    )

    if (
      nameStreamer &&
      avatarStreamer &&
      nameStreamerIsPresentInUrl
    ) {
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
  }

  startMutationObserver(() => {
    const communityPointsSummary = document.getElementsByClassName(
      "community-points-summary"
    )[0];

    if (!communityPointsSummary) {
      return
    }

    const communityPointsSummaryChild = communityPointsSummary?.childNodes;

    if (!communityPointsSummaryChild) {
      return
    }

    const communityPointsSummaryContainerButton =
      communityPointsSummaryChild[1];

    if (!communityPointsSummaryContainerButton) {
      return
    }

    const communityPointsSummaryButton =
      communityPointsSummaryContainerButton.getElementsByTagName(
        "button"
      )[0];

    if (!communityPointsSummaryButton) {
      return
    }

    communityPointsSummaryButton.click();

    if (!chrome) {
      return
    }

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
  genericMutationObserver.disconnect();
  genericMutationObserver = null;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.channel === "urlChanged") mutationObserverTwilightMain();
});
