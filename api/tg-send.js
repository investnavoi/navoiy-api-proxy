function cleanPhone(p){let ph=(p||'').replace(/[\s\-\(\)]/g,'');if(!ph.startsWith('+')&&!ph.startsWith('998'))ph='+998'+ph;if(!ph.startsWith('+'))ph='+'+ph;return ph.replace(/^\+998998/,'+998');}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});
  
  try {
    const body = typeof req.body==='string'?JSON.parse(req.body):req.body;
    const {phone,message,firstName='Tadbirkor'} = body;
    if(!phone||!message) return res.json({error:'phone va message kerak'});
    
    const apiId=parseInt(process.env.TG_API_ID||'0');
    const apiHash=process.env.TG_API_HASH||'';
    const sessionStr=process.env.TG_SESSION||'';
    if(!apiId||!apiHash||!sessionStr) return res.json({error:'TG env kerak'});

    const {TelegramClient} = await import('telegram');
    const {StringSession} = await import('telegram/sessions/index.js');
    const {Api} = await import('telegram/tl/index.js');
    
    const client = new TelegramClient(new StringSession(sessionStr),apiId,apiHash,{connectionRetries:3});
    await client.connect();
    const ph = cleanPhone(phone);
    let sent=false, userName='', lastError='';

    try {
      const imp = await client.invoke(new Api.contacts.ImportContacts({contacts:[new Api.InputPhoneContact({clientId:BigInt(Date.now()),phone:ph,firstName,lastName:''})]}));
      if(imp.users?.length){
        userName=((imp.users[0].firstName||'')+' '+(imp.users[0].lastName||'')).trim();
        await new Promise(r=>setTimeout(r,2000));
        await client.sendMessage(imp.users[0].id,{message});
        sent=true;
      } else lastError='Telegram topilmadi';
    } catch(e){
      lastError=e.errorMessage||e.message;
      if(lastError==='PEER_FLOOD'){
        try{
          const c=await client.invoke(new Api.contacts.GetContacts({hash:BigInt(0)}));
          const d=ph.replace(/\D/g,'');
          const f=c.users?.find(u=>{const up=(u.phone||'').replace(/\D/g,'');return up===d||d.endsWith(up.slice(-9));});
          if(f){userName=((f.firstName||'')+' '+(f.lastName||'')).trim();await client.sendMessage(f.id,{message});sent=true;lastError='';}
        }catch(e2){lastError='PEER_FLOOD';}
      }
    }
    await client.disconnect();
    res.json(sent?{ok:true,phone:ph,user:userName}:{ok:false,phone:ph,error:lastError});
  } catch(e) {
    res.json({error:e.message});
  }
}
