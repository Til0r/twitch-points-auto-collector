let genericMutationObserver = null;

function mutationObserverTwilightMain(url) {
  const twilightMain = document.getElementsByClassName("twilight-main")[0];

  if (!url) url = window.location.href;

  startMutationObserver(() => {
    const liveChannelStreamInformation = document.querySelector(
      "#live-channel-stream-information"
    );

    if (liveChannelStreamInformation) {
      const avatarStreamer =
        liveChannelStreamInformation.querySelector(".tw-image-avatar");

      const nameStreamer =
        liveChannelStreamInformation.querySelector(".tw-title")?.innerText;

      if (
        nameStreamer &&
        avatarStreamer &&
        url.includes(
          nameStreamer.split(" ").filter(Boolean).join("").toLowerCase()
        )
      )
        mutationObserverChannelRootRightColumn(
          nameStreamer,
          avatarStreamer.getAttribute("src")
        );
    }
  }, twilightMain);
}

function mutationObserverChannelRootRightColumn(nameStreamer, avatarStreamer) {
  const channelRootRightColumn = document.getElementsByClassName(
    "channel-root__right-column"
  )[0];

  if (channelRootRightColumn)
    startMutationObserver(() => {
      const communityPointsSummary = document.getElementsByClassName(
        "community-points-summary"
      )[0];

      if (communityPointsSummary) {
        const communityPointsSummaryChild = communityPointsSummary?.childNodes;

        if (
          communityPointsSummaryChild &&
          communityPointsSummaryChild.length >= 2
        ) {
          const communityPointsSummaryContainerButton =
            communityPointsSummaryChild[1];

          if (communityPointsSummaryContainerButton) {
            const communityPointsSummaryButton =
              communityPointsSummaryContainerButton.getElementsByTagName(
                "button"
              )[0];

            if (communityPointsSummaryButton) {
              communityPointsSummaryButton.click();

              if (chrome)
                chrome.runtime.sendMessage({
                  channel: "pointsClaimed",
                  nameStreamer,
                  avatarStreamer,
                  url: window.location.href,
                });
            }
          }
        }
      }
    }, channelRootRightColumn);
  else disconnectMutationObserver();
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
