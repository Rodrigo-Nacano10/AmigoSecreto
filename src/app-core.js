/* ================================================================
   BACKEND: DEMO (localStorage) — cada aba pode ser um usuário diferente
   ================================================================ */
function demoApi(){
  const KEY = 'amigoSecretoDemo.v2', UKEY = 'amigoSecretoDemo.user';
  const subs = new Set();
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { grupos:{}, users:{} }; } catch { return { grupos:{}, users:{} }; } };
  const write = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} subs.forEach(f => f()); };
  addEventListener('storage', e => { if (e.key === KEY) subs.forEach(f => f()); });
  const watch = fn => { const f = () => fn(read()); subs.add(f); setTimeout(f); return () => subs.delete(f); };
  let user = null; try { user = JSON.parse(sessionStorage.getItem(UKEY)); } catch {}
  let authCb = () => {};
  const setUser = u => { user = u; try { u ? sessionStorage.setItem(UKEY, JSON.stringify(u)) : sessionStorage.removeItem(UKEY); } catch {} authCb(u); };
  const fakeEmail = async (email, pw, create) => {
    const d = read(); d.users = d.users || {}; const k = email.trim().toLowerCase();
    if (create){ if (d.users[k]) throw { code:'auth/email-already-in-use' }; d.users[k] = { pw, uid: 'u-' + (await emailId(k)).slice(0,10) }; write(d); }
    else if (!d.users[k] || d.users[k].pw !== pw) throw { code:'auth/invalid-credential' };
    setUser({ uid: d.users[k].uid, email: k, displayName: '' });
  };
  return {
    demo: true,
    onAuth(cb){ authCb = cb; setTimeout(() => cb(user)); },
    signInGoogle: async () => setUser({ uid:'demo-google', email:'anfitriao@demo', displayName:'Anfitrião (demo)' }),
    signInEmail: (e, p) => fakeEmail(e, p, false),
    signUpEmail: (e, p) => fakeEmail(e, p, true),
    resetPassword: async () => {},
    signOut: async () => setUser(null),
    async createGroup(g){
      const d = read(); let id; do { id = newGroupCode(g.nome); } while (d.grupos[id]);
      d.grupos[id] = { ...g, hostUid:user.uid, status:'aberto', criadoEm:Date.now(), participantes:{}, resultados:{}, pares:null }; write(d); return id;
    },
    myHosted(uid, cb){ return watch(d => cb(Object.entries(d.grupos).filter(([,g]) => g.hostUid === uid).map(([id,g]) => ({ id, nome:g.nome, data:g.data, status:g.status, criadoEm:g.criadoEm })).sort((a,b) => b.criadoEm - a.criadoEm))); },
    myJoined(uid, cb){ return watch(d => cb(Object.entries(d.grupos).filter(([,g]) => g.participantes[uid]).map(([id,g]) => ({ id, nome:g.nome, data:g.data, status:g.status, criadoEm:g.participantes[uid].criadoEm })).sort((a,b) => b.criadoEm - a.criadoEm))); },
    watchGroup(gid, cb){ return watch(d => { const g = d.grupos[gid]; cb(g ? { id:gid, nome:g.nome, data:g.data, valor:g.valor, hostUid:g.hostUid, status:g.status } : null); }); },
    watchParticipants(gid, cb){ return watch(d => { const g = d.grupos[gid]; cb(g ? Object.entries(g.participantes).map(([id,p]) => ({ id, ...p })).sort((a,b) => a.criadoEm - b.criadoEm) : []); }); },
    async join(gid, nome){ const d = read(), g = d.grupos[gid]; if (g.status !== 'aberto') throw { code:'closed' }; g.participantes[user.uid] = { nome, criadoEm:Date.now() }; write(d); },
    async removeParticipant(gid, uid){ const d = read(); delete d.grupos[gid].participantes[uid]; write(d); },
    async draw(gid, parts){
      const d = read(), g = d.grupos[gid]; if (g.status !== 'aberto') throw { code:'closed' };
      const ids = parts.map(p => p.id), nm = Object.fromEntries(parts.map(p => [p.id, p.nome])), pairs = derange(ids);
      ids.forEach(id => g.resultados[id] = { amigo: nm[pairs[id]] });
      g.pares = ids.map(id => ({ de:id, deNome:nm[id], para:pairs[id], paraNome:nm[pairs[id]] }));
      g.status = 'sorteado'; write(d);
    },
    async getMine(gid){ const r = read().grupos[gid]?.resultados[user.uid]; if (!r) throw { code:'not-found' }; return r; },
    async markSeen(gid){ const d = read(); const p = d.grupos[gid].participantes[user.uid]; if (p && !p.viu){ p.viu = true; write(d); } },
    async openReveal(gid){ const d = read(), g = d.grupos[gid]; if (g.status === 'sorteado'){ g.status = 'revelacao'; write(d); } return g.pares; },
  };
}

/* ================================================================
   BACKEND: FIREBASE (plano gratuito: Auth + Firestore + Hosting)
   ================================================================ */
async function firebaseApi(cfg){
  const V = '13.3.0', base = `https://www.gstatic.com/firebasejs/${V}`;
  const [{ initializeApp }, A, F] = await Promise.all([import(`${base}/firebase-app.js`), import(`${base}/firebase-auth.js`), import(`${base}/firebase-firestore.js`)]);
  const app = initializeApp(cfg), auth = A.getAuth(app), db = F.getFirestore(app);
  auth.languageCode = 'pt-BR';
  const gref = gid => F.doc(db, 'grupos', gid);
  const err = e => { console.error(e); };
  return {
    demo: false,
    onAuth(cb){ A.onAuthStateChanged(auth, cb); },
    signInGoogle: () => A.signInWithPopup(auth, new A.GoogleAuthProvider()),
    signInEmail: (e, p) => A.signInWithEmailAndPassword(auth, e, p),
    signUpEmail: (e, p) => A.createUserWithEmailAndPassword(auth, e, p),
    resetPassword: e => A.sendPasswordResetEmail(auth, e),
    signOut: () => A.signOut(auth),
    async createGroup(g){
      for (let t = 0; t < 5; t++){
        const id = newGroupCode(g.nome);
        if ((await F.getDoc(gref(id))).exists()) continue;
        await F.setDoc(gref(id), { nome:g.nome, data:g.data || '', valor:g.valor || '', hostUid:auth.currentUser.uid, status:'aberto', criadoEm:F.serverTimestamp() });
        return id;
      }
      throw new Error('Não consegui gerar um código livre, tente de novo.');
    },
    myHosted(uid, cb){
      return F.onSnapshot(F.query(F.collection(db, 'grupos'), F.where('hostUid','==',uid)),
        s => cb(s.docs.map(d => ({ id:d.id, ...d.data(), criadoEm:d.data().criadoEm?.toMillis?.() || 0 })).sort((a,b) => b.criadoEm - a.criadoEm)), e => { err(e); cb([]); });
    },
    myJoined(uid, cb){
      return F.onSnapshot(F.collection(db, 'usuarios', uid, 'grupos'), async s => {
        const out = await Promise.all(s.docs.map(async d => { const g = await F.getDoc(gref(d.id)).catch(() => null);
          return g && g.exists() ? { id:d.id, nome:g.data().nome, data:g.data().data, status:g.data().status, criadoEm:d.data().entrouEm?.toMillis?.() || 0 } : null; }));
        cb(out.filter(Boolean).sort((a,b) => b.criadoEm - a.criadoEm));
      }, e => { err(e); cb([]); });
    },
    watchGroup(gid, cb){ return F.onSnapshot(gref(gid), s => cb(s.exists() ? { id:s.id, ...s.data() } : null), e => { err(e); cb(null); }); },
    watchParticipants(gid, cb){
      return F.onSnapshot(F.query(F.collection(db, 'grupos', gid, 'participantes'), F.orderBy('criadoEm')), s => cb(s.docs.map(d => ({ id:d.id, ...d.data() }))), e => { err(e); cb([]); });
    },
    async join(gid, nome){
      const uid = auth.currentUser.uid, b = F.writeBatch(db);
      b.set(F.doc(db, 'grupos', gid, 'participantes', uid), { nome, criadoEm:F.serverTimestamp() });
      b.set(F.doc(db, 'usuarios', uid, 'grupos', gid), { entrouEm:F.serverTimestamp() });
      try { await b.commit(); }
      catch(e){ const g = await F.getDoc(gref(gid)); if (g.exists() && g.data().status !== 'aberto') throw { code:'closed' }; throw e; }
    },
    async removeParticipant(gid, uid){
      await F.deleteDoc(F.doc(db, 'grupos', gid, 'participantes', uid));
      if (uid === auth.currentUser.uid) await F.deleteDoc(F.doc(db, 'usuarios', uid, 'grupos', gid)).catch(() => {});
    },
    async draw(gid, parts){
      const ids = parts.map(p => p.id), nm = Object.fromEntries(parts.map(p => [p.id, p.nome])), pairs = derange(ids);
      if (ids.length > 480) throw new Error('Grupo grande demais para um sorteio só.');
      const b = F.writeBatch(db);
      ids.forEach(id => b.set(F.doc(db, 'grupos', gid, 'resultados', id), { amigo: nm[pairs[id]] }));
      b.set(F.doc(db, 'grupos', gid, 'revelacao', 'pares'), { pares: ids.map(id => ({ de:id, deNome:nm[id], para:pairs[id], paraNome:nm[pairs[id]] })) });
      b.update(gref(gid), { status:'sorteado', sorteadoEm:F.serverTimestamp(), total:ids.length });
      await b.commit();
    },
    async getMine(gid){ const s = await F.getDoc(F.doc(db, 'grupos', gid, 'resultados', auth.currentUser.uid)); if (!s.exists()) throw { code:'not-found' }; return s.data(); },
    async markSeen(gid){ await F.updateDoc(F.doc(db, 'grupos', gid, 'participantes', auth.currentUser.uid), { viu:true }).catch(err); },
    async openReveal(gid){
      const g = await F.getDoc(gref(gid));
      if (g.data().status === 'sorteado') await F.updateDoc(gref(gid), { status:'revelacao' });
      return (await F.getDoc(F.doc(db, 'grupos', gid, 'revelacao', 'pares'))).data().pares;
    },
  };
}
