let result;

loadData();

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request)
    let type = request.type;
    if (type == 'requestData') {
        sendResponse({data: result});
    }
})


function loadData() {
    chrome.storage.local.get(['data'], function(res) {
        if (res && res.data) {
            result = res.data;
        }
    })
}