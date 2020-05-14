let result;

loadData();

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    let type = request.type;
    // console.log('[message]', request, sender);
    if (type == 'requestData') {
        sendResponse({data: result});
    }
})

chrome.storage.onChanged.addListener(function(changes, namespace) {
    // https://developer.chrome.com/extensions/storage
    loadData();
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {  
    if (info.status && (info.status == "complete")) {
        // The page is loaded, so inject a content script
        // console.log('[complete]', tabId, info, tab);
    }
});

chrome.webRequest.onBeforeRequest.addListener(function(details) {
    console.log('[onBeforeRequest]', details);
}, {urls: ["<all_urls>"]})

function loadData() {
    chrome.storage.local.get(['data'], function(res) {
        if (res && res.data) {
            result = res.data; console.log(result);
        }
    })
}