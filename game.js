(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.querySelector('#score');
  const overlay = document.querySelector('#gameover');
  const finalScore = document.querySelector('#final-score');
  const W = 390, H = 620, FLOOR = 604, DROP_Y = 55;
  const types = [
    { r: 18, color: '#ffffff', name: 'ぷち' }, { r: 27, color: '#fbfeff', name: 'ちび' },
    { r: 39, color: '#f5fcff', name: 'ふわ' }, { r: 55, color: '#edfaff', name: 'どーん' },
    { r: 74, color: '#e2f6fb', name: '王様' }
  ];
  let whales, next, score, gameOver, lastTime, dangerTime, pointerX, cooldown;
  const randomType = () => Math.random() < .72 ? (Math.random() < .57 ? 0 : 1) : 2;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function reset() {
    whales = []; score = 0; gameOver = false; dangerTime = 0; cooldown = 0; pointerX = W / 2;
    next = 1; scoreEl.textContent = score; overlay.hidden = true; lastTime = performance.now();
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
    const { r, color } = types[w.type]; const ink = '#1a5b76';
    ctx.save(); ctx.globalAlpha = ghost ? .58 : 1; ctx.translate(w.x, w.y);
    ctx.rotate(clamp(w.vx * .045, -.14, .14));
    // 頭から尾までを一筆で結んだ、背びれのないベルーガの横顔。
    ctx.fillStyle = color; ctx.strokeStyle = '#bee6ee'; ctx.lineWidth = Math.max(1, r*.028);
    ctx.beginPath();
    ctx.moveTo(-r*.62, -r*.14);
    ctx.bezierCurveTo(-r*.95, -r*.55, -r*1.26, -r*.55, -r*1.12, -r*.12);
    ctx.bezierCurveTo(-r*1.42, r*.02, -r*1.3, r*.35, -r*.72, r*.16);
    ctx.bezierCurveTo(-r*.5, r*.7, r*.43, r*.71, r*.88, r*.28);
    ctx.bezierCurveTo(r*1.09, r*.1, r*1.04, -.02*r, r*.85, -.07*r);
    ctx.bezierCurveTo(r*.86, -r*.63, r*.36, -r*.84, -r*.14, -r*.67);
    ctx.bezierCurveTo(-r*.45, -r*.59, -r*.61, -r*.35, -r*.62, -r*.14);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 下側に沿う胸びれ。体とつながる位置に留めて立体感を出す。
    ctx.fillStyle = '#c8edf4'; ctx.beginPath(); ctx.moveTo(r*.12, r*.4);
    ctx.quadraticCurveTo(r*.53, r*.73, r*.43, r*.35); ctx.quadraticCurveTo(r*.31, r*.25, r*.12, r*.4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 目、ほっぺ、そしてベルーガらしい穏やかな口元
    const eye = Math.max(2.2, r*.07); ctx.fillStyle = ink;
    ctx.beginPath(); ctx.arc(r*.57, -r*.2, eye, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f3a7b488'; ctx.beginPath(); ctx.ellipse(r*.64, r*.04, r*.14, r*.075, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.3, r*.034); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r*.63, r*.11); ctx.quadraticCurveTo(r*.77, r*.24, r*.91, r*.1); ctx.stroke();
    // 額のツヤで白くつるんとした質感を強調
    ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.ellipse(r*.35, -r*.55, r*.27, r*.1, -.25, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
  function draw() {
    const grad = ctx.createLinearGradient(0,0,0,H); grad.addColorStop(0,'#0b7497'); grad.addColorStop(1,'#023b62'); ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
    for (let i=0;i<18;i++) { ctx.fillStyle='#b9f8ff22'; ctx.beginPath(); ctx.arc((i*83)%W, 115+(i*67)%470, 1+(i%3), 0,Math.PI*2);ctx.fill(); }
    ctx.strokeStyle = dangerTime > 0 ? '#ffd982' : '#a7edf2'; ctx.lineWidth = 2; ctx.setLineDash([6,6]); ctx.beginPath(); ctx.moveTo(0,88);ctx.lineTo(W,88);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#d9faff';ctx.font='700 11px system-ui';ctx.fillText('ここを越えると危険！', 12, 80);
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

