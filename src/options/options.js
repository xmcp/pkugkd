function id(x) {
    return document.getElementById(x);
}
function log(x) {
    id('save-output').textContent=x;
}

chrome.storage.sync.get(['username','password'], (res)=>{
    id('username').value=res.username||'';
    id('password').value=res.password||'';
});

id('password-form').addEventListener('submit',(e)=>{
    e.preventDefault();

    let username=id('username').value;
    let password=id('password').value;

    if(!username && !password) {
        chrome.storage.sync.remove(['username','password'], ()=>{
            log('已清除');
        });
        return;
    }

    log('正在检验密码……');
    ipgw.login(username,password)
        .then(()=>{
            log('正在保存……');
            chrome.storage.sync.set({
                username: username,
                password: password,
            }, ()=>{
                log('已保存');
            });
        })
        .catch((e)=>{
            log(e);
        });
});