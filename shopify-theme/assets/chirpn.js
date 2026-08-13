/* Chirpn3rd Online — storefront behavior.
   Vanilla, no build step. Everything degrades to plain form posts if JS is off. */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (cents) {
    return (window.Chirpn3rd && window.Chirpn3rd.moneyFormat
      ? window.Chirpn3rd.moneyFormat.replace(/\{\{\s*amount\s*\}\}/, (cents / 100).toFixed(2))
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
      if (!open) { drop.classList.add("open"); btn.setAttribute("aria-expanded", "true"); }
    });
  });
  document.addEventListener("click", function () {
    $$(".menubar__drop").forEach(function (d) { d.classList.remove("open"); });
    $$("[data-menu]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      $$(".menubar__drop").forEach(function (d) { d.classList.remove("open"); });
    }
  });

  /* ---------- toast ---------- */
  var toast = $("[data-toast]"), toastTimer = null;
  function showToast(html) {
    if (!toast) return;
    $("[data-toast-msg]", toast).innerHTML = html;
    toast.classList.add("show");
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
    function sync() {
      var v = match();
      if (!v) {
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Unavailable"; }
        return;
      }
      if (idInput) idInput.value = v.id;
      if (priceEl) {
        priceEl.innerHTML = money(v.price) +
          (v.compare_at_price > v.price ? " <s>" + money(v.compare_at_price) + "</s>" : "");
      }
      if (stockEl) {
        stockEl.innerHTML = v.available
          ? '<span class="stock__dot"></span> In the coop, ships in 2-5 days'
          : '<span class="stock__dot stock__dot--out"></span> Sold out. Sorry bud.';
      }
      if (submitBtn) {
        submitBtn.disabled = !v.available;
        submitBtn.textContent = v.available ? "Send It" : "Sold Out";
      }
      if (history.replaceState && v.id) {
        var url = new URL(window.location.href);
        url.searchParams.set("variant", v.id);
        history.replaceState({}, "", url.toString());
      }
    }
    $$("[data-option]", form).forEach(function (sel) { sel.addEventListener("change", sync); });
    sync();

    /* AJAX add to cart, with a full-page-post fallback on failure */
    form.addEventListener("submit", function (e) {
      if (!window.fetch) return;
      e.preventDefault();
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending..."; }
      fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          id: idInput.value,
          quantity: parseInt(($("[data-qty]", form) || {}).value || 1, 10)
        })
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
  $$("[data-cart-qty]").forEach(function (input) {
    input.addEventListener("change", function () {
      var form = input.closest("form");
      if (form) form.submit();
    });
  });

  /* ---------- keyword bar ---------- */
  var kw = $("[data-keyword-form]");
  if (kw) {
    kw.addEventListener("submit", function (e) {
      var val = ($("input[name=q]", kw) || {}).value || "";
      if (/^\s*chirp\s*$/i.test(val)) {
        e.preventDefault();
        chirp();
        flash("Keyword CHIRP: you're already here, baby.");
      }
    });
  }
})();
