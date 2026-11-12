(function () {
  "use strict";
  var CFG = window.SURVEY_CONFIG;
  var VERSIONS = ["A", "B", "C", "D"];
  var SIDE_IMG = { A: "zijkant-1", B: "zijkant-2", C: "zijkant-3", D: "zijkant-4" };
  var KEY = "dk_versie";
  var LANG_KEY = "dk_taal";
  var EN = window.SURVEY_EN;
  var lang = "nl";
  function T(s) { return lang === "en" && EN.text[s] ? EN.text[s] : s; }
  function claimsFor() { return lang === "en" ? EN.claims : CFG.claims; }
  function sideImg(version) { return "assets/img/" + (lang === "en" ? "zijkant-en-" : "zijkant-") + SIDE_IMG[version].split("-")[1] + ".webp"; }
  function applyLang() {
    document.documentElement.lang = lang;
    document.title = lang === "en" ? EN.title : "Hoe lezen mensen voedselverpakkingen?";
    var els = document.querySelectorAll("[data-t]");
    for (var i = 0; i < els.length; i++) {
      if (els[i].dataset.nl === undefined) els[i].dataset.nl = els[i].textContent;
      els[i].textContent = T(els[i].dataset.nl);
    }
    var ph = document.querySelectorAll("[data-t-ph]");
    for (var j = 0; j < ph.length; j++) {
      if (ph[j].dataset.nl === undefined) ph[j].dataset.nl = ph[j].placeholder;
      ph[j].placeholder = T(ph[j].dataset.nl);
    }
  }
  function loadLang() { try { var l = localStorage.getItem(LANG_KEY); if (l === "nl" || l === "en") return l; } catch (e) {} return null; }
  function saveLang(l) { try { localStorage.setItem(LANG_KEY, l); } catch (e) {} }
  var memory = null; // fallback when localStorage is blocked

  function load() {
    try { var v = localStorage.getItem(KEY); if (VERSIONS.indexOf(v) > -1) return v; } catch (e) {}
    return memory;
  }
  function save(v) {
    memory = v;
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }
  function pick() {
    // equal chance for A, B, C and D
    return VERSIONS[Math.floor(Math.random() * VERSIONS.length)];
  }

  var $ = function (id) { return document.getElementById(id); };

  function setView(view, version) {
    var src = view === "front" ? "assets/img/voorkant.webp" : sideImg(version);
    var img = $("mainImg");
    img.src = src;
    img.alt = T(view === "front" ? "Voorkant van het pak melk" : "Zijkant van het pak melk");
    var thumbs = document.querySelectorAll(".thumb");
    for (var i = 0; i < thumbs.length; i++) {
      thumbs[i].setAttribute("aria-selected", thumbs[i].getAttribute("data-view") === view ? "true" : "false");
    }
    var dots = document.querySelectorAll(".dots span");
    for (var j = 0; j < dots.length; j++) dots[j].className = dots[j].getAttribute("data-dot") === view ? "on" : "";
    $("prevBtn").disabled = view === "front";
    $("nextBtn").disabled = view === "side";
    $("sideHint").classList.toggle("is-side", view === "side");
  }

  function showShop(version) {
    $("lang").hidden = true;
    $("start").hidden = true;
    $("shop").hidden = false;
    applyLang();
    $("claimText").textContent = claimsFor()[version];
    $("thumbFront").src = "assets/img/voorkant.webp";
    $("thumbSide").src = sideImg(version);
    setView("front", version);
    var thumbs = document.querySelectorAll(".thumb");
    for (var i = 0; i < thumbs.length; i++) {
      thumbs[i].addEventListener("click", function () { setView(this.getAttribute("data-view"), version); });
    }
    $("nextBtn").addEventListener("click", function () { setView("side", version); });
    $("sideHint").addEventListener("click", function () { setView("side", version); });
    $("prevBtn").addEventListener("click", function () { setView("front", version); });
    // preload the side image so switching is instant
    var pre = new Image(); pre.src = sideImg(version);

    setupShop();
    setupSurvey(version);

    window.scrollTo(0, 0);
  }

  // ---------- Shop behaviour (identical in every version) ----------
  function setupShop() {
    var qty = 0;
    function euro(n) { return n.toFixed(2).replace(".", ","); }
    function renderBasket() {
      $("addBtn").hidden = qty > 0;
      $("stepper").hidden = qty === 0;
      $("qty").textContent = qty;
      $("basketCount").hidden = qty === 0;
      $("basketCount").textContent = qty;
      $("basketTotal").textContent = euro(qty * 2.19);
    }
    $("addBtn").addEventListener("click", function () { qty = 1; renderBasket(); });
    $("plusBtn").addEventListener("click", function () { if (qty < 9) qty++; renderBasket(); });
    $("minBtn").addEventListener("click", function () { qty--; renderBasket(); });
    $("favBtn").addEventListener("click", function () {
      this.setAttribute("aria-pressed", this.getAttribute("aria-pressed") === "true" ? "false" : "true");
    });

    // image zoom
    function openZoom() {
      $("lbImg").src = $("mainImg").src;
      $("lbImg").alt = $("mainImg").alt;
      $("lightbox").hidden = false;
      document.body.style.overflow = "hidden";
      var sc = $("lbScroll");
      var centre = function () { sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2; sc.scrollTop = 0; };
      if ($("lbImg").complete) centre(); else $("lbImg").onload = centre;
    }
    function closeZoom() { $("lightbox").hidden = true; document.body.style.overflow = ""; }
    $("zoomBtn").addEventListener("click", openZoom);
    $("mainImg").addEventListener("click", openZoom);
    $("lbClose").addEventListener("click", closeZoom);
    $("lbScroll").addEventListener("click", function (e) { if (e.target === this) closeZoom(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeZoom(); });
  }

  // ---------- Questions ----------
  var DONE = "dk_klaar";
  var testMode = /[?&]v=[ABCD]\b/.test(location.search);
  var testSend = /[?&]echt=1\b/.test(location.search);

  function isDone() { try { return localStorage.getItem(DONE) === "1"; } catch (e) { return false; } }
  function showThanks() { $("survey").hidden = true; $("thanks").hidden = false; document.querySelector(".questions .note").hidden = true; $("progress").hidden = true; $("aboutClaim").hidden = true; }

  function collect(form) {
    var data = { versie: null, website: form.website.value }, missing = [];
    var sets = form.querySelectorAll("fieldset.q");
    for (var i = 0; i < sets.length; i++) {
      var name = sets[i].getAttribute("data-name");
      var picked = sets[i].querySelectorAll("input:checked"), vals = [];
      for (var j = 0; j < picked.length; j++) vals.push(picked[j].value);
      sets[i].classList.toggle("missing", vals.length === 0);
      if (!vals.length) missing.push(sets[i]);
      data[name] = vals.join(";");
    }
    return { data: data, missing: missing };
  }

  function send(data) {
    var body = new URLSearchParams(data).toString();
    var opts = { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body };
    return fetch(CFG.endpoint, opts)
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) throw new Error("rejected"); })
      .catch(function (err) {
        if (err && err.message === "rejected") throw err;
        // Some browsers block reading Google's reply; send again without reading it.
        opts.mode = "no-cors";
        return fetch(CFG.endpoint, opts).then(function () {});
      });
  }

  function setupSurvey(version) {
    var form = $("survey");
    if (isDone() && !testMode) { showThanks(); return; }
    // pointer back to the claim: scroll to the green box and light it up briefly
    $("backToClaim").addEventListener("click", function () {
      var box = $("claimBox");
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      box.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      box.classList.remove("flash");
      void box.offsetWidth;
      box.classList.add("flash");
      setTimeout(function () { box.classList.remove("flash"); }, 3200);
    });
    var total = form.querySelectorAll("fieldset.q").length;
    function progress() {
      var n = 0, sets = form.querySelectorAll("fieldset.q");
      for (var i = 0; i < sets.length; i++) if (sets[i].querySelector("input:checked")) n++;
      $("progressFill").style.width = (100 * n / total) + "%";
      $("progressText").textContent = (lang === "en" ? "{n} of {t} answered" : "{n} van {t} beantwoord").replace("{n}", n).replace("{t}", total);
    }
    progress();
    form.addEventListener("change", function (e) {
      var fs = e.target.closest("fieldset.q");
      if (fs && fs.querySelector("input:checked")) fs.classList.remove("missing");
      progress();
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var res = collect(form);
      $("formError").hidden = true;
      if (res.missing.length) {
        res.missing[0].scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      res.data.versie = version;
      res.data.taal = lang;
      var btn = $("sendBtn");
      btn.disabled = true; btn.textContent = T("Bezig met versturen...");
      var done = function () {
        if (!testMode) { try { localStorage.setItem(DONE, "1"); } catch (err) {} }
        showThanks();
        $("vragen").scrollIntoView({ behavior: "smooth", block: "start" });
      };
      if (testMode && !testSend) { done(); return; }  // test links never write to the sheet
      if (!CFG.endpoint) {
        btn.disabled = false; btn.textContent = T("Versturen");
        $("formError").textContent = T("De vragenlijst is nog niet gekoppeld. Probeer het later opnieuw.");
        $("formError").hidden = false; return;
      }
      send(res.data).then(done).catch(function () {
        btn.disabled = false; btn.textContent = T("Versturen");
        $("formError").textContent = T("Versturen lukte niet. Controleer uw internetverbinding en probeer het opnieuw.");
        $("formError").hidden = false;
      });
    });
  }

  // Next participant on a shared device: forget the version and start fresh.
  $("nextPerson").addEventListener("click", function (e) {
    e.preventDefault();
    memory = null;
    try { localStorage.removeItem(KEY); localStorage.removeItem(DONE); localStorage.removeItem(LANG_KEY); } catch (err) {}
    location.replace(location.pathname);
  });

  // Hidden test option for the researcher: ?v=A to ?v=D shows that version without storing it; add &lang=en for English.
  var test = (location.search.match(/[?&]v=([ABCD])\b/) || [])[1];
  var testLang = (location.search.match(/[?&]lang=(nl|en)\b/) || [])[1];
  var existing = test || load();

  function showStart() {
    $("lang").hidden = true;
    applyLang();
    $("start").hidden = false;
    $("startBtn").addEventListener("click", function () {
      var v = load() || pick();
      save(v);
      showShop(v);
    });
  }

  if (existing) {
    lang = testLang || loadLang() || "nl";
    showShop(existing);
  } else if (loadLang()) {
    lang = loadLang();
    showStart();
  } else {
    $("lang").hidden = false;
    var lb = document.querySelectorAll("[data-lang]");
    for (var k = 0; k < lb.length; k++) {
      lb[k].addEventListener("click", function () {
        lang = this.getAttribute("data-lang");
        saveLang(lang);
        showStart();
      });
    }
  }
})();
