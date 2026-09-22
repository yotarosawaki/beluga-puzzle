(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.querySelector('#score');
  const overlay = document.querySelector('#gameover');
  const finalScore = document.querySelector('#final-score');
  const W = 390, H = 620, FLOOR = 604, DROP_Y = 55;
  const types = [
    { r: 18, color: '#d9f8fa', name: '縺ｷ縺｡' }, { r: 27, color: '#a5e9ee', name: '縺｡縺ｳ' },
    { r: 39, color: '#71d0dc', name: '縺ｵ繧・ }, { r: 55, color: '#38a9be', name: '縺ｩ繝ｼ繧・ },
    { r: 74, color: '#14728e', name: '邇区ｧ・ }
  ];
  let whales, next, score, gameOver, lastTime, dangerTime, pointerX, cooldown;
  const randomType = () => Math.random() < .72 ? (Math.random() < .57 ? 0 : 1) : 2;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function reset() {
    whales = []; score = 0; gameOver = false; dangerTime = 0; cooldown = 0; pointerX = W / 2;
    next = randomType(); scoreEl.textContent = score; overlay.hidden = true; lastTime = performance.now();
  }
  function drop() {
    if (gameOver || cooldown > 0) return;
    const t = next, r = types[t].r;
    whales.push({ x: clamp(pointerX, r + 5, W - r - 5), y: DROP_Y, vx: 0, vy: 0, type: t, merging: false });
    next = randomType(); cooldown = 450;
  }
  function update(dt) {
    cooldown -= dt;
    for (const a of whales) { a.vy += 0.00068 * dt; a.x += a.vx * dt; a.y += a.vy * dt; a.vx *= .998; }
    for (const a of whales) {
      const r = types[a.type].r;
      if (a.x - r < 0) { a.x = r; a.vx = Math.abs(a.vx) * .32; }
      if (a.x + r > W) { a.x = W - r; a.vx = -Math.abs(a.vx) * .32; }
      if (a.y + r > FLOOR) { a.y = FLOOR - r; a.vy = -Math.abs(a.vy) * .18; if (Math.abs(a.vy) < .08) a.vy = 0; }
    }
    const merges = [];
    for (let i = 0; i < whales.length; i++) for (let j = i + 1; j < whales.length; j++) {
      const a = whales[i], b = whales[j], ra = types[a.type].r, rb = types[b.type].r;
      const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || .01, min = ra + rb;
      if (dist < min) {
        const nx = dx / dist, ny = dy / dist, push = (min - dist) / 2;
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        const along = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (along < 0) { const impulse = along * .36; a.vx += impulse * nx; a.vy += impulse * ny; b.vx -= impulse * nx; b.vy -= impulse * ny; }
        if (a.type === b.type && a.type < types.length - 1 && !a.merging && !b.merging) { a.merging = b.merging = true; merges.push([a, b]); }
      }
    }
    for (const [a,b] of merges) {
      const t = a.type + 1, gain = (t + 1) * 10;
      whales = whales.filter(w => w !== a && w !== b);
      whales.push({ x: (a.x+b.x)/2, y: (a.y+b.y)/2, vx: (a.vx+b.vx)/2, vy: -0.18, type: t, merging: false });
      score += gain; scoreEl.textContent = score;
    }
    const danger = whales.some(w => w.y - types[w.type].r < 88 && w.vy < .12);
    dangerTime = danger ? dangerTime + dt : Math.max(0, dangerTime - dt * 2);
    if (dangerTime > 1800) { gameOver = true; finalScore.textContent = score; overlay.hidden = false; }
  }
  function whale(w, ghost = false) {
    const { r, color } = types[w.type]; ctx.save(); ctx.globalAlpha = ghost ? .52 : 1;
    ctx.translate(w.x, w.y); ctx.rotate(clamp(w.vx * .05, -.18, .18));
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, 0, r, r * .76, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#073d5d'; ctx.beginPath(); ctx.arc(r * .27, -r * .18, Math.max(2, r*.075), 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#073d5d'; ctx.lineWidth = Math.max(1.5, r*.045); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(r*.22, r*.05, r*.17, .15, 1.25); ctx.stroke();
    ctx.fillStyle = '#d7fbff88'; ctx.beginPath(); ctx.ellipse(-r*.24, -r*.26, r*.22, r*.1, -.4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-r*.72, 0); ctx.lineTo(-r*1.1, -r*.28); ctx.lineTo(-r*.98, r*.08); ctx.lineTo(-r*1.15, r*.31); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function draw() {
    const grad = ctx.createLinearGradient(0,0,0,H); grad.addColorStop(0,'#0b7497'); grad.addColorStop(1,'#023b62'); ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
    for (let i=0;i<18;i++) { ctx.fillStyle='#b9f8ff22'; ctx.beginPath(); ctx.arc((i*83)%W, 115+(i*67)%470, 1+(i%3), 0,Math.PI*2);ctx.fill(); }
    ctx.strokeStyle = dangerTime > 0 ? '#ffd982' : '#a7edf2'; ctx.lineWidth = 2; ctx.setLineDash([6,6]); ctx.beginPath(); ctx.moveTo(0,88);ctx.lineTo(W,88);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#d9faff';ctx.font='700 11px system-ui';ctx.fillText('縺薙％繧定ｶ翫∴繧九→蜊ｱ髯ｺ・・, 12, 80);
    for (const w of whales) whale(w); if (!gameOver) whale({x: clamp(pointerX, types[next].r+5, W-types[next].r-5), y:DROP_Y, vx:0, type:next}, true);
    ctx.fillStyle='#d6fbff55';ctx.fillRect(0,FLOOR,W,3);
  }
  function loop(now) { const dt = Math.min(32, now-lastTime); lastTime=now; if (!gameOver) update(dt); draw(); requestAnimationFrame(loop); }
  function setPointer(clientX) { const box=canvas.getBoundingClientRect(); pointerX=(clientX-box.left)*W/box.width; }
  canvas.addEventListener('pointermove', e => setPointer(e.clientX));
  canvas.addEventListener('pointerdown', e => { setPointer(e.clientX); drop(); });
  window.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); drop(); } if (e.key === 'ArrowLeft') pointerX -= 22; if (e.key === 'ArrowRight') pointerX += 22; });
  document.querySelector('#restart').onclick = reset; document.querySelector('#play-again').onclick = reset;
  reset(); requestAnimationFrame(loop);
})();

