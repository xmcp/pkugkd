function id(x) {
    return document.getElementById(x);
}
function log(x) {
    id('log').textContent=x;
}

let username,password;

id('goto-settings-btn').addEventListener('click',()=>{
    chrome.runtime.openOptionsPage();
});

document.addEventListener('keydown',(e)=>{
    if(e.key!=='"') { // because '"' will break our selector
        let btn=document.querySelector(`[data-key="${e.key}"]`);
        if(btn) {
            e.preventDefault();
            console.log('key',e,'clicking',btn);
            btn.click();
        }
    }
});

let main_running=false;
async function main() {
    if(main_running) return;
    main_running=true;
    try {
        id('status').style.backgroundColor='var(--bg-invalid)';
        id('devices-container').textContent='';

        log('正在登录网关……');
        await ipgw.login(username,password);

        log('正在连接网络……');
        let ip,conn_status;
        try {
            ip=await ipgw.connect();
            conn_status='连接成功';
            id('status').style.backgroundColor='var(--bg-success)';
        } catch(e) {
            ip=null;
            conn_status=e;
            id('status').style.backgroundColor='var(--bg-failed)';
        }

        log(conn_status+'，获取设备列表……');
        let devices=await ipgw.get_connections();
        render_devices(devices,ip);

        log(conn_status);
    } catch(e) {
        log(e);
    }
    main_running=false;
}

function display_time(time) {
    let ago_s=Math.floor(((+new Date())-time)/1000);
    if(ago_s<-180) return '将来';
    else if(ago_s<60) return '现在';
    else if(ago_s<3600) return `${Math.floor(ago_s/60)}分钟前`;
    else if(ago_s<86400) return `${Math.floor(ago_s/3600)}小时前`;
    else if(ago_s<86400*7) return `${Math.floor(ago_s/86400)}天${Math.floor((ago_s%86400)/3600)}小时前`;
    else if(ago_s<86400*360) return `${Math.floor(ago_s/86400)}天小时前`;
    else return `${time.getFullYear()}-${time.getMonth()+1}-${time.getDate()}`;
}

function render_devices(devices,current_ip) {
    function _elem(tagname,content,attrs=[],listeners=[]) {
        let elem=document.createElement(tagname);
        elem.textContent=content;
        attrs.forEach(([k,v])=>{
            elem.setAttribute(k,v);
        });
        listeners.forEach(([e,f])=>{
            elem.addEventListener(e,f);
        });
        return elem;
    }

    let container=id('devices-container');

    if(devices.length===0) {
        container.appendChild(_elem('p','没有设备连接',[
            ['class','device-container-empty']
        ]));
    }

    devices.sort((a,b)=>{
        if(a.ip===current_ip) return -1;
        else if(b.ip===current_ip) return 1;
        else return (+new Date(b.time))-(+new Date(a.time));
    });

    devices.forEach(({ip,position,identifier,time},idx)=>{
        let row_container=document.createElement('div');

        let row=document.createElement('div');
        row.className='device-row'+(ip===current_ip ? ' current-device' : '');
        let discon_log=document.createElement('div');
        discon_log.className='device-discon-log';
        row_container.appendChild(row);
        row_container.appendChild(discon_log);

        async function do_disconnect() {
            row_container.classList.add('device-disconnect');
            discon_log.textContent='正在断开 '+ip;
            try {
                await ipgw.disconnect(ip);
                discon_log.textContent='已断开 '+ip;
            } catch(e) {
                discon_log.textContent=e;
            }
        }

        row.appendChild(_elem('kbd',idx+1,[
            ['data-key',''+(idx+1)],
            ['class','discon-btn'],
        ],[
            ['click',do_disconnect],
        ]));
        row.appendChild(_elem('span',display_time(new Date(time)),[
            ['title',time],
        ]));
        row.appendChild(_elem('span',identifier,[
            ['title',ip],
        ]));
        row.appendChild(_elem('span','@'+position));

        container.appendChild(row_container);
    });
}

chrome.storage.sync.get(['username','password'],(res)=>{
    username=res.username;
    password=res.password;

    if(!username || !password) {
        id('goto-settings-container').style.display='inherit';
        id('main-ui').style.display='none';
    } else {
        main();
        document.querySelector('[data-key=" "]').addEventListener('click',main);
    }
});