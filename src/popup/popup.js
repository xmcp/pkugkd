function id(x) {
    return document.getElementById(x);
}
function log(x) {
    id('log').textContent=x;
}

let username,password;
let connected=false;

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

        log('正在登录网关');
        await ipgw.login(username,password);

        log('正在连接网络');
        let ip,conn_status;
        try {
            ip=await ipgw.connect();
            conn_status=`已连接 (${ip})`;
            connected=true;
            id('status').style.backgroundColor='var(--bg-success)';
        } catch(e) {
            ip=null;
            conn_status=e.message||e;
            connected=false;
            id('status').style.backgroundColor='var(--bg-failed)';
        }

        log(conn_status+'，获取设备列表');
        let devices=await ipgw.get_connections();
        render_devices(devices,ip);

        log(conn_status);
    } catch(e) {
        log(e.message||e);
    }
    main_running=false;
}

function display_time(time) {
    if(!time) return '无效时间';
    let ago_s=Math.floor(((+new Date())-time)/1000);
    if(ago_s<-180) return '将来';
    else if(ago_s<60) return '现在';
    else if(ago_s<3600) return `${Math.floor(ago_s/60)}分钟前`;
    else if(ago_s<86400) return `${Math.floor(ago_s/3600)}小时前`;
    else if(ago_s<86400*7) return `${Math.floor(ago_s/86400)}天${Math.floor((ago_s%86400)/3600)}小时前`;
    else if(ago_s<86400*360) return `${Math.floor(ago_s/86400)}天小时前`;
    else return `${time.getFullYear()}-${time.getMonth()+1}-${time.getDate()}`;
}

let reconnect_timer=null;

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
        else return (+parse_datetime(b.time))-(+parse_datetime(a.time));
    });

    devices.forEach(({ip,position,identifier,time},idx)=>{
        let row_container=document.createElement('div');

        async function do_disconnect() {
            row_container.classList.add('device-disconnect');
            discon_log.textContent='正在断开 '+ip;
            try {
                await ipgw.disconnect(ip);
                discon_log.textContent='已断开 '+ip;

                if(!connected && devices.length===4) {
                    if(reconnect_timer) clearTimeout(reconnect_timer);
                    reconnect_timer=setTimeout(main,500);
                }
            } catch(e) {
                discon_log.textContent=e.message||e;
            }
        }

        let row=_elem('div','',[
            ['class','device-row'+(ip===current_ip ? ' current-device' : '')],
            ['data-key',''+(idx+1)],
        ],[
            ['click',do_disconnect],
        ]);
        let discon_log=_elem('div','',[
            ['class','device-discon-log'],
        ]);
        row_container.appendChild(row);
        row_container.appendChild(discon_log);

        row.appendChild(_elem('kbd',idx+1,[
            ['class','discon-btn'],
            ['title','断开 '+ip],
        ]));
        row.appendChild(_elem('span',display_time(parse_datetime(time)),[
            ['title',time],
            ['class','mg-left'],
        ]));
        row.appendChild(_elem('span',identifier,[
            ['class','mg-left'],
        ]));
        row.appendChild(_elem('span','@'+position,[
            ['class','mg-left'],
        ]));

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

id('ver').textContent=chrome.runtime.getManifest().version;

chrome.commands.getAll((cmds)=>{
    cmds.forEach((cmd)=>{
        if(cmd.name==='_execute_browser_action')
            id('global-shortcut').textContent=cmd.shortcut;
    })
});