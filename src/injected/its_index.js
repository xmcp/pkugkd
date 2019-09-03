let next_url=new URL(location.href).searchParams.get('whereto');
if(next_url && next_url.indexOf('http')===0) {
    chrome.runtime.sendMessage({
        type: 'its_quickconnect',
        redirect_url: next_url,
    });
    location.replace('/favicon.ico'); // prevent login page loading before redirected from background script
}

let disabled=false;

function do_quickconnect() {
    if(!disabled)
        chrome.runtime.sendMessage({
            type: 'its_quickconnect',
            redirect_url: 'https://its.pku.edu.cn/netportal/myits.jsp',
        });
}

let elem=document.createElement('div');
elem.className='gkd-injected-login-banner';

let logo_elem=document.createElement('img');
logo_elem.src=chrome.runtime.getURL('assets/logo_48.png');
elem.appendChild(logo_elem);

let text_elem=document.createElement('span');
text_elem.textContent='点击或按空格键来一键连网';
elem.appendChild(text_elem);

elem.addEventListener('click',do_quickconnect);

document.addEventListener('keydown',on_keydown);
function on_keydown(e) {
    console.log(e);
    if(disabled) return;

    if(e.key===' ') {
        e.preventDefault();
        do_quickconnect();
    } else if(e.key) { // autofocus event doesnt have key
        disabled=true;
        document.removeEventListener('keydown',on_keydown);
        elem.classList.add('gkd-injected-login-banner-disabled');
    }
}

document.addEventListener('DOMContentLoaded',()=>{
    document.body.appendChild(elem);
    console.log('gkd injected');
});
