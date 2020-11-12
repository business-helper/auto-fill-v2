let result;
let _tabs = {};

loadData();

chrome.extension.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {
  let type = request.type;
  // console.log('[message]', request, sender);
  if (type === "requestData") {
    sendResponse({ data: result });
  } else if (type === 'remember.supreme.atc') {
    _tabs['SUPREME_ATC'] = sender.tab.id; console.log(_tabs);
    sendResponse({ status: true, id: sender.tab.id });
  }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  // https://developer.chrome.com/extensions/storage
  loadData();
});

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

  // since only one tab should be active and in the current window at once
  // the return variable should only have one entry
  let activeTab = tabs[0]; console.log('[Active tab]', activeTab.id);

});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
  // console.log(tabId, info, tab);
  // if (info.status && info.status == "complete") {
  if (info.title) {
    // The page is loaded, so inject a content script
    // console.log('[complete]', tabId, info, tab);
    chrome.tabs.sendMessage(tabId, { action: "URL_CHANGED" });
  }
});

chrome.webRequest.onCompleted.addListener(
  function (details) {
    const { url } = details;
    const ptn_supremeATC = new RegExp("supremenewyork.com/shop/[a-z0-9]+/add", "i");
    if (ptn_supremeATC.test(url) && _tabs['SUPREME_ATC']) {

      chrome.tabs.sendMessage(_tabs['SUPREME_ATC'], { action: "SUPREME_ATC" });
    }
  },
  { urls: ["<all_urls>"] }
);

//https://www.supremenewyork.com/shop/173652/add
// chrome.webRequest.onBeforeRequest.addListener(
//   function (details) {
//     console.log("[onBeforeRequest]", details);
//   },
//   { urls: ["<all_urls>"] }
// );

function loadData() {
  chrome.storage.local.get(["data"], function (res) {
    if (res && res.data) {
      result = res.data;
      console.log(result);
    }
  });
}
