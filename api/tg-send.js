function cleanPhone(p){
  let raw=String(p||'').trim();
  if(!raw) return '';
  let ph=raw.replace(/[\s\-\(\)]/g,'');
  if(ph.startsWith('00')) ph='+'+ph.slice(2);
  if(ph.startsWith('+')) return ph.replace(/^\+998998/,'+998');
  const digits=ph.replace(/\D/g,'');
  if(!digits) return '';
  if(digits.length===9) return ('+998'+digits).replace(/^\+998998/,'+998');
  if(digits.length===12 && digits.startsWith('998')) return ('+'+digits).replace(/^\+998998/,'+998');
  if(digits.length>=10) return '+'+digits;
  return '+'+digits;
}

function normalizeDigits(value){
  return String(value||'').replace(/\D/g,'');
}

function normalizeName(value){
  return String(value||'')
    .toLowerCase()
    .replace(/[_\-]+/g,' ')
    .replace(/[^\p{L}\p{N}\s]/gu,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function detectErrorCode(errorText){
  const raw=String(errorText||'').toUpperCase();
  if(raw.includes('PEER_FLOOD')) return 'PEER_FLOOD';
  if(raw.includes('FLOOD_WAIT')) return 'FLOOD_WAIT';
  if(raw.includes('PHONE_NOT_OCCUPIED')) return 'PHONE_NOT_OCCUPIED';
  if(raw.includes('USER_PRIVACY_RESTRICTED')) return 'USER_PRIVACY_RESTRICTED';
  if(raw.includes('CHAT_WRITE_FORBIDDEN')) return 'CHAT_WRITE_FORBIDDEN';
  if(raw.includes('USER_IS_BLOCKED')) return 'USER_IS_BLOCKED';
  if(raw.includes('INPUT_USER_DEACTIVATED')) return 'INPUT_USER_DEACTIVATED';
  return '';
}

function parseRetryAfterSec(errorText){
  const raw=String(errorText||'');
  let match=raw.match(/FLOOD_WAIT_?(\d+)/i);
  if(match) return parseInt(match[1],10)||0;
  match=raw.match(/(\d+)\s*(seconds?|sec|s)\b/i);
  if(match) return parseInt(match[1],10)||0;
  match=raw.match(/retry\s+after\s+(\d+)/i);
  if(match) return parseInt(match[1],10)||0;
  return 0;
}

function findContactByPhone(users, phone){
  const digits=normalizeDigits(phone);
  return (users||[]).find((user)=>{
    const userDigits=normalizeDigits(user.phone||'');
    if(!userDigits) return false;
    return userDigits===digits || digits.endsWith(userDigits.slice(-9));
  }) || null;
}

function findContactByName(users, name){
  const target=normalizeName(name);
  if(!target || target.length < 3) return null;
  const targetCompact=target.replace(/\s+/g,'');

  const exact = (users||[]).find((user)=>{
    const fullName=normalizeName(((user.firstName||'')+' '+(user.lastName||'')).trim());
    const firstOnly=normalizeName(user.firstName||'');
    const username=normalizeName(user.username||'').replace(/\s+/g,'');
    return fullName===target || firstOnly===target || (username && username===targetCompact);
  });
  if(exact) return exact;

  return (users||[]).find((user)=>{
    const fullName=normalizeName(((user.firstName||'')+' '+(user.lastName||'')).trim());
    const username=normalizeName(user.username||'').replace(/\s+/g,'');
    return (fullName && (fullName.includes(target) || target.includes(fullName))) ||
      (username && (username.includes(targetCompact) || targetCompact.includes(username)));
  }) || null;
}

function findBestContact(users, phone, name){
  return findContactByPhone(users, phone) || findContactByName(users, name) || null;
}

function getUserName(user){
  return ((user?.firstName||'')+' '+(user?.lastName||'')).trim();
}

const CONTACT_IMPORTED_CODE = 'CONTACT_IMPORTED';
const CONTACT_IMPORTED_WAIT_SEC = 15 * 60;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});

  let client=null;
  let connected=false;

  try {
    const body = typeof req.body==='string' ? JSON.parse(req.body) : req.body;
    const {phone,message,firstName='Tadbirkor'} = body||{};
    if(!phone||!message) return res.json({ok:false,error:'phone va message kerak'});

    const apiId=parseInt(process.env.TG_API_ID||'0',10);
    const apiHash=process.env.TG_API_HASH||'';
    const sessionStr=process.env.TG_SESSION||'';
    if(!apiId||!apiHash||!sessionStr) return res.json({ok:false,error:'TG env kerak'});

    const {TelegramClient} = await import('telegram');
    const {StringSession} = await import('telegram/sessions/index.js');
    const {Api} = await import('telegram/tl/index.js');

    const ph = cleanPhone(phone);
    client = new TelegramClient(new StringSession(sessionStr),apiId,apiHash,{connectionRetries:3});
    await client.connect();
    connected=true;

    let sent=false;
    let userName='';
    let lastError='';
    let errorCode='';
    let retryAfterSec=0;
    let contactSource='';

    try {
      let existingUser=null;
      try {
        const contacts = await client.invoke(new Api.contacts.GetContacts({hash:BigInt(0)}));
        existingUser = findBestContact(contacts.users, ph, firstName);
      } catch(_contactsError) {}

      if(existingUser){
        userName = getUserName(existingUser);
        await client.sendMessage(existingUser.id,{message});
        sent=true;
        contactSource = findContactByPhone([existingUser], ph) ? 'existing-phone' : 'existing-name';
      } else {
        const imp = await client.invoke(new Api.contacts.ImportContacts({
          contacts:[new Api.InputPhoneContact({
            clientId:BigInt(Date.now()),
            phone:ph,
            firstName,
            lastName:''
          })]
        }));
        if(imp.users?.length){
          userName = getUserName(imp.users[0]);
          contactSource='imported';
          lastError='Kontakt Telegram akkauntga saqlandi. Spam himoyasi sabab shu raqamga birozdan keyin yana yuboring.';
          errorCode=CONTACT_IMPORTED_CODE;
          retryAfterSec=CONTACT_IMPORTED_WAIT_SEC;
        } else {
          let importedUser=null;
          try {
            const refreshedContacts = await client.invoke(new Api.contacts.GetContacts({hash:BigInt(0)}));
            importedUser = findBestContact(refreshedContacts.users, ph, firstName);
          } catch(_refreshContactsError) {}

          if(!importedUser && firstName){
            try {
              const searchResult = await client.invoke(new Api.contacts.Search({q:firstName, limit:10}));
              importedUser = findBestContact(searchResult.users, ph, firstName);
              if(importedUser) contactSource='search-name';
            } catch(_searchError) {}
          }

          if(importedUser){
            userName = getUserName(importedUser);
            if(!contactSource) contactSource = findContactByPhone([importedUser], ph) ? 'imported-contact-phone' : 'imported-contact-name';
            lastError='Kontakt Telegram akkauntga saqlandi. Spam himoyasi sabab shu raqamga birozdan keyin yana yuboring.';
            errorCode=CONTACT_IMPORTED_CODE;
            retryAfterSec=CONTACT_IMPORTED_WAIT_SEC;
          } else {
            lastError='Telegram topilmadi';
          }
        }
      }
    } catch(e){
      lastError=e?.errorMessage||e?.message||'Telegram xatosi';
      errorCode=detectErrorCode(lastError);
      retryAfterSec=parseRetryAfterSec(lastError);
    }

    if(sent){
      return res.json({
        ok:true,
        phone:ph,
        user:userName,
        method:'mtproto',
        contactSource
      });
    }

    if(!errorCode) errorCode=detectErrorCode(lastError);
    if(!retryAfterSec) retryAfterSec=parseRetryAfterSec(lastError);

    return res.json({
      ok:false,
      phone:ph,
      error:lastError||'Telegram yuborishda xato',
      code:errorCode,
      retryAfterSec,
      isPeerFlood:errorCode==='PEER_FLOOD',
      isFloodWait:errorCode==='FLOOD_WAIT',
      shouldStopBatch:errorCode==='PEER_FLOOD'||errorCode==='FLOOD_WAIT'
    });
  } catch(e) {
    const lastError=e?.message||'Telegram server xatosi';
    const errorCode=detectErrorCode(lastError);
    const retryAfterSec=parseRetryAfterSec(lastError);
    return res.json({
      ok:false,
      error:lastError,
      code:errorCode,
      retryAfterSec,
      isPeerFlood:errorCode==='PEER_FLOOD',
      isFloodWait:errorCode==='FLOOD_WAIT',
      shouldStopBatch:errorCode==='PEER_FLOOD'||errorCode==='FLOOD_WAIT'
    });
  } finally {
    if(client && connected){
      try { await client.disconnect(); } catch(_disconnectError) {}
    }
  }
}
