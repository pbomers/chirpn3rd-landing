/* Chirpn3rd Online — window manager.
   Progressive enhancement: with JS off every window stays open and stacked,
   which is the layout Shopify renders anyway. Nothing here is required to shop. */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var desktop = $(".desktop");
  if (!desktop) return;

  var DESK_MIN = 1180;        // below this the home page stays in its stacked layout
  var zTop = 10;
  var tray = $("[data-tray]");

  document.documentElement.classList.add("js-win");

  function chirp() {
    var src = document.documentElement.getAttribute("data-chirp");
    if (!src) return;
    try { var a = new Audio(src); a.volume = 0.5; a.play(); } catch (e) {}
  }
  function flash(msg) {
    var cell = $("[data-tip]");
    if (cell) cell.textContent = msg;
  }

  /* ---------- registry ---------- */
  function windows() { return $$("[data-win]", desktop); }

  function titleOf(win) {
    var t = $(".win__title", win);
    return t ? t.textContent.trim() : "Window";
  }

  function front(win) {
    windows().forEach(function (w) { w.classList.remove("is-front"); });
    win.classList.add("is-front");
    if (desktop.classList.contains("desk-on")) {
      var host = win.closest("section") || win;
      host.style.zIndex = ++zTop;
    }
  }

  /* ---------- tray (minimized + closed windows) ---------- */
  function trayAdd(win, label) {
    if (!tray) return;
    var id = win.getAttribute("data-win-id");
    if ($('[data-tray-for="' + id + '"]', tray)) return;
    var btn = document.createElement("button");
    btn.className = "tray__btn";
    btn.type = "button";
    btn.setAttribute("data-tray-for", id);
    btn.innerHTML = '<svg aria-hidden="true"><use href="#i-bird"/></svg>' + label;
    btn.addEventListener("click", function () { restore(win); });
    tray.appendChild(btn);
  }
  function trayRemove(win) {
    if (!tray) return;
    var el = $('[data-tray-for="' + win.getAttribute("data-win-id") + '"]', tray);
    if (el) el.remove();
  }

  function restore(win) {
    win.classList.remove("is-min", "is-closed");
    trayRemove(win);
    front(win);
    win.scrollIntoView({ block: "nearest" });
  }

  /* ---------- desktop layout ---------- */
  /* Preset arrangement for the home page. Each entry is a fraction of the
     desktop width plus a pixel width, so it scales with the viewport. */
  var LAYOUT = [
    { sel: ".section--im",       x: 0.01, y: 8,   w: 392 },
    { sel: ".section--channels", x: 0.35, y: 22,  w: 545 },
    { sel: ".section--welcome",  x: 0.14, y: 300, w: 600 },
    { sel: ".section--featured", x: 0.02, y: 610, w: 760 },
    { sel: ".section--side",     x: 0.80, y: 14,  w: 232 }
  ];

  /* Ask the same breakpoint CSS uses. window.innerWidth lies under device
     emulation and inside embedded frames (it reports the frame, not the page). */
  var wideMQ = window.matchMedia("(min-width: " + DESK_MIN + "px)");

  function deskEligible() {
    return document.body.classList.contains("template-index") && wideMQ.matches;
  }

  function place(el, x, y, w, width) {
    var wide = Math.min(w, width - 40);
    el.style.width = wide + "px";
    if (!el.hasAttribute("data-moved")) {
      var left = Math.round(x);
      if (left + wide > width - 12) left = Math.max(12, width - wide - 12);
      el.style.left = left + "px";
      el.style.top = y + "px";
    }
    return el.offsetTop + el.offsetHeight;
  }

  function layoutDesk() {
    var width = desktop.clientWidth;
    var maxBottom = 0;
    var placed = [];

    LAYOUT.forEach(function (item) {
      var el = $(item.sel, desktop);
      if (!el) return;
      placed.push(el);
      maxBottom = Math.max(maxBottom, place(el, item.x * width, item.y, item.w, width));
    });

    // any section the preset does not know about (one Paul adds in the editor)
    // gets cascaded below the arrangement instead of piling up at the origin
    var extra = 0;
    $$("section", desktop).forEach(function (el) {
      if (placed.indexOf(el) !== -1) return;
      var y = maxBottom + 20 + extra * 28;
      maxBottom = Math.max(maxBottom, place(el, 20 + extra * 28, y, 640, width));
      extra++;
    });

    desktop.style.minHeight = maxBottom + 40 + "px";
  }

  function deskOn() {
    if (desktop.classList.contains("desk-on")) { layoutDesk(); return; }
    desktop.classList.add("desk-on");
    layoutDesk();
    flash("Tip: drag a window by its title bar.");
  }
  function deskOff() {
    if (!desktop.classList.contains("desk-on")) return;
    desktop.classList.remove("desk-on");
    desktop.style.minHeight = "";
    LAYOUT.forEach(function (item) {
      var el = $(item.sel, desktop);
      if (!el) return;
      el.style.width = el.style.left = el.style.top = el.style.zIndex = "";
    });
  }
  function syncDesk() { deskEligible() ? deskOn() : deskOff(); }

  /* ---------- dragging ---------- */
  function makeDraggable(win) {
    var bar = $("[data-win-bar]", win);
    if (!bar || bar.hasAttribute("data-drag-ready")) return;
    bar.setAttribute("data-drag-ready", "");

    bar.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".win__btn")) return;
      front(win);
      if (!desktop.classList.contains("desk-on")) return;
      var host = win.closest("section");
      if (!host) return;

      var hostRect = host.getBoundingClientRect();
      var deskRect = desktop.getBoundingClientRect();
      var offX = e.clientX - hostRect.left;
      var offY = e.clientY - hostRect.top;
      document.body.classList.add("desk-drag");

      function move(ev) {
        var x = ev.clientX - deskRect.left - offX;
        var y = ev.clientY - deskRect.top - offY;
        x = Math.max(-hostRect.width + 80, Math.min(x, deskRect.width - 80));
        y = Math.max(0, y);
        host.style.left = x + "px";
        host.style.top = y + "px";
        host.setAttribute("data-moved", "");
      }
      function up() {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        document.body.classList.remove("desk-drag");
        var bottom = host.offsetTop + host.offsetHeight;
        if (bottom + 40 > desktop.clientHeight) desktop.style.minHeight = bottom + 40 + "px";
      }
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
      e.preventDefault();
    });
  }

  /* ---------- wire one window ---------- */
  var seq = 0;
  function initWindow(win) {
    if (win.hasAttribute("data-win-id")) return;
    win.setAttribute("data-win-id", "w" + (++seq));

    win.addEventListener("pointerdown", function () { front(win); }, true);

    var minBtn = $("[data-win-min]", win);
    var maxBtn = $("[data-win-max]", win);
    var closeBtn = $("[data-win-close]", win);
    var label = titleOf(win);

    if (minBtn) minBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      win.classList.toggle("is-min");
      if (win.classList.contains("is-min")) {
        trayAdd(win, label);
        flash(label + " minimized. Click it in the tray to bring it back.");
      } else {
        trayRemove(win);
      }
    });

    if (maxBtn) maxBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      win.classList.remove("is-min");
      win.classList.toggle("is-max");
      front(win);
    });

    if (closeBtn) closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      win.classList.remove("is-max");
      win.classList.add("is-closed");
      trayAdd(win, label);
      flash(label + " closed. It is waiting in the tray.");
    });

    makeDraggable(win);
  }

  function initAll() {
    windows().forEach(initWindow);
    var first = windows()[0];
    if (first && !$(".is-front", desktop)) front(first);
    syncDesk();
  }
  initAll();

  /* restore-all from the Window menu */
  $$("[data-restore-all]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      windows().forEach(function (w) {
        w.classList.remove("is-min", "is-closed", "is-max");
        trayRemove(w);
        w.removeAttribute("data-moved");
      });
      syncDesk();
      flash("All windows restored.");
    });
  });

  /* re-tile from the Window menu */
  $$("[data-arrange]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      windows().forEach(function (w) {
        var host = w.closest("section");
        if (host) host.removeAttribute("data-moved");
      });
      syncDesk();
      flash("Windows arranged.");
    });
  });

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncDesk, 150);
  });
  if (wideMQ.addEventListener) wideMQ.addEventListener("change", syncDesk);
  else if (wideMQ.addListener) wideMQ.addListener(syncDesk);

  /* Shopify theme editor swaps section markup in and out */
  document.addEventListener("shopify:section:load", initAll);
  document.addEventListener("shopify:section:unload", syncDesk);
  document.addEventListener("shopify:section:select", function (e) {
    var win = $("[data-win]", e.target);
    if (win) front(win);
  });

  /* ---------- sign-on splash ---------- */
  var splash = $("[data-signon]");
  if (splash) {
    var seen;
    try { seen = sessionStorage.getItem("chirpn3rd-signed-on"); } catch (err) { seen = "1"; }
    if (!seen) {
      splash.classList.add("is-open");
      var btn = $("[data-signon-go]", splash);
      var steps = $("[data-signon-steps]", splash);
      var done = function () {
        splash.classList.remove("is-open");
        try { sessionStorage.setItem("chirpn3rd-signed-on", "1"); } catch (err) {}
        flash("Welcome to Chirpn3rd Online. You've Got Merch.");
      };
      if (btn) btn.addEventListener("click", function () {
        btn.disabled = true;
        btn.textContent = "Connecting...";
        if (steps) steps.classList.add("is-on");
        var s = $$("[data-signon-step]", splash);
        setTimeout(function () { if (s[0]) s[0].classList.add("lit"); }, 150);
        setTimeout(function () { if (s[1]) s[1].classList.add("lit"); }, 750);
        setTimeout(function () { if (s[2]) s[2].classList.add("chirped"); chirp(); }, 1350);
        setTimeout(done, 1950);
      });
      $$("[data-signon-skip]", splash).forEach(function (skip) {
        skip.addEventListener("click", done);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && splash.classList.contains("is-open")) done();
      });
    }
  }
})();
