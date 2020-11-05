console.log('[Supreme] Hi');

chrome.extension.sendMessage({ type: 'requestData' }, function (result) {
    if (result.data) {
        storage = result.data;
        dataLoaded = true;
        // startWorkflowBatch(result.data);
        let settings = result.data.settings;
        if (settings.infiniteLoop !== undefined && settings.infiniteLoop === true) {
            startInfiniteMode();
        } else {
            startMode1();
        }            
    }
});