chrome.runtime.onInstalled.addListener((details)=>{
    if(details.reason==='install')
        chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
    console.log('onmessage',message,sender);
    if(message.type==='its_quickconnect') {
        if(sender.tab.id)
            chrome.tabs.update(sender.tab.id,{
                url: chrome.runtime.getURL('popup/popup.html?auto_redirect='+encodeURIComponent(message.redirect_url)),
            });
    }
});