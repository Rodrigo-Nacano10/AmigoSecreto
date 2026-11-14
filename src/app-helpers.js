/* ================================================================
   Amigo Secreto de Natal — front-end
   Backend: Firebase (Auth Google + Firestore + Cloud Functions).
   Sem configuração => MODO DEMONSTRAÇÃO (localStorage, sem e-mails).
   ================================================================ */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ORN = ['#c8102e','#1b6b3a','#f2c14e','#2a6fdb','#8a2be2','#e0663a','#0f8a8a','#d63384'];
const colorOf = n => { let h = 0; for (const c of n) h = (h*31 + c.charCodeAt(0)) >>> 0; return ORN[h % ORN.length]; };
const ini = n => n.trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase();
const orn = n => `<span class="orn"><i style="background:${colorOf(n)}">${esc(ini(n))}</i></span>`;
const rand = n => Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * n);
const fmtDate = d => { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; };
function flash(id, kind, txt, ms = 5000){ const m = $(id); m.className = 'msg ' + kind; m.textContent = txt; clearTimeout(m._t); if (ms) m._t = setTimeout(() => m.className = 'msg', ms); }
async function emailId(email){
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.trim().toLowerCase()));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('').slice(0, 24);
}
function newGroupCode(nome){
  const base = nome.normalize('NFD').replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,8) || 'NATAL';
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = '';
  for (let i = 0; i < 4; i++) s += abc[rand(abc.length)];
  return `${base}-${s}`;
}

/* ---------------- sorteio (mesma regra da Cloud Function) ---------------- */
const maxLoops = n => 2 * Math.ceil(n / 15);
function countLoops(p){ const seen = new Set(); let c = 0; for (const k of Object.keys(p)){ if (seen.has(k)) continue; c++; let x = k; while (!seen.has(x)){ seen.add(x); x = p[x]; } } return c; }
function derange(ids){
  const lim = maxLoops(ids.length);
  for(;;){
    const r = [...ids]; for (let i = r.length-1; i > 0; i--){ const j = rand(i+1); [r[i], r[j]] = [r[j], r[i]]; }
    if (r.some((x,i) => x === ids[i])) continue;
    const out = {}; ids.forEach((g,i) => out[g] = r[i]);
    if (countLoops(out) <= lim) return out;
  }
}

