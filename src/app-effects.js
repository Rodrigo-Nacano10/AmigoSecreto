/* ================================================================
   SOM + EFEITOS
   ================================================================ */
let SOUND = true; try { SOUND = localStorage.getItem('asSound') !== '0'; } catch {}
let AC = null;
const ac = () => { if (!AC){ try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch {} } return AC; };
function bell(f, t, dur = .6, vol = .18){ const a = ac(); if (!a) return;
  [1,2.76,5.4].forEach((m,i) => { const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = f*m;
    g.gain.setValueAtTime(0, a.currentTime+t); g.gain.linearRampToValueAtTime(vol/(i+1), a.currentTime+t+.01);
    g.gain.exponentialRampToValueAtTime(.0001, a.currentTime+t+dur); o.connect(g).connect(a.destination); o.start(a.currentTime+t); o.stop(a.currentTime+t+dur+.05); }); }
function jingle(){ if (!SOUND) return; const E=659,G=784,C=523,D=587,q=.18; [[E,0],[E,1],[E,2],[E,4],[E,5],[E,6],[E,8],[G,9],[C,10],[D,11],[E,12]].forEach(([f,i]) => bell(f, i*q, .5)); }
function sleigh(){ if (!SOUND) return; for (let i = 0; i < 10; i++) bell(1800 + rand(600), i*.12, .25, .06); }
function ding(){ if (!SOUND) return; bell(1047,0,1.2,.2); bell(1319,.15,1.2,.15); }
window.toggleSound = () => { SOUND = !SOUND; try { localStorage.setItem('asSound', SOUND ? '1' : '0'); } catch {} $('soundBtn').textContent = SOUND ? '🔔' : '🔕'; if (SOUND) ding(); };
function confetti(n = 40){ const em = ['❄️','🎁','⭐','🎄','🔔','🍬','❤️','✨'];
  for (let i = 0; i < n; i++){ const s = document.createElement('div'); s.className = 'confetti'; s.textContent = em[rand(em.length)];
    s.style.left = rand(100)+'vw'; s.style.animationDuration = (2+Math.random()*2.5)+'s'; s.style.animationDelay = (Math.random()*.6)+'s'; s.style.fontSize = (16+rand(18))+'px';
    document.body.appendChild(s); setTimeout(() => s.remove(), 5500); } }
(function snow(){ const c = $('snow'), x = c.getContext('2d'); let W, H, F = [];
  const rs = () => { W = c.width = innerWidth; H = c.height = innerHeight; }; rs(); addEventListener('resize', rs);
  for (let i = 0; i < 110; i++) F.push({ x:Math.random()*W, y:Math.random()*H, r:1+Math.random()*3, s:.4+Math.random()*1.2, w:Math.random()*6 });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  (function f(){ x.clearRect(0,0,W,H); x.fillStyle = 'rgba(255,255,255,.85)';
    for (const p of F){ p.y += p.s; p.w += .02; p.x += Math.sin(p.w)*.5; if (p.y > H){ p.y = -5; p.x = Math.random()*W; } x.beginPath(); x.arc(p.x,p.y,p.r,0,7); x.fill(); }
    requestAnimationFrame(f); })(); })();
$('bulbs').innerHTML = '<span class="bulb"></span>'.repeat(Math.max(10, Math.floor(innerWidth/34)));
$('soundBtn').textContent = SOUND ? '🔔' : '🔕';

