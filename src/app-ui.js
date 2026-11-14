/* ================================================================
   APP
   ================================================================ */
let api, USER = null, GID = new URLSearchParams(location.search).get('g');
let G = null, PARTS = [], unsub = [], REV = null, AUTHMODE = 'in';
const isHost = () => USER && G && G.hostUid === USER.uid;
const meIn = () => USER && PARTS.some(p => p.id === USER.uid);
const inviteUrl = gid => `${location.origin}${location.pathname}?g=${encodeURIComponent(gid)}`;
const show = v => ['vHome','vGroup','vLoading'].forEach(k => $(k).classList.toggle('hidden', k !== v));
const clearSubs = () => { unsub.forEach(f => { try { f(); } catch {} }); unsub = []; };
const AUTH_ERR = {
  'auth/invalid-credential':'E-mail ou senha incorretos.', 'auth/wrong-password':'E-mail ou senha incorretos.', 'auth/user-not-found':'Não achei conta com esse e-mail. Toque em "Criar conta".',
  'auth/email-already-in-use':'Esse e-mail já tem conta. Use "Já tenho conta".', 'auth/weak-password':'A senha precisa de pelo menos 6 caracteres.',
  'auth/invalid-email':'E-mail inválido.', 'auth/too-many-requests':'Muitas tentativas. Espere um pouco e tente de novo.', 'auth/popup-closed-by-user':'Login cancelado.',
};

const App = window.App = {
  openOv: id => $(id).classList.add('show'),
  closeOv: id => $(id).classList.remove('show'),
  goHome(){ history.pushState({}, '', location.pathname); GID = null; route(); },
  openGroup(gid){ history.pushState({}, '', '?g=' + encodeURIComponent(gid)); GID = gid; route(); },

  /* ---- conta ---- */
  authMode(m){ AUTHMODE = m; $('at-in').classList.toggle('on', m === 'in'); $('at-up').classList.toggle('on', m === 'up');
    $('aBtn').textContent = m === 'in' ? 'Entrar' : 'Criar minha conta'; $('aPass').autocomplete = m === 'in' ? 'current-password' : 'new-password'; },
  async signInGoogle(){ try { await api.signInGoogle(); } catch(e){ console.error(e); flash('aMsg','err', AUTH_ERR[e.code] || 'Não consegui entrar com Google.'); } },
  async emailAuth(e){
    e.preventDefault(); const em = $('aEmail').value.trim(), pw = $('aPass').value; $('aBtn').disabled = true;
    try { AUTHMODE === 'in' ? await api.signInEmail(em, pw) : await api.signUpEmail(em, pw); $('aPass').value = ''; }
    catch(err){ console.error(err); flash('aMsg','err', AUTH_ERR[err.code] || 'Não consegui entrar. Tente de novo.'); }
    finally { $('aBtn').disabled = false; }
  },
  async resetPass(){
    const em = $('aEmail').value.trim(); if (!em){ flash('aMsg','err','Digite seu e-mail no campo acima e toque de novo em "Esqueci minha senha".'); return; }
    try { await api.resetPassword(em); flash('aMsg','ok','Pronto! Se existir conta com esse e-mail, chega um link para criar uma senha nova (olhe o spam).', 9000); }
    catch(e){ console.error(e); flash('aMsg','err', AUTH_ERR[e.code] || 'Não consegui enviar o e-mail.'); }
  },
  signOut: () => api.signOut(),

  /* ---- grupo ---- */
  async createGroup(e){
    e.preventDefault(); const nome = $('gNome').value.trim(); if (!nome) return; $('gCreateBtn').disabled = true;
    try { const id = await api.createGroup({ nome, data:$('gData').value, valor:$('gValor').value.trim() });
      $('gNome').value = ''; $('gData').value = ''; $('gValor').value = ''; ding(); App.openGroup(id); }
    catch(err){ console.error(err); flash('gMsg','err','Não deu para criar o grupo. ' + (err.message || '')); }
    finally { $('gCreateBtn').disabled = false; }
  },
  async join(e){
    e.preventDefault(); const nome = $('jNome').value.trim().replace(/\s+/g,' '); if (!nome) return;
    if (PARTS.some(p => p.nome.toLowerCase() === nome.toLowerCase() && p.id !== USER.uid)){ flash('jMsg','err','Já tem alguém com esse nome. Coloque o sobrenome ou um apelido.'); return; }
    $('jBtn').disabled = true;
    try { await api.join(GID, nome); jingle(); confetti(30); }
    catch(err){ console.error(err); flash('jMsg','err', err.code === 'closed' ? 'As inscrições já fecharam: o sorteio foi feito.' : 'Não consegui te inscrever agora. Tente de novo.'); }
    finally { $('jBtn').disabled = false; }
  },
  async leave(){ try { await api.removeParticipant(GID, USER.uid); } catch(e){ console.error(e); } },
  async copyInvite(btn){
    try { await navigator.clipboard.writeText($('inviteLink').value); btn.textContent = 'Copiado ✓'; } catch { $('inviteLink').select(); btn.textContent = 'Selecionado'; }
    setTimeout(() => btn.textContent = 'Copiar', 2000);
  },
  askRemove(uid){
    const p = PARTS.find(x => x.id === uid); if (!p) return; $('rmTitle').textContent = `Remover ${p.nome}?`;
    $('rmYes').onclick = async () => { App.closeOv('ovRemove'); try { await api.removeParticipant(GID, uid); } catch(e){ console.error(e); flash('drawMsg','err','Não consegui remover.'); } };
    App.openOv('ovRemove');
  },
  async draw(){
    if (PARTS.length < 3){ flash('drawMsg','err','Precisa de pelo menos 3 participantes.'); return; }
    const sack = $('sack'), ELVES = ['Os duendes estão misturando os nomes…','Rudolph está conferindo a lista…','Embrulhando com papel dourado…','Guardando cada presente na conta do dono…'];
    sack.classList.add('shake'); $('drawBtn').disabled = true; sleigh();
    let k = 0; const iv = setInterval(() => $('elf').textContent = ELVES[k++ % ELVES.length], 500); const t0 = Date.now();
    try { await api.draw(GID, PARTS.map(p => ({ id:p.id, nome:p.nome })));
      await new Promise(r => setTimeout(r, Math.max(0, 2200 - (Date.now() - t0)))); jingle(); confetti(70); }
    catch(err){ console.error(err); flash('drawMsg','err','O sorteio não rolou: ' + (err.message || err.code || 'erro desconhecido'), 0); $('drawBtn').disabled = false; }
    finally { clearInterval(iv); sack.classList.remove('shake'); $('elf').textContent = 'O saco do Noel está esperando o seu OK!'; }
  },

  /* ---- meu resultado ---- */
  async showMine(){
    try { const r = await api.getMine(GID);
      $('rvHi').textContent = `Olá, ${PARTS.find(p => p.id === USER.uid)?.nome || ''}! 🎅`; $('rvName').textContent = r.amigo;
      const ex = [G.data && '📅 ' + fmtDate(G.data), G.valor && '💰 ' + esc(G.valor)].filter(Boolean).join(' · ');
      $('rvEvent').innerHTML = `🎄 <b>${esc(G.nome)}</b>${ex ? ' · ' + ex : ''}`;
      $('gift').classList.remove('open'); $('rvOpen').classList.add('hidden'); $('rvTap').classList.remove('hidden'); App.openOv('ovMine');
    } catch(e){ console.error(e); flash('jMsg','err','Não achei seu resultado. Você entrou com a mesma conta da inscrição?'); }
  },
  openGift(){ if ($('gift').classList.contains('open')) return; $('gift').classList.add('open'); $('rvTap').classList.add('hidden');
    setTimeout(() => { $('rvOpen').classList.remove('hidden'); jingle(); confetti(25); api.markSeen(GID); }, 350); },
  closeMine(){ $('rvName').textContent = ''; App.closeOv('ovMine'); },

  /* ---- dia da revelação ---- */
  async loadReveal(){
    try { const pairs = await api.openReveal(GID); REV = { map:{}, names:{}, done:{}, log:[], cur:null, phase:'pick', last:null };
      pairs.forEach(p => { REV.map[p.de] = p.para; REV.names[p.de] = p.deNome; REV.names[p.para] = p.paraNome; });
      $('dayCard').classList.remove('hidden'); renderDay(); $('dayCard').scrollIntoView({ behavior:'smooth' }); }
    catch(e){ console.error(e); flash('drawMsg','err','Não consegui abrir a revelação: ' + (e.message || '')); }
  },
  pickStarter(id){ REV.cur = id; REV.phase = 'turn'; REV.log.push({ sep:true }); ding(); renderDay(); },
  randomStarter(){ const left = Object.keys(REV.map).filter(p => !REV.done[p]); App.pickStarter(left[rand(left.length)]); },
  doReveal(){ REV.phase = 'drum'; renderDay(); sleigh();
    setTimeout(() => { const g = REV.cur, r = REV.map[g]; REV.done[g] = true; REV.log.push({ g, r }); REV.last = { g, r };
      const all = Object.keys(REV.map).every(p => REV.done[p]); REV.phase = all ? 'end' : (REV.done[r] ? 'closed' : 'next');
      renderDay(); jingle(); confetti(all ? 80 : 30); }, 1800); },
  nextTurn(){ REV.cur = REV.last.r; REV.phase = 'turn'; renderDay(); },
  toPick(){ REV.phase = 'pick'; renderDay(); },
  restartRev(){ const m = REV.map, n = REV.names; REV = { map:m, names:n, done:{}, log:[], cur:null, phase:'pick', last:null }; renderDay(); },
};

/* ---------------- telas ---------------- */
function renderAuth(context){
  $('authCard').classList.toggle('hidden', !!USER);
  $('authTitle').textContent = context === 'group' ? 'Entre para participar' : 'Entrar';
  $('authHint').textContent = context === 'group'
    ? 'Crie sua conta (ou entre com Google). É nela que seu amigo secreto vai aparecer depois do sorteio.'
    : 'Entre para ver seus amigos secretos ou para organizar um grupo.';
  $('userbar').classList.toggle('hidden', !USER);
  if (USER) $('userName').textContent = '🎅 ' + (USER.displayName || USER.email || 'Você');
}

function route(){
  clearSubs(); G = null; PARTS = []; REV = null; $('dayCard').classList.add('hidden'); $('gBanner').classList.add('hidden');
  renderAuth(GID ? 'group' : 'home');
  if (!GID){
    show('vHome'); $('homeIn').classList.toggle('hidden', !USER);
    if (USER){ unsub.push(api.myHosted(USER.uid, renderHosted)); unsub.push(api.myJoined(USER.uid, renderJoined)); }
    return;
  }
  show('vLoading');
  unsub.push(api.watchGroup(GID, g => {
    if (!g){ $('gBanner').classList.add('hidden'); show('vLoading'); $('vLoading').innerHTML = `<div class="card center"><div style="font-size:48px">🦌❓</div><h2>Grupo não encontrado</h2><p class="hint" style="padding:0">Confira o link de convite com quem te chamou.</p></div>`; return; }
    G = g; show('vGroup'); renderGroup();
  }));
  unsub.push(api.watchParticipants(GID, p => { PARTS = p; renderGroup(); }));
}

const tile = (g, extra) => `<button class="gtile" onclick="App.openGroup('${esc(g.id)}')"><span class="gi">${g.status === 'aberto' ? '🎄' : '🎁'}</span>
  <span><b>${esc(g.nome)}</b><small>${esc(g.id)}${g.data ? ' · ' + fmtDate(g.data) : ''}</small></span>${extra}</button>`;
function renderHosted(list){
  $('myGroups').innerHTML = list.length ? list.map(g => tile(g, `<span class="pill ${g.status === 'aberto' ? 'open' : 'done'}">${g.status === 'aberto' ? 'inscrições abertas' : 'sorteado'}</span>`)).join('')
    : '<p class="hint" style="padding:0">Nenhum grupo ainda. Crie o primeiro aí em cima! ⛄</p>';
}
function renderJoined(list){
  $('myJoined').innerHTML = list.length ? list.map(g => tile(g, `<span class="pill ${g.status === 'aberto' ? 'open' : 'done'}">${g.status === 'aberto' ? 'aguardando sorteio' : '🎁 ver meu amigo'}</span>`)).join('')
    : '<p class="hint" style="padding:0">Você ainda não está em nenhum grupo. Peça o link de convite para o anfitrião! 📨</p>';
}

function renderGroup(){
  if (!G) return;
  const open = G.status === 'aberto', host = isHost(), mine = meIn(), me = PARTS.find(p => p.id === USER?.uid);
  $('gBanner').classList.remove('hidden');
  $('gTitle').textContent = G.nome;
  $('gKicker').textContent = host ? 'Seu grupo de amigo secreto' : 'Você foi convidado para o amigo secreto';
  $('gInfo').innerHTML = [G.data && '📅 ' + fmtDate(G.data), G.valor && '💰 ' + esc(G.valor), `${PARTS.length} participante${PARTS.length === 1 ? '' : 's'}`].filter(Boolean).join(' · ');

  $('joinCard').classList.toggle('hidden', !USER || !open || mine);
  if (USER && !$('jNome').value && USER.displayName) $('jNome').value = USER.displayName;
  $('joinedCard').classList.toggle('hidden', !open || !mine);
  if (mine) $('joinedTxt').innerHTML = `🎉 Você está dentro, ${esc(me.nome)}!<br><span style="font-weight:600">Quando o anfitrião der o OK, volte aqui (ou em 🏠 Início) com esta mesma conta para ver seu amigo secreto.</span>`;
  $('resultCard').classList.toggle('hidden', open || !mine);
  if (mine && !open) $('resultHint').textContent = me.viu ? 'Você já abriu, mas pode ver de novo quando quiser.' : 'Toque no presente para abrir. Confira longe dos curiosos!';
  $('drawnCard').classList.toggle('hidden', open || mine || host);

  $('pCount').textContent = PARTS.length;
  $('pPublic').innerHTML = PARTS.length ? PARTS.map(p => `<li>${orn(p.nome)}<span class="nmw">${esc(p.nome)}</span></li>`).join('')
    : '<li style="background:none;color:var(--muted);font-weight:600;justify-content:center">Ninguém ainda. Seja o primeiro! ⛄</li>';
  $('whoCard').classList.toggle('hidden', host);

  $('adminArea').classList.toggle('hidden', !host);
  if (!host) return;
  $('inviteLink').value = inviteUrl(GID);
  $('waInvite').href = 'https://wa.me/?text=' + encodeURIComponent(`🎅 Ho ho ho! Você foi convidado para o Amigo Secreto *${G.nome}*!${G.data ? `\n📅 Troca: ${fmtDate(G.data)}` : ''}${G.valor ? `\n💰 Valor: ${G.valor}` : ''}\n\nEntre, crie sua conta e se inscreva:\n${inviteUrl(GID)}`);
  $('adminHint').textContent = open ? 'Remova quem entrou por engano antes de sortear.' : 'Quem já abriu o presente aparece com ✓.';
  $('pAdmin').innerHTML = PARTS.length ? PARTS.map(p => `<li>${orn(p.nome)}<span class="nmw">${esc(p.nome)}${p.id === USER.uid ? ' <small style="color:var(--muted)">(você)</small>' : ''}</span>${open
      ? `<button class="x" aria-label="Remover" onclick="App.askRemove('${p.id}')">×</button>`
      : `<span class="st" style="color:${p.viu ? 'var(--green)' : 'var(--muted)'}">${p.viu ? '✓ já viu' : 'ainda não viu'}</span>`}</li>`).join('')
    : '<li style="background:none;color:var(--muted);font-weight:600;justify-content:center">Ninguém inscrito ainda. Mande o convite! 📨</li>';
  $('drawCard').classList.toggle('hidden', !open);
  $('drawBtn').disabled = PARTS.length < 3;
  $('drawBtn').textContent = PARTS.length < 3 ? `✅ Faltam ${3 - PARTS.length} para sortear` : `✅ Dar OK e sortear (${PARTS.length})`;
  $('ovDrawTxt').textContent = `${PARTS.length} pessoas entram no sorteio. Cada uma vê o seu amigo secreto na própria conta, e as inscrições fecham.`;
  $('postDrawCard').classList.toggle('hidden', open);
  if (!open){ const seen = PARTS.filter(p => p.viu).length; $('seenSummary').textContent = `${seen} de ${PARTS.length} já abriram o presente. Avise a turma para entrar no site com a conta da inscrição.`;
    $('revealBtn').textContent = G.status === 'revelacao' ? '🔔 Continuar o Dia da Revelação' : '🔔 Abrir o Dia da Revelação';
    $('revealBtn').onclick = G.status === 'revelacao' ? () => App.loadReveal() : () => App.openOv('ovReveal'); }
}

function renderDay(){
  const box = $('dayCard'), R = REV, ids = Object.keys(R.map), n = ids.length, done = Object.keys(R.done).length, nm = id => esc(R.names[id]);
  let h = `<h2>Dia da Revelação 🔔</h2><div class="progress"><div style="width:${done/n*100}%"></div></div><p class="hint" style="padding:0">${done} de ${n} já revelaram</p><div class="stage">`;
  if (R.phase === 'pick'){
    h += `<div class="turn">${done ? 'Quem recomeça a corrente?' : 'Quem começa?'}</div><div class="plist" style="text-align:left">${ids.filter(p => !R.done[p]).map(p => `<button class="pbtn" onclick="App.pickStarter('${p}')">${orn(R.names[p])}<span>${nm(p)}</span></button>`).join('')}</div>
      <button class="btn gold full" style="margin-top:12px" onclick="App.randomStarter()">🎲 Papai Noel escolhe</button>`;
  } else if (R.phase === 'turn'){
    h += `<div style="font-size:54px">🎅</div><div class="turn">Vez de<br>${nm(R.cur)}!</div><p class="hint" style="padding:0">Dê umas dicas do seu amigo secreto antes… e depois revele!</p><button class="btn big red full" onclick="App.doReveal()">🎁 Revelar quem ${nm(R.cur)} tirou</button>`;
  } else if (R.phase === 'drum'){
    h += `<div style="font-size:54px">🥁</div><div class="turn">${nm(R.cur)} tirou…</div><div class="drum">Os duendes estão tocando o tambor…</div>`;
  } else {
    const { g, r } = R.last;
    h += `<div class="turn" style="margin-bottom:0">${nm(g)} tirou</div><div class="arrow">⬇️🎁</div><div class="bigname">${nm(r)}</div>`;
    if (R.phase === 'next') h += `<button class="btn big green full" style="margin-top:12px" onclick="App.nextTurn()">Agora é a vez de ${nm(r)} ➜</button>`;
    if (R.phase === 'closed') h += `<div class="closed">🔒 A corrente fechou! ${nm(r)} já tinha revelado.<br>Escolham outra pessoa para recomeçar.</div><button class="btn big gold full" onclick="App.toPick()">🔔 Escolher quem recomeça</button>`;
    if (R.phase === 'end') h += `<div class="closed" style="background:#e2f4e8;border-color:var(--green);color:var(--green)">🎄 Todo mundo revelou! Feliz Natal e boas festas! 🎄</div>`;
  }
  h += '</div>';
  if (R.log.some(x => !x.sep)){ let c = 0;
    h += `<ul class="log">${R.log.map((x,i) => x.sep ? (i === R.log.length-1 || R.log[i+1]?.sep ? '' : `<li class="sep">⭐ Corrente ${++c} ⭐</li>`) : `<li>${orn(R.names[x.g])}${nm(x.g)}<span class="ar">🎁➜</span>${nm(x.r)}</li>`).join('')}</ul>`; }
  h += `<button class="btn ghost full" style="margin-top:14px" onclick="App.restartRev()">↺ Recomeçar a revelação</button>`;
  box.innerHTML = h;
}

/* ---------------- início ---------------- */
const configured = firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith('COLE');
try { api = configured ? await firebaseApi(firebaseConfig) : demoApi(); }
catch(e){ console.error('Falha ao carregar o Firebase, usando demo', e); api = demoApi(); }
$('demoBanner').classList.toggle('hidden', !api.demo);
addEventListener('popstate', () => { GID = new URLSearchParams(location.search).get('g'); route(); });
api.onAuth(u => { USER = u; route(); });
