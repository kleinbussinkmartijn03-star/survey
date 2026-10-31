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
  }

  // The claim box gets the height of the longest claim at the current width,
  // so the layout below it is identical in all four versions.
  function equaliseClaimBox() {
    var box = $("claimBox"), m = $("measure");
    box.style.minHeight = "";
    m.style.width = box.getBoundingClientRect().width + "px";
    var max = 0;
    for (var i = 0; i < VERSIONS.length; i++) {
      m.innerHTML = '<p></p>';
      m.firstChild.textContent = CFG.claims[VERSIONS[i]];
      max = Math.max(max, m.getBoundingClientRect().height);
    }
    box.style.minHeight = Math.ceil(max) + "px";
  }

  function showShop(version) {
    $("start").hidden = true;
    $("shop").hidden = false;
    $("claimText").textContent = CFG.claims[version];
    $("thumbFront").src = "assets/img/voorkant.webp";
    $("thumbSide").src = "assets/img/" + SIDE_IMG[version] + ".webp";
    setView("side", version);
    var thumbs = document.querySelectorAll(".thumb");
    for (var i = 0; i < thumbs.length; i++) {
      thumbs[i].addEventListener("click", function () { setView(this.getAttribute("data-view"), version); });
    }

    var url = CFG.forms[version];
    var slot = $("formSlot");
    if (url) {
      var f = document.createElement("iframe");
      f.src = url;
      f.title = "Vragenlijst";
      f.setAttribute("loading", "lazy");
      f.setAttribute("allowfullscreen", "");
      slot.appendChild(f);
    } else {
      slot.innerHTML = '<p class="form-missing">De vragenlijst wordt hier binnenkort geplaatst.</p>';
    }

    var measure = function () { equaliseClaimBox(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure); else measure();
    var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(measure, 120); });
    window.scrollTo(0, 0);
  }

  var existing = load();
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
