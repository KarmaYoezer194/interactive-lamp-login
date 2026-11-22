(() => {
  const body = document.body;
  const $ = s => document.querySelector(s);

  /* ---------- Dust particles ---------- */
  const cv = $('#dustCanvas'), ctx = cv.getContext('2d');
  let W, H, dpr, parts = [];
  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    const n = Math.round(innerWidth * innerHeight / 9000);
    parts = Array.from({length:n}, () => ({
      x:Math.random()*W, y:Math.random()*H,
      r:(Math.random()*1.3+.3)*dpr,
      vx:(Math.random()-.5)*.15*dpr, vy:(-Math.random()*.18-.03)*dpr,
      a:Math.random()*.5+.15, t:Math.random()*Math.PI*2
    }));
  }
  let light = 0;
  function tick(){
    const on = body.dataset.on === 'true';
    light += ((on?1:0) - light) * .04;
    ctx.clearRect(0,0,W,H);
    for (const p of parts){
      p.t += .02; p.x += p.vx + Math.sin(p.t)*.08*dpr; p.y += p.vy;
      if (p.y < -5) { p.y = H + 5; p.x = Math.random()*W; }
      if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5;
      const tw = .65 + Math.sin(p.t*1.7)*.35;
      const alpha = p.a * tw * (.35 + light*.85);
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(${Math.round(200 - light*60)},${Math.round(215+light*25)},${Math.round(225+light*20)},${alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  addEventListener('resize', resize); resize(); tick();

  /* ---------- Lamp toggle + pull string ---------- */
  const shade = $('#shade'), inner = $('#innerShade'), bulb = $('#bulb');
  const line = $('#stringLine'), pull = $('#pull');
  const BASE_Y2 = 268, MAX = 70;
  let dragging = false, startY = 0, dy = 0, svgScale = 1;

  function setLamp(on){
    body.dataset.on = on;
    inner.setAttribute('fill', on ? 'url(#innerOn)' : '#141618');
    bulb.setAttribute('fill', on ? '#f2ffff' : '#3a4046');
    bulb.style.filter = on ? 'drop-shadow(0 0 8px #19e3ea)' : 'none';
    shade.classList.remove('swing'); void shade.getBBox(); shade.classList.add('swing');
    if (!on) resetCard();
  }
  function setPull(d){
    line.setAttribute('y2', BASE_Y2 + d);
    pull.setAttribute('transform', `translate(0 ${d})`);
  }
  function springBack(from){
    // damped spring animation back to 0
    let x = from, v = 0;
    const step = () => {
      v += -x * .18; v *= .78; x += v;
      setPull(x);
      if (Math.abs(x) > .2 || Math.abs(v) > .2) requestAnimationFrame(step); else setPull(0);
    };
    requestAnimationFrame(step);
  }
  pull.addEventListener('pointerdown', e => {
    dragging = true; startY = e.clientY; dy = 0;
    const r = $('#lamp svg').getBoundingClientRect(); svgScale = 420 / r.height;
    pull.setPointerCapture(e.pointerId);
  });
  pull.addEventListener('pointermove', e => {
    if (!dragging) return;
    const raw = Math.max(0, (e.clientY - startY) * svgScale);
    dy = MAX * (1 - Math.exp(-raw / MAX)); // rubber band
    setPull(dy);
  });
  const release = () => {
    if (!dragging) return; dragging = false;
    if (dy > 24) setLamp(body.dataset.on !== 'true');
    else if (dy < 3) { // treat as a click: quick tug
      setPull(26); setTimeout(() => { setLamp(body.dataset.on !== 'true'); springBack(26); }, 120); return;
    }
    springBack(dy);
  };
  pull.addEventListener('pointerup', release);
  pull.addEventListener('pointercancel', release);

  /* ---------- Tabs ---------- */
  const tabs = $('#tabs'), title = $('#title'), sub = $('#subtitle'), btnText = $('#btnText');
  const copy = {
    signin:{t:'Welcome', s:'Sign in to continue to your account', b:'Sign In'},
    signup:{t:'Sign Up', s:'Create an account to get started', b:'Create Account'}
  };
  let mode = 'signin';
  function swapText(el, txt){
    el.classList.add('out');
    setTimeout(() => { el.textContent = txt; el.classList.remove('out'); }, 200);
  }
  tabs.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    if (t.dataset.mode === mode) return;
    mode = t.dataset.mode; tabs.dataset.mode = mode;
    tabs.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
    swapText(title, copy[mode].t); swapText(sub, copy[mode].s);
    btnText.textContent = copy[mode].b;
    $('#pass').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
  }));

  /* ---------- Password eye ---------- */
  const pass = $('#pass'), eye = $('#eye');
  eye.addEventListener('click', () => {
    const show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    eye.querySelector('.slash').style.display = show ? 'block' : 'none';
    eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  /* ---------- Submit ---------- */
  const card = $('#card'), form = $('#form'), submit = $('#submit'), user = $('#user');
  [user, pass].forEach(i => i.addEventListener('input', () => i.parentElement.classList.remove('error')));
  form.addEventListener('submit', e => {
    e.preventDefault();
    let bad = false;
    [user, pass].forEach(i => { if (!i.value.trim()) { i.parentElement.classList.add('error'); bad = true; } });
    if (bad) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); return; }
    submit.classList.add('loading');
    setTimeout(() => {
      submit.classList.remove('loading'); submit.classList.add('ok');
      setTimeout(() => {
        $('#okTitle').textContent = mode === 'signin' ? 'Signed In Successfully' : 'Account Created';
        $('#okText').textContent = mode === 'signin' ? 'Welcome back! Your workspace is ready.' : 'Welcome aboard! Your workspace is ready.';
        card.classList.add('done');
      }, 700);
    }, 1400);
  });
  function resetCard(){
    card.classList.remove('done');
    submit.classList.remove('loading','ok');
    form.reset(); $('#remember').checked = true;
    pass.type = 'password'; eye.querySelector('.slash').style.display = 'none';
  }
  $('#again').addEventListener('click', resetCard);

  /* ---------- Toasts for demo links ---------- */
  const toast = $('#toast'); let tt;
  function say(m){ toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 1800); }
  $('#forgot').addEventListener('click', e => { e.preventDefault(); say('Password reset link sent (demo)'); });
  document.querySelectorAll('.social').forEach(b => b.addEventListener('click', () => say(`Continue with ${b.dataset.p} (demo)`)));
})();
