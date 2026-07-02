(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("yr").textContent = new Date().getFullYear();

  /* ---------------- audio ---------------- */
  var AC = null, muted = false;
  function ctx() {
    if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); }
    if (AC.state === "suspended") { AC.resume(); }
    return AC;
  }
  var master = null, noiseBuf = null;
  function bus() {
    var c = ctx();
    if (!master) { master = c.createGain(); master.gain.value = 0.9; master.connect(c.destination); }
    return master;
  }
  function noise() {
    var c = ctx();
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) { d[i] = Math.random() * 2 - 1; }
    }
    return noiseBuf;
  }

  // One tire chirp: raspy tonal squeal (with vibrato) + a short rubber-scrub noise.
  function oneChirp(t, opts) {
    var c = ctx(), o = opts || {};
    var dur = o.dur || 0.17, base = o.base || 720, peak = o.peak || 1180, lvl = o.lvl || 0.34;

    var osc = c.createOscillator(); osc.type = "sawtooth";
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(peak, t + 0.028);   // the "chirp up"
    osc.frequency.exponentialRampToValueAtTime(base * 1.25, t + dur);
    // vibrato gives the raspy rubber-squeal warble
    var lfo = c.createOscillator(); lfo.type = "square"; lfo.frequency.value = 48;
    var lfoG = c.createGain(); lfoG.gain.value = 65;
    lfo.connect(lfoG); lfoG.connect(osc.frequency);
    var bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 3.5; bp.frequency.value = 1250;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(lvl, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(bp); bp.connect(g); g.connect(bus());
    osc.start(t); osc.stop(t + dur + 0.02);
    lfo.start(t); lfo.stop(t + dur + 0.02);

    // rubber scrub: short filtered noise burst layered on top
    var ns = c.createBufferSource(); ns.buffer = noise(); ns.loop = true;
    var hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1400;
    var ng = c.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(lvl * 0.5, t + 0.005);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.8);
    ns.connect(hp); hp.connect(ng); ng.connect(bus());
    ns.start(t); ns.stop(t + dur);
  }

  // Short exhaust bark — the clutch dump right before the chirp.
  function engineBlip(t) {
    var c = ctx(), dur = 0.2;
    var osc = c.createOscillator(); osc.type = "sawtooth";
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.exponentialRampToValueAtTime(210, t + 0.07);
    osc.frequency.exponentialRampToValueAtTime(95, t + dur);
    var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 850;
    var g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(lp); lp.connect(g); g.connect(bus());
    osc.start(t); osc.stop(t + dur);
  }

  // Synthesized fallback: exhaust blip, then a chirp-chirp.
  function synthChirp() {
    var t = ctx().currentTime;
    engineBlip(t);
    oneChirp(t + 0.05, { dur: 0.18, base: 700, peak: 1180, lvl: 0.36 });   // main chirp
    oneChirp(t + 0.25, { dur: 0.11, base: 820, peak: 1320, lvl: 0.24 });   // quick second chirp
  }

  // Prefer a real clip at assets/sfx/chirp.* if it loaded; else use the synth.
  var sfx = document.getElementById("sfxChirp"), sfxReady = false;
  if (sfx) {
    sfx.addEventListener("canplaythrough", function () { sfxReady = true; });
    sfx.addEventListener("error", function () { sfxReady = false; }, true);
    try { sfx.load(); } catch (e) {}
  }
  function chirpSound() {
    if (muted) return;
    if (sfxReady) {
      try {
        var a = sfx.cloneNode(true);  // clone so rapid re-triggers overlap cleanly
        a.volume = 1;
        a.play();
        return;
      } catch (e) {}
    }
    synthChirp();
  }

  var muteBtn = document.getElementById("muteBtn");
  muteBtn.addEventListener("click", function () {
    muted = !muted;
    muteBtn.setAttribute("aria-pressed", String(muted));
    muteBtn.querySelector(".ic-sound").textContent = muted ? "SOUND OFF" : "SOUND ON";
  });

  /* ---------------- effects ---------------- */
  var stage = document.getElementById("heroStage");
  var bird = document.getElementById("heroBird");
  var stamp = document.getElementById("stamp");

  /* ---- billowing tire smoke (canvas particle system, spans the whole hero) ---- */
  var smoke = (function () {
    var cv = document.getElementById("smokeCanvas");
    var cx = cv.getContext("2d");
    var parts = [], raf = null, dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0;

    function resize() {
      W = cv.clientWidth; H = cv.clientHeight;   // canvas covers the full hero section
      cv.width = W * dpr; cv.height = H * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function origin() {
      // emit from the base of the bird, wherever it sits in the hero
      var br = bird.getBoundingClientRect(), cr = cv.getBoundingClientRect();
      return { x: br.left - cr.left + br.width / 2, y: br.top - cr.top + br.height * 0.84, w: br.width };
    }

    function spawn(n) {
      resize();
      var o = origin();
      for (var i = 0; i < n; i++) {
        parts.push({
          x: o.x + (Math.random() - 0.5) * o.w * 0.5,
          y: o.y + (Math.random() - 0.5) * o.w * 0.08,
          vx: (Math.random() - 0.5) * 1.6,
          vy: -(1.4 + Math.random() * 2.4),          // strong rise so the plume crosses the hero
          r: 16 + Math.random() * 26,
          grow: 0.6 + Math.random() * 1.2,           // billow outward as it climbs
          life: 0,
          max: 120 + Math.random() * 110,
          seed: Math.random() * 6.28,
          tone: 205 + Math.floor(Math.random() * 38)
        });
      }
      if (!raf) loop();
    }

    function loop() {
      cx.clearRect(0, 0, W, H);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.life++;
        var t = p.life / p.max;
        if (t >= 1) { parts.splice(i, 1); continue; }
        p.seed += 0.045;
        p.vx += Math.sin(p.seed) * 0.06;   // drifting turbulence
        p.vy -= 0.012;                      // buoyant, keeps rising
        p.vx *= 0.99; p.vy *= 0.995;
        p.x += p.vx; p.y += p.vy;
        p.r += p.grow;
        // soft fade-in, long fade-out so it dissipates across the screen
        var a = (t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88) * 0.32;
        if (a <= 0) continue;
        var g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, "rgba(" + p.tone + "," + p.tone + "," + (p.tone + 6) + "," + a + ")");
        g.addColorStop(0.55, "rgba(" + p.tone + "," + p.tone + "," + (p.tone + 6) + "," + (a * 0.45) + ")");
        g.addColorStop(1, "rgba(" + p.tone + "," + p.tone + "," + (p.tone + 6) + ",0)");
        cx.fillStyle = g;
        cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.2832); cx.fill();
      }
      if (parts.length) { raf = requestAnimationFrame(loop); }
      else { raf = null; cx.clearRect(0, 0, W, H); }
    }

    return { burst: function () { spawn(reduce ? 16 : 38); setTimeout(function () { spawn(reduce ? 0 : 26); }, 110); setTimeout(function () { spawn(reduce ? 0 : 18); }, 240); } };
  })();
  function skid() {
    var positions = [0.34, 0.6];
    positions.forEach(function (fx) {
      var s = document.createElement("div");
      s.className = "skid";
      s.style.left = (stage.clientWidth * fx) + "px";
      s.style.width = (stage.clientWidth * 0.12) + "px";
      s.style.bottom = (stage.clientHeight * 0.05) + "px";
      stage.appendChild(s);
      requestAnimationFrame(function () { s.style.opacity = "0.9"; });
      setTimeout(function () { s.style.opacity = "0"; setTimeout(function () { s.remove(); }, 400); }, 1100);
    });
  }
  function shake() {
    if (reduce) return;
    bird.animate(
      [{ transform: "translate(0,0)" }, { transform: "translate(-6px,3px)" },
       { transform: "translate(6px,-3px)" }, { transform: "translate(-4px,2px)" },
       { transform: "translate(0,0)" }],
      { duration: 360, easing: "ease-in-out" }
    );
  }

  /* EK9-style tach: 0..10 (x1000 rpm) swept over 270deg, redline 8-10 */
  var needle = document.getElementById("tachNeedle");
  var IDLE = 0.85, REDLINE = 8;
  var NS = "http://www.w3.org/2000/svg";
  function angFor(v) { return -135 + v * 27; }            // degrees, 0=up
  function ptFor(v, r) { var a = angFor(v) * Math.PI / 180; return [200 + Math.sin(a) * r, 200 - Math.cos(a) * r]; }
  function needleTo(v) { needle.style.transform = "rotate(" + angFor(v) + "deg)"; }
  needleTo(IDLE);

  (function buildDial() {
    var ticksG = document.getElementById("tachTicks");
    var numsG = document.getElementById("tachNumbers");
    var redG = document.getElementById("tachRedline");
    // ---- white gridline ticks (0 -> 8): major at integers, fine minors every 0.25 ----
    for (var ti = 0; ti <= 39; ti++) {            // 0 -> 7.8 in 0.2 steps (4 minors per major)
      var v = ti * 0.2;
      var major = (ti % 5 === 0);
      var o = ptFor(v, 178), ip = ptFor(v, major ? 151 : 167);
      var ln = document.createElementNS(NS, "line");
      ln.setAttribute("x1", o[0]); ln.setAttribute("y1", o[1]);
      ln.setAttribute("x2", ip[0]); ln.setAttribute("y2", ip[1]);
      ln.setAttribute("class", "tach-tick" + (major ? "" : " minor"));
      ln.setAttribute("stroke-width", major ? 3.6 : 1.5);
      ticksG.appendChild(ln);
    }
    // ---- redline inner HATCHED TRIANGLE: wide base at 8, apex toward 10 ----
    var tA = ptFor(8, 162), tB = ptFor(8, 104), tC = ptFor(9.8, 100);
    var cp = document.createElementNS(NS, "clipPath"); cp.setAttribute("id", "redClip");
    var cpp = document.createElementNS(NS, "path");
    cpp.setAttribute("d", "M" + tA[0] + " " + tA[1] + " L" + tB[0] + " " + tB[1] + " L" + tC[0] + " " + tC[1] + " Z");
    cp.appendChild(cpp); redG.appendChild(cp);
    var hg = document.createElementNS(NS, "g"); hg.setAttribute("clip-path", "url(#redClip)");
    for (var k = 250; k <= 470; k += 9) {         // diagonal hatch (~35deg), clipped to the triangle
      var hl = document.createElementNS(NS, "line");
      hl.setAttribute("x1", 210); hl.setAttribute("y1", k);
      hl.setAttribute("x2", 378); hl.setAttribute("y2", k - 118);
      hl.setAttribute("class", "tach-redhatch");
      hg.appendChild(hl);
    }
    redG.appendChild(hg);
    // ---- red rim tick segments (8 -> 10) ----
    for (var rt = 8; rt <= 10.001; rt += 0.25) {
      var rmaj = (Math.abs(rt - Math.round(rt)) < 0.01);
      var ro = ptFor(rt, 178), ri = ptFor(rt, rmaj ? 157 : 163);
      var rl = document.createElementNS(NS, "line");
      rl.setAttribute("x1", ro[0]); rl.setAttribute("y1", ro[1]);
      rl.setAttribute("x2", ri[0]); rl.setAttribute("y2", ri[1]);
      rl.setAttribute("class", "tach-redtick");
      rl.setAttribute("stroke-width", rmaj ? 4.8 : 3.4);
      redG.appendChild(rl);
    }
    // ---- numbers (all integers; 8 white, 9 & 10 red) ----
    for (var n = 0; n <= 10; n++) {
      var np = ptFor(n, 124);
      var tx = document.createElementNS(NS, "text");
      tx.setAttribute("x", np[0]); tx.setAttribute("y", np[1]);
      tx.setAttribute("class", "tach-num" + (n >= 9 ? " red" : ""));
      tx.textContent = n;
      numsG.appendChild(tx);
    }
  })();

  function revNeedle() {
    if (reduce) { needleTo(IDLE); return; }
    var v = IDLE, up = true, n = 0;
    var iv = setInterval(function () {
      n++;
      v += up ? 1.5 : -0.7;                  // blip up into the redline, then settle
      if (v >= 9.3) up = false;
      needleTo(Math.max(IDLE, Math.min(9.6, v)));
      if (n > 16) { clearInterval(iv); needleTo(IDLE); }
    }, 45);
  }

  /* the payoff */
  var firing = false, fired = false;
  var headline = document.getElementById("headline");
  var subhead = document.getElementById("subhead");
  var cue = document.getElementById("shifterCue");
  function chirp() {
    if (firing) return;
    firing = true;
    chirpSound();
    revNeedle();
    shake();
    skid();
    smoke.burst();
    stamp.classList.remove("go"); void stamp.offsetWidth; stamp.classList.add("go");
    headline.classList.add("fire");
    if (!fired) {
      fired = true;
      subhead.textContent = "THAT'S the whole point. Welcome to Chirp'n 3rd.";
      cue.innerHTML = "<span>nice. now go</span> <b>again</b>";
    }
    setTimeout(function () { firing = false; }, 700);
  }

  /* ---------------- shifter ---------------- */
  var gate = document.getElementById("gate");
  var knob = document.getElementById("knob");
  var dot = document.getElementById("knobDot");
  var slots = [
    { g: "1", x: 55, y: 46 }, { g: "2", x: 55, y: 134 },
    { g: "3", x: 120, y: 46 }, { g: "4", x: 120, y: 134 },
    { g: "5", x: 185, y: 46 }, { g: "R", x: 185, y: 134 },
    { g: "N", x: 120, y: 90 }
  ];
  var cur = 6; // index of N
  function place(x, y) { knob.setAttribute("cx", x); knob.setAttribute("cy", y); dot.setAttribute("cx", x); dot.setAttribute("cy", y); }
  function setGear(idx) {
    cur = idx;
    var s = slots[idx];
    place(s.x, s.y);
    gate.setAttribute("aria-valuetext", s.g === "N" ? "Neutral" : s.g === "R" ? "Reverse" : "Gear " + s.g);
    gate.classList.toggle("in3", s.g === "3");
    if (s.g === "3") chirp();
  }
  function loc(e) {
    var pt = gate.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(gate.getScreenCTM().inverse());
  }
  function nearest(x, y) {
    var bi = 6, bd = 1e9;
    for (var i = 0; i < slots.length; i++) {
      var dx = slots[i].x - x, dy = slots[i].y - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; bi = i; }
    }
    return bi;
  }
  var dragging = false;
  function down(e) { dragging = true; ctx(); e.preventDefault(); }
  function move(e) {
    if (!dragging) return;
    var p = loc(e.touches ? e.touches[0] : e);
    var x = Math.max(45, Math.min(195, p.x)), y = Math.max(40, Math.min(140, p.y));
    place(x, y);
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    var x = +knob.getAttribute("cx"), y = +knob.getAttribute("cy");
    setGear(nearest(x, y));
  }
  knob.addEventListener("pointerdown", down);
  gate.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);

  // keyboard: arrows move through the H-pattern
  gate.addEventListener("keydown", function (e) {
    var s = slots[cur], col, idx = cur;
    var handled = true;
    if (e.key === "ArrowLeft") { col = s.x - 65; idx = pickCol(col, s.y); }
    else if (e.key === "ArrowRight") { col = s.x + 65; idx = pickCol(col, s.y); }
    else if (e.key === "ArrowUp") { idx = pickRow(s.x, 46); }
    else if (e.key === "ArrowDown") { idx = pickRow(s.x, 134); }
    else if (e.key === "Enter" || e.key === " ") { idx = findGear("3"); }
    else { handled = false; }
    if (handled) { e.preventDefault(); ctx(); setGear(idx); }
  });
  function pickCol(x, y) { var i = nearest(x, y); return i; }
  function pickRow(x, y) { return nearest(x, y); }
  function findGear(g) { for (var i = 0; i < slots.length; i++) { if (slots[i].g === g) return i; } return 6; }

  setGear(6);

  /* ---------------- placeholder links ---------------- */
  var toast;
  function showToast(msg) {
    if (!toast) { toast = document.createElement("div"); toast.className = "toast"; document.body.appendChild(toast); }
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }
  document.querySelectorAll('[data-placeholder="true"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      showToast("Hang tight — link drops when the shop / socials go live.");
    });
  });
})();
