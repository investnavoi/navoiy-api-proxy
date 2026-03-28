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

function normalizeMessageText(value){
  return String(value||'')
    .toLowerCase()
    .replace(/\s+/g,' ')
    .trim();
}

function getUserName(user){
  return ((user?.firstName||'')+' '+(user?.lastName||'')).trim();
}

function getUserId(user){
  if(!user || user.id===undefined || user.id===null) return '';
  try { return String(user.id); } catch(_e){ return ''; }
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

async function resolveTargetUser(client, Api, users, target){
  let user = null;
  const peerId = String(target?.tgPeerId||'').trim();
  if(peerId){
    user = (users||[]).find((item)=>getUserId(item)===peerId) || null;
  }
  if(!user && target?.phone){
    user = findContactByPhone(users, cleanPhone(target.phone));
  }
  if(!user && target?.name){
    user = findContactByName(users, target.name);
  }
  if(user) return user;
  if(target?.name){
    try {
      const searchResult = await client.invoke(new Api.contacts.Search({q:String(target.name), limit:10}));
      user = findContactByPhone(searchResult.users, cleanPhone(target.phone)) ||
        findContactByName(searchResult.users, target.name);
      if(user) return user;
    } catch(_searchError){}
  }
  return null;
}

function isSelfTarget(target, me){
  if(!target || !me) return false;
  const targetPeerId = String(target?.tgPeerId || '').trim();
  const meId = getUserId(me);
  if(targetPeerId && meId && targetPeerId === meId) return true;

  const targetPhone = normalizeDigits(cleanPhone(target?.phone || ''));
  const mePhone = normalizeDigits(me?.phone || '');
  if(targetPhone && mePhone && (targetPhone === mePhone || targetPhone.endsWith(mePhone.slice(-9)))) return true;

  const targetName = normalizeName(target?.name || '');
  const meName = normalizeName(getUserName(me));
  const meUser = normalizeName(me?.username || '');
  if(targetName && ((meName && (targetName === meName || targetName.includes(meName) || meName.includes(targetName))) || (meUser && (targetName === meUser || targetName.includes(meUser))))) return true;
  return false;
}

async function fetchMessagesForUser(client, user, isSelf){
  let messages = [];
  if(isSelf){
    try {
      messages = await client.getMessages('me', {limit:20});
    } catch(_selfError){}
    if(Array.isArray(messages) && messages.length) return messages;
    try {
      const selfEntity = await client.getEntity('me');
      messages = await client.getMessages(selfEntity, {limit:20});
    } catch(_selfEntityError){}
    if(Array.isArray(messages) && messages.length) return messages;
  }
  try {
    messages = await client.getMessages(user, {limit:12});
  } catch(_firstError){
    try {
      messages = await client.getMessages(user.id, {limit:12});
    } catch(_secondError){
      try {
        const entity = await client.getEntity(user.id);
        messages = await client.getMessages(entity, {limit:12});
      } catch(_thirdError){
        messages = [];
      }
    }
  }
  if(Array.isArray(messages)) return messages;
  try { return Array.from(messages || []); } catch(_e){ return []; }
}

async function handleReplies(req, res, body){
  const apiId=parseInt(process.env.TG_API_ID||'0',10);
  const apiHash=process.env.TG_API_HASH||'';
  const sessionStr=process.env.TG_SESSION||'';
  if(!apiId||!apiHash||!sessionStr){
    return res.status(200).json({ok:false,error:'TG env kerak'});
  }

  const targets = Array.isArray(body?.targets) ? body.targets.filter(Boolean) : [];
  if(!targets.length){
    return res.status(200).json({ok:true,replies:[]});
  }

  let client = null;
  let connected = false;
  try {
    const {TelegramClient} = await import('telegram');
    const {StringSession} = await import('telegram/sessions/index.js');
    const {Api} = await import('telegram/tl/index.js');

    client = new TelegramClient(new StringSession(sessionStr), apiId, apiHash, {connectionRetries:3});
    await client.connect();
    connected = true;
    let me = null;
    try { me = await client.getMe(); } catch(_meError){}

    let contactsUsers = [];
    try {
      const contacts = await client.invoke(new Api.contacts.GetContacts({hash:BigInt(0)}));
      contactsUsers = contacts.users || [];
    } catch(_contactsError){}

    const replies = [];

    for(const target of targets){
      let user = await resolveTargetUser(client, Api, contactsUsers, target);
      const selfTarget = isSelfTarget(target, me);
      if(!user && selfTarget && me){
        user = me;
      }
      if(!user){
        replies.push({
          id: target?.id || '',
          replied: false,
          found: false
        });
        continue;
      }

      const sinceTs = target?.since ? new Date(target.since).getTime() : 0;
      const sinceBufferTs = sinceTs ? Math.max(0, sinceTs - (2 * 60 * 1000)) : 0;
      const sentMessageNormalized = normalizeMessageText(target?.sentMessage || '');
      const messages = await fetchMessagesForUser(client, user, selfTarget);
      const recentMessages = (messages||[])
        .filter((message)=>!!message)
        .filter((message)=>{
          const messageTs = message?.date ? new Date(message.date).getTime() : 0;
          return !sinceBufferTs || (messageTs && messageTs > sinceBufferTs);
        })
        .sort((a,b)=>{
          const aTs = a?.date ? new Date(a.date).getTime() : 0;
          const bTs = b?.date ? new Date(b.date).getTime() : 0;
          return bTs - aTs;
        });

      const inbound = selfTarget
        ? recentMessages.filter((message)=>{
            const text = normalizeMessageText(message?.message || message?.text || '');
            if(!sentMessageNormalized) return true;
            return text && text !== sentMessageNormalized;
          })
        : recentMessages.filter((message)=>message.out !== true);

      const latest = inbound[0] || null;
      if(!latest){
        replies.push({
          id: target?.id || '',
          replied: false,
          found: true,
          peerId: getUserId(user),
          user: getUserName(user),
          username: user?.username || '',
          selfTarget: !!selfTarget
        });
        continue;
      }

      const text = String(latest.message || latest.text || '').trim() || '[Media xabar]';
      replies.push({
        id: target?.id || '',
        replied: true,
        found: true,
        text,
        date: latest?.date ? new Date(latest.date).toISOString() : '',
        peerId: getUserId(user),
        user: getUserName(user),
        username: user?.username || '',
        phone: user?.phone ? ('+' + String(user.phone).replace(/\D/g,'')) : cleanPhone(target?.phone || ''),
        selfTarget: !!selfTarget
      });
    }

    return res.status(200).json({ok:true,replies});
  } catch(error){
    return res.status(200).json({
      ok:false,
      error:error?.message || 'Telegram reply check xatosi'
    });
  } finally {
    if(client && connected){
      try { await client.disconnect(); } catch(_disconnectError){}
    }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();

  const body = typeof req.body==='string'
    ? (()=>{ try { return JSON.parse(req.body); } catch(_e){ return {}; } })()
    : (req.body || {});

  const mode = String(req.query?.mode || body?.mode || '').trim().toLowerCase();
  if(req.method==='POST' && mode==='replies'){
    return handleReplies(req, res, body);
  }

  return res.json({
    ready:!!(process.env.TG_SESSION&&process.env.TG_API_ID&&process.env.TG_API_HASH),
    hasSession:!!process.env.TG_SESSION,
    hasApiId:!!process.env.TG_API_ID
  });
}
