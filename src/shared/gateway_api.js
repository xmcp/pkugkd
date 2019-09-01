let ipgw={
    login: (username,password)=>{ // resolve if login success, reject if not
        return fetch('https://its.pku.edu.cn/cas/webLogin',{
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `iprange=yes&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        })
            .then(res=>{
                console.log('login',res);
                if(res.url.indexOf('/netportal')===-1)
                    throw Error('登录失败');
            });
    },

    connect: ()=>{ // resolve ip if connect success, reject if not
        //return fetch(chrome.runtime.getURL('/shared/mock_open.html'))
        return fetch('https://its.pku.edu.cn/netportal/ITSipgw?cmd=open&type=fee')
            .then(res=>res.text())
            .then((src)=>{
                console.log('connect',src);
                let parser=new DOMParser();
                let dom=parser.parseFromString(src,'text/html');

                let table=dom.querySelector('table.ipgw table[noboder]');
                if(!table) throw new Error('无法解析连接状态 table');

                let status_elem=table.querySelector('tr:first-child td:first-child');
                if(!status_elem) throw new Error('无法解析连接状态 status_elem');

                if(status_elem.textContent.indexOf('连接成功')!==-1) { // succ
                    let ip_elem=table.querySelector('table[noborder] tr:nth-child(2) td:nth-child(2)');
                    if(!ip_elem) throw new Error('连接成功，但无法解析 ip_elem');

                    if(ip_elem.textContent.indexOf('10.')!==0) throw new Error('连接成功，但无法解析IP '+ip_elem.textContent);

                    // well done
                    return ip_elem.textContent;
                } else { // failed
                    let status=status_elem.textContent.replace(/\n/g,' ');

                    let reason_elem=table.querySelector('table[noborder] tr:first-child td:first-child');
                    if(!reason_elem) throw new Error(status+'（原因未知）');

                    throw new Error(reason_elem.textContent);
                }
            });
    },

    get_connections: ()=>{
        //return fetch(chrome.runtime.getURL('/shared/mock_conn.html'))
        return fetch('https://its.pku.edu.cn/netportal/ITSipgw?cmd=getconnections')
            .then(res=>res.text())
            .then((src)=>{
                console.log('get_connections',src);
                let parser=new DOMParser();
                let dom=parser.parseFromString(src,'text/html');

                let rows=Array.from(dom.querySelectorAll('table.itsutil tbody tr:not(:first-child)'));
                if(rows.length===0) throw new Error('无法解析设备列表 rows');

                if(rows.length===1 && rows[0].querySelector('td[colspan]')) { // error
                    let msg=rows[0].querySelector('td[colspan]').textContent;
                    if(msg.indexOf('没有网关连接')===-1) throw new Error(msg);
                    return []; // no conn
                }

                return rows.map((row)=>{
                    let [ip,position,identifier,time,_actions]=Array.from(row.querySelectorAll('td')).map((elem)=>elem.textContent);
                    return {
                        ip: ip,
                        position: position,
                        identifier: identifier,
                        time: time,
                    };
                });
            });
    },

    disconnect: (ip)=>{
        return fetch('https://its.pku.edu.cn/netportal/ITSipgw?cmd=disconnect&ip='+encodeURIComponent(ip))
            .then(res=>res.text())
            .then((src)=>{
                console.log('disconnect',src);
                let parser=new DOMParser();
                let dom=parser.parseFromString(src,'text/html');

                let table=dom.querySelector('table.ipgw table[noboder]');
                if(!table) throw new Error('无法解析断开状态 table');

                let status_elem=table.querySelector('tr:first-child td:first-child');
                if(!status_elem) throw new Error('无法解析断开状态 status_elem');

                if(status_elem.textContent.indexOf('断开连接成功')!==-1) // succ
                    return;
                else
                    throw new Error(status_elem.textContent);
            })
    },
};

function parse_datetime(s) { // 2019-08-31 14:42:47
    let res=/^\s*(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)\s*$/.exec(s);
    console.log(s,res);
    if(!res) return null;

    let [_full,y,m,d,H,M,S]=res.map((num)=>parseInt(num,10));
    return new Date(y,m-1,d,H,M,S,0);
}