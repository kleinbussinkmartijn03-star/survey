(function () {
  "use strict";
  var CFG = window.SURVEY_CONFIG;
  var VERSIONS = ["A", "B", "C", "D"];
  var SIDE_IMG = { A: "zijkant-1", B: "zijkant-2", C: "zijkant-3", D: "zijkant-4" };
  var KEY = "dk_versie";
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
    var src = view === "front" ? "assets/img/voorkant.webp" : "assets/img/" + SIDE_IMG[version] + ".webp";
    var img = $("mainImg");
    img.src = src;
    img.alt = view === "front" ? "Voorkant van het pak melk" : "Zijkant van het pak melk";
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
    $("start").hidden = true;
    $("shop").hidden = false;
    $("claimText").textContent = CFG.claims[version];
    $("thumbFront").src = "assets/img/voorkant.webp";
    $("thumbSide").src = "assets/img/" + SIDE_IMG[version] + ".webp";
    setView("front", version);
    var thumbs = document.querySelectorAll(".thumb");
    for (var i = 0; i < thumbs.length; i++) {
      thumbs[i].addEventListener("click", function () { setView(this.getAttribute("data-view"), version); });
    }
    $("nextBtn").addEventListener("click", function () { setView("side", version); });
    $("sideHint").addEventListener("click", function () { setView("side", version); });
    $("prevBtn").addEventListener("click", function () { setView("front", version); });
    // preload the side image so switching is instant
    var pre = new Image(); pre.src = "assets/img/" + SIDE_IMG[version] + ".webp";

    setupSurvey(version);

    window.scrollTo(0, 0);
  }

  // ---------- Questions ----------
  var DONE = "dk_klaar";
  var testMode = /[?&]v=[ABCD]\b/.test(location.search);
  var testSend = /[?&]echt=1\b/.test(location.search);

  function isDone() { try { return localStorage.getItem(DONE) === "1"; } catch (e) { return false; } }
  function showThanks() { $("survey").hidden = true; $("thanks").hidden = false; document.querySelector(".questions .note").hidden = true; }

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
    form.addEventListener("change", function (e) {
      var fs = e.target.closest("fieldset.q");
      if (fs && fs.querySelector("input:checked")) fs.classList.remove("missing");
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
      var btn = $("sendBtn");
      btn.disabled = true; btn.textContent = "Bezig met versturen...";
      var done = function () {
        if (!testMode) { try { localStorage.setItem(DONE, "1"); } catch (err) {} }
        showThanks();
        $("vragen").scrollIntoView({ behavior: "smooth", block: "start" });
      };
      if (testMode && !testSend) { done(); return; }  // test links never write to the sheet
      if (!CFG.endpoint) {
        btn.disabled = false; btn.textContent = "Versturen";
        $("formError").textContent = "De vragenlijst is nog niet gekoppeld. Probeer het later opnieuw.";
        $("formError").hidden = false; return;
      }
      send(res.data).then(done).catch(function () {
        btn.disabled = false; btn.textContent = "Versturen";
        $("formError").textContent = "Versturen lukte niet. Controleer uw internetverbinding en probeer het opnieuw.";
        $("formError").hidden = false;
      });
    });
  }

  // Next participant on a shared device: forget the version and start fresh.
  $("nextPerson").addEventListener("click", function (e) {
    e.preventDefault();
    memory = null;
    try { localStorage.removeItem(KEY); localStorage.removeItem(DONE); } catch (err) {}
    location.replace(location.pathname);
  });

  // Hidden test option for the researcher: ?v=A, ?v=B, ?v=C or ?v=D shows that version without storing it.
  var test = (location.search.match(/[?&]v=([ABCD])\b/) || [])[1];
  var existing = test || load();
  if (existing) {
    showShop(existing);
  } else {
    $("start").hidden = false;
    $("startBtn").addEventListener("click", function () {
      var v = load() || pick();
      save(v);
      showShop(v);
    });
  }
})();
