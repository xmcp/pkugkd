chrome.runtime.onInstalled.addListener((details)=>{
    if(details.reason==='install')
        chrome.runtime.openOptionsPage();
});

chrome.webNavigation.onCommitted.addListener((details)=>{
    let next_url=new URL(details.url).searchParams.get('whereto');
    if(next_url && details.tabId)
        chrome.tabs.update(details.tabId,{
            url: chrome.runtime.getURL('popup/popup.html?auto_redirect='+encodeURIComponent(next_url)),
        });
},{
    url: [{
        hostEquals: 'its.pku.edu.cn',
        queryContains: 'whereto=',
    }],
});

chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
    console.log('onmessage',message,sender);
    if(message.type==='its_quickconnect') {
        if(sender.tab.id)
            chrome.tabs.update(sender.tab.id,{
                url: chrome.runtime.getURL('popup/popup.html?auto_redirect='+encodeURIComponent('https://its.pku.edu.cn/netportal/myits.jsp')),
            });
    }
});