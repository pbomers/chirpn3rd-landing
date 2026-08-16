/* Chirp'n3rd Online — storefront behavior.
   Vanilla, no build step. Everything degrades to plain form posts if JS is off. */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (cents) {
    return (window.Chirpn3rd && window.Chirpn3rd.moneyFormat
      ? window.Chirpn3rd.moneyFormat.replace(/\{\{\s*amount[^}]*\}\}/, (cents / 100).toFixed(2))
      : "$" + (cents / 100).toFixed(2));
  };

  /* ---------- status bar ---------- */
  var tipCell = $("[data-tip]");
  var tips = tipCell ? JSON.parse(tipCell.getAttribute("data-tips") || "[]") : [];
  var tipIx = 0, tipTimer = null;
  function cycleTips() {
    if (tipTimer) clearInterval(tipTimer);
    if (!tipCell || tips.length < 2) return;
    tipTimer = setInterval(function () {
      tipIx = (tipIx + 1) % tips.length;
      tipCell.textContent = tips[tipIx];
    }, 9000);
  }
  function flash(msg) {
    if (!tipCell) return;
    tipCell.textContent = msg;
    cycleTips();
  }
  cycleTips();

  /* ---------- clock ---------- */
  var clock = $("[data-clock]");
  function tick() {
    if (!clock) return;
    var d = new Date(), h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    clock.textContent = h + ":" + (m < 10 ? "0" : "") + m + " " + ap;
  }
  tick(); setInterval(tick, 20000);

  /* ---------- sound ---------- */
  function chirp() {
    var src = document.documentElement.getAttribute("data-chirp");
    if (!src) return;
    try { var a = new Audio(src); a.volume = 0.5; a.play(); } catch (e) {}
  }

  /* ---------- menubar dropdowns ---------- */
  $$("[data-menu]").forEach(function (btn) {
    var drop = $("#" + btn.getAttribute("data-menu"));
    if (!drop) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = drop.classList.contains("open");
      $$(".menubar__drop").forEach(function (d) { d.classList.remove("open"); });
      $$("[data-menu]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
      if (!open) {
        /* Sit under the button that opened it, but never past the right edge. */
        var bar = btn.parentNode;
        var left = btn.offsetLeft;
        drop.style.right = "auto";
        drop.style.left = left + "px";
        drop.classList.add("open");
        var over = left + drop.offsetWidth - bar.clientWidth + 4;
        if (over > 0) drop.style.left = Math.max(4, left - over) + "px";
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
  document.addEventListener("click", function () {
    $$(".menubar__drop").forEach(function (d) { d.classList.remove("open"); });
    $$("[data-menu]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      $$(".menubar__drop").forEach(function (d) { d.classList.remove("open"); });
      $$("[data-menu]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    }
  });

  /* ---------- toast ---------- */
  var toast = $("[data-toast]"), toastTimer = null;
  function showToast(html) {
    if (!toast) return;
    var msg = $("[data-toast-msg]", toast);
    msg.textContent = "";
    toast.classList.add("show");
    /* set the text after it is visible so aria-live actually announces it */
    setTimeout(function () { msg.innerHTML = html; }, 20);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 5200);
  }
  if (toast) {
    var closeBtn = $("[data-toast-close]", toast);
    if (closeBtn) closeBtn.addEventListener("click", function () { toast.classList.remove("show"); });
  }

  /* ---------- product gallery ---------- */
  $$("[data-gallery]").forEach(function (gal) {
    var stage = $("[data-gallery-stage] img", gal);
    $$("[data-gallery-thumb]", gal).forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var full = thumb.getAttribute("data-full");
        if (stage && full) { stage.src = full; stage.srcset = ""; }
        $$("[data-gallery-thumb]", gal).forEach(function (t) { t.classList.remove("on"); });
        thumb.classList.add("on");
      });
    });
  });

  /* ---------- variant picking ---------- */
  $$("[data-product-form]").forEach(function (form) {
    var dataEl = $("[data-variants]", form.closest("[data-product-root]") || document);
    if (!dataEl) return;
    var variants = JSON.parse(dataEl.textContent || "[]");
    var idInput = $("[data-variant-id]", form);
    var priceEl = $("[data-price]", form.closest("[data-product-root]"));
    var stockEl = $("[data-stock]", form.closest("[data-product-root]"));
    var submitBtn = $("[data-add]", form);

    function selectedOptions() {
      return $$("[data-option]", form).map(function (sel) { return sel.value; });
    }
    function match() {
      var picked = selectedOptions();
      return variants.filter(function (v) {
        return picked.every(function (val, i) { return v.options[i] === val; });
      })[0];
    }
    var stage = $("[data-gallery-stage] img", form.closest("[data-product-root]") || document);
    var selects = $$("[data-option]", form);
    /* mark options that lead nowhere in stock as "(sold out)" given the other picks */
    function markOptions() {
      selects.forEach(function (sel, si) {
        var picked = selectedOptions();
        $$("option", sel).forEach(function (opt) {
          var trial = picked.slice(); trial[si] = opt.value;
          var any = variants.some(function (v) { return trial.every(function (val, i) { return v.options[i] === val; }) && v.available; });
          var base = opt.getAttribute("data-label") || opt.textContent.trim();
          opt.setAttribute("data-label", base);
          opt.textContent = any ? base : base + " (sold out)";
        });
      });
    }
    function sync(userInitiated) {
      var v = match();
      markOptions();
      if (v && v.image && stage && stage.getAttribute("src") !== v.image) {
        stage.removeAttribute("srcset"); stage.removeAttribute("sizes"); stage.src = v.image;
        $$("[data-gallery-thumb]").forEach(function (t) { t.classList.toggle("on", t.getAttribute("data-full") === v.image); });
      }
      if (!v) {
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Unavailable"; }
        if (priceEl) priceEl.textContent = "--";
        if (stockEl) stockEl.innerHTML = '<span class="stock__dot stock__dot--out"></span> That combo does not exist. Yet.';
        return;
      }
      if (idInput) idInput.value = v.id;
      if (priceEl) {
        priceEl.innerHTML = money(v.price) +
          (v.compare_at_price > v.price ? " <s>" + money(v.compare_at_price) + "</s>" : "");
      }
      if (stockEl) {
        stockEl.innerHTML = v.available
          ? '<span class="stock__dot"></span> On the shelf, ships in 2-5 days'
          : '<span class="stock__dot stock__dot--out"></span> Sold out. Sorry bud.';
      }
      if (submitBtn) {
        submitBtn.disabled = !v.available;
        submitBtn.textContent = v.available ? "Send It" : "Sold Out";
      }
      if (userInitiated && history.replaceState && v.id) {
        try {
          var url = new URL(window.location.href);
          url.searchParams.set("variant", v.id);
          history.replaceState({}, "", url.toString());
        } catch (err) {}
      }
    }
    $$("[data-option]", form).forEach(function (sel) {
      sel.addEventListener("change", function () { sync(true); });
    });
    sync(false);

    /* AJAX add to cart, with a full-page-post fallback on failure */
    form.addEventListener("submit", function (e) {
      if (!window.fetch || !idInput || !idInput.value) return;
      e.preventDefault();
      var qty = Math.max(1, parseInt(($("[data-qty]", form) || {}).value, 10) || 1);
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending..."; }
      fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id: idInput.value, quantity: qty })
      })
        .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.body.description || "Could not add that one.");
          chirp();
          showToast(
            "<b>You've Got Merch.</b><br>" +
            (res.body.product_title || "Item") + " is in your cart. " +
            '<a href="/cart">View Cart</a>'
          );
          flash("Added to cart. Keyword: CHECKOUT");
          var sbc = $(".statusbar__cell[data-cart-items]");
          if (sbc && typeof res.body.quantity !== "undefined") {
            var n = null;
            try { n = parseInt(($("[data-cart-count]") || {}).textContent, 10); } catch (err) {}
            if (n !== null && !isNaN(n)) sbc.textContent = n + (n === 1 ? " item" : " items");
          }
          return fetch("/cart.js").then(function (r) { return r.json(); });
        })
        .then(function (cart) {
          if (!cart) return;
          $$("[data-cart-count]").forEach(function (el) {
            el.textContent = cart.item_count;
            el.style.display = cart.item_count > 0 ? "" : "none";
          });
        })
        .catch(function (err) {
          showToast("<b>Error.</b><br>" + err.message);
        })
        .then(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Send It"; }
        });
    });
  });

  /* ---------- cart quantity + remove ---------- */
  var qtyTimer = null;
  $$("[data-cart-qty]").forEach(function (input) {
    var form = input.closest("form");
    input.addEventListener("change", function () {
      clearTimeout(qtyTimer);
      /* give spinner/arrow users a beat to finish before the page reloads */
      qtyTimer = setTimeout(function () { if (form) form.requestSubmit ? form.requestSubmit() : form.submit(); }, 1200);
    });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { clearTimeout(qtyTimer); } });
    if (form) {
      $$("button, a", form).forEach(function (el) {
        el.addEventListener("click", function () { clearTimeout(qtyTimer); });
      });
    }
  });

  /* ---------- You've Got Pictures viewer ---------- */
  $$("[data-pics]").forEach(function (root) {
    var img = $("[data-pics-img]", root), cap = $("[data-pics-cap]", root), count = $("[data-pics-count]", root);
    var thumbs = $$("[data-pics-thumb]", root);
    if (!img || !thumbs.length) return;
    var ix = 0, userNav = false;
    function show(i) {
      ix = (i + thumbs.length) % thumbs.length;
      var t = thumbs[ix];
      img.src = t.getAttribute("data-full");
      img.alt = t.getAttribute("data-cap") || "";
      if (cap) cap.textContent = t.getAttribute("data-cap") || "";
      if (count) count.textContent = (ix + 1) + " / " + thumbs.length;
      thumbs.forEach(function (b, j) { b.classList.toggle("on", j === ix); });
      if (userNav && t.scrollIntoView) t.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      /* warm the neighbours so next/prev feels instant */
      [ix + 1, ix - 1].forEach(function (k) {
        var n = thumbs[(k + thumbs.length) % thumbs.length];
        if (n) { var pre = new Image(); pre.src = n.getAttribute("data-full"); }
      });
    }
    thumbs.forEach(function (b, j) { b.addEventListener("click", function () { userNav = true; show(j); }); });
    var prev = $("[data-pics-prev]", root), next = $("[data-pics-next]", root);
    root.addEventListener("click", function () { userNav = true; }, true);
    root.addEventListener("keydown", function () { userNav = true; }, true);
    if (prev) prev.addEventListener("click", function () { show(ix - 1); });
    if (next) next.addEventListener("click", function () { show(ix + 1); });
    img.addEventListener("click", function () { show(ix + 1); });
    document.addEventListener("keydown", function (e) {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") show(ix + 1);
      if (e.key === "ArrowLeft") show(ix - 1);
    });
    /* swipe on touch */
    var x0 = null;
    img.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    img.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) show(dx < 0 ? ix + 1 : ix - 1);
    }, { passive: true });
    show(0);
  });

  /* ---------- Help Topics window ---------- */
  var helpDlg = $("[data-help-dialog]");
  var helpReturnFocus = null;
  var helpBehind = [];
  function helpShow(topic) {
    if (!helpDlg) return;
    helpTopic(topic || "howto");
    helpReturnFocus = document.activeElement;
    helpDlg.hidden = false;
    helpBehind = $$("header > *:not(.help), main, [data-tray], footer");
    helpBehind.forEach(function (el) { el.setAttribute("inert", ""); });
    var first = $('[data-help-topic][aria-selected="true"]', helpDlg);
    if (first) first.focus();
  }
  function helpHide() {
    if (!helpDlg || helpDlg.hidden) return;
    helpDlg.hidden = true;
    helpBehind.forEach(function (el) { el.removeAttribute("inert"); });
    if (helpReturnFocus && helpReturnFocus.focus) helpReturnFocus.focus();
  }
  if (helpDlg) helpDlg.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var f = $$("button:not([disabled]), [href], input, select", helpDlg).filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  function helpTopic(name) {
    $$("[data-help-topic]", helpDlg).forEach(function (b) {
      b.setAttribute("aria-selected", b.getAttribute("data-help-topic") === name ? "true" : "false");
    });
    $$("[data-help-page]", helpDlg).forEach(function (p) {
      p.hidden = p.getAttribute("data-help-page") !== name;
    });
  }
  if (helpDlg) {
    $$("[data-help]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$(".menubar__drop").forEach(function (d) { d.classList.remove("open"); });
        $$("[data-menu]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
        helpShow(btn.getAttribute("data-help"));
      });
    });
    $$("[data-help-topic]", helpDlg).forEach(function (b) {
      b.addEventListener("click", function () { helpTopic(b.getAttribute("data-help-topic")); });
    });
    $$("[data-help-close]", helpDlg).forEach(function (b) { b.addEventListener("click", helpHide); });
    helpDlg.addEventListener("click", function (e) { if (e.target === helpDlg) helpHide(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") helpHide(); });
  }

  /* ---------- keyword bar (with era-correct keywords) ---------- */
  var KEYWORDS = {
    chirp:  function () { chirp(); flash("Keyword CHIRP: you're already here, baby."); },
    garage: function () { window.location.href = "/collections"; },
    vtec:   function () { chirp(); showToast("<b>VTEC just kicked in.</b><br>Yo."); },
    "3rd":  function () { chirp(); flash("Third gear located. Send it."); },
    third:  function () { chirp(); flash("Third gear located. Send it."); },
    aol:    function () { showToast("<b>You've Got Merch.</b><br>Welcome back to 1999."); },
    honda:  function () { flash("We know. We love them too."); },
    sean:   function () { showToast("<b>Sean1n3rd:</b> i do the send its."); },
    paul:   function () { showToast("<b>ChirpnPaul:</b> me and sean make this stuff between oil changes."); },
    checkout: function () { window.location.href = "/cart"; },
    cart:     function () { window.location.href = "/cart"; },
    merch:    function () { window.location.href = "/collections/all"; },
    "the garage": function () { window.location.href = "/collections"; },
    help:     function () { helpDlg ? helpShow("howto") : showToast("<b>Help</b><br>Have fun. Shift hard. That is the whole manual."); },
    pics:     function () { var a = $(".tbtn[href*='pictures']"); a ? (window.location.href = a.getAttribute("href")) : flash("You've Got Pictures: 47 shots of the same Civic. Gallery coming soon."); },
    pictures: function () { KEYWORDS.pics(); },
    about:    function () { helpDlg ? helpShow("about") : showToast("<b>" + document.title + "</b><br>version 3.0"); },
    keywords: function () { helpDlg ? helpShow("keywords") : flash("Try CHIRP. Or GARAGE. Or MERCH."); }
  };
  var kw = $("[data-keyword-form]");
  if (kw) {
    kw.addEventListener("submit", function (e) {
      var val = (($("input[name=q]", kw) || {}).value || "").trim().toLowerCase();
      if (Object.prototype.hasOwnProperty.call(KEYWORDS, val)) {
        e.preventDefault();
        KEYWORDS[val]();
      }
    });
  }

  /* ---------- nav buttons + sign off ---------- */
  $$("[data-nav]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var dir = btn.getAttribute("data-nav");
      if (dir === "back") history.back();
      else if (dir === "forward") history.forward();
      else window.location.reload();
    });
  });
  $$("[data-signoff]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      try { sessionStorage.removeItem("chirpn3rd-signed-on"); } catch (e) {}
      window.location.href = document.body.hasAttribute("data-customer") ? "/account/logout" : "/";
    });
  });

  /* ---------- IM reply box ---------- */
  var imForm = $("[data-im-form]");
  if (imForm) {
    var imReply = $("[data-im-reply]", imForm);
    var convo = imForm.closest(".win__body") ? $(".convo", imForm.closest(".win__body")) : $(".convo");
    var SLANG = {
      "a/s/l": "old enough to remember dial-up / the garage / yes",
      "asl":   "old enough to remember dial-up / the garage / yes",
      "brb":   "take ur time. the tires aren't going anywhere.",
      "lol":   "it wasn't that funny. buy a shirt.",
      "sup":   "oil changes and merch drops. u?",
      "yo":    "yo. check the new drops.",
      "u up?": "always. someone has to watch the garage."
    };
    imForm.addEventListener("submit", function (e) {
      var val = (imReply.value || "").trim();
      if (!val) {
        e.preventDefault();
        window.location.href = imForm.getAttribute("data-shop-url") || "/collections/all";
        return;
      }
      var key = val.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(SLANG, key)) {
        e.preventDefault();
        if (convo) {
          var you = document.createElement("p");
          you.innerHTML = '<b class="convo__sn convo__sn--you">You:</b> <span class="convo__msg"></span>';
          you.querySelector(".convo__msg").textContent = val;
          convo.appendChild(you);
          var them = document.createElement("p");
          them.innerHTML = '<b class="convo__sn">Chirp\'n3rd:</b> <span class="convo__msg"></span>';
          them.querySelector(".convo__msg").textContent = SLANG[key];
          convo.appendChild(them);
          convo.scrollTop = convo.scrollHeight;
        }
        chirp();
        imReply.value = "";
      }
      /* anything else falls through to a real search */
    });
  }

  /* Send It on the hero: if you typed something, that is what gets sent */
  $$("[data-im-send]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var f = $("[data-im-form]"), inp = f && $("[data-im-reply]", f);
      if (inp && inp.value.trim()) { e.preventDefault(); f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); }
    });
  });

  /* ---------- AIM formatting buttons actually format ---------- */
  $$(".imtools .fmt").forEach(function (btn, ix) {
    var convoEl = btn.closest(".win__body") ? $(".convo", btn.closest(".win__body")) : null;
    if (!convoEl) return;
    var classes = ["im-size-up", "im-size-down", "im-bold", "im-italic", "im-underline"];
    btn.style.cursor = "pointer";
    btn.addEventListener("click", function () {
      convoEl.classList.toggle(classes[ix] || "im-bold");
    });
  });

  /* ---------- 404 bird has an away message ---------- */
  if (document.body.classList.contains("template-404")) {
    var lostBird = $(".template-404 .win img");
    var birdTaps = 0;
    if (lostBird) {
      lostBird.style.cursor = "pointer";
      lostBird.addEventListener("click", function () {
        birdTaps++;
        if (birdTaps === 3) {
          chirp();
          showToast("<b>Auto response from TheBird:</b><br>out chirping 3rd. the page u want prob never existed.");
        }
      });
    }
  }

  /* ---------- idle away message, once per session ---------- */
  var idleTimer = null, idleFired = false;
  function armIdle() {
    if (idleFired) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      idleFired = true;
      showToast("<b>Auto response from ChirpnPaul:</b><br>wrenching. brb.");
    }, 180000);
  }
  ["pointerdown", "keydown", "scroll"].forEach(function (evt) {
    document.addEventListener(evt, armIdle, { passive: true });
  });
  armIdle();

  /* ---------- easter eggs ---------- */
  /* Konami code -> burnout */
  var KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  var kPos = 0;
  document.addEventListener("keydown", function (e) {
    kPos = (e.key === KONAMI[kPos]) ? kPos + 1 : (e.key === KONAMI[0] ? 1 : 0);
    if (kPos === KONAMI.length) {
      kPos = 0;
      chirp();
      document.body.classList.add("is-burnout");
      setTimeout(function () { document.body.classList.remove("is-burnout"); }, 900);
      showToast("<b>CHIRP'N 3RD!</b><br>You found the burnout button. Tires are billable.");
    }
  });

  /* triple-click the toolbar bird -> victory lap */
  var logo = $(".toolbar__logo img");
  if (logo) {
    var pecks = 0, peckTimer = null;
    logo.addEventListener("click", function () {
      pecks++;
      clearTimeout(peckTimer);
      peckTimer = setTimeout(function () { pecks = 0; }, 900);
      if (pecks >= 3) {
        pecks = 0;
        chirp();
        logo.classList.add("is-spinning");
        setTimeout(function () { logo.classList.remove("is-spinning"); }, 1300);
        flash("The bird thanks you for your patronage.");
      }
    });
  }

  /* buddy list Setup tab -> the truth */
  $$(".buddies__tab").forEach(function (tab) {
    if (tab.classList.contains("on")) return;
    tab.style.cursor = "pointer";
    tab.addEventListener("click", function () {
      showToast("<b>Setup</b><br>Settings are wherever Sean left them.");
    });
  });

  /* the clock knows */
  var clockCell = $("[data-clock]");
  if (clockCell) {
    clockCell.style.cursor = "pointer";
    clockCell.addEventListener("click", function () {
      flash("It's always 3rd gear somewhere.");
    });
  }
})();
