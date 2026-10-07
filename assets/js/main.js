/* Grab AI Tool client-side logic. TOOLS array is defined in tools.js (generated). */
(function () {
  "use strict";

  function starText(rating) {
    var full = Math.round(rating);
    var s = "";
    for (var i = 1; i <= 5; i++) s += i <= full ? "★" : "☆";
    return s;
  }

  function badgeClass(model) {
    model = (model || "").toLowerCase();
    if (model === "free") return "badge free";
    if (model === "paid") return "badge paid";
    return "badge";
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var VERIFIED = '<span class="verified" title="Verified listing \u2014 reviewed by Grab AI Tool editors">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path fill="#2563eb" d="M12.00,0.50L14.48,2.73L17.75,2.04L18.79,5.21L21.96,6.25L21.27,9.52L23.50,12.00L21.27,14.48L21.96,17.75L18.79,18.79L17.75,21.96L14.48,21.27L12.00,23.50L9.52,21.27L6.25,21.96L5.21,18.79L2.04,17.75L2.73,14.48L0.50,12.00L2.73,9.52L2.04,6.25L5.21,5.21L6.25,2.04L9.52,2.73Z"/>' +
    '<path d="M7.2,12.2l3.2,3.2L16.8,8.6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';

  function logoHtml(t, root) {
    if (t.has_logo) {
      return '<img class="tool-logo" src="' + root + 'assets/img/logos/' + esc(t.slug) + '.png" alt="' + esc(t.name) + ' logo" loading="lazy">';
    }
    return '<div class="avatar" style="--ac:' + esc(t.color) + '">' + esc(t.name.charAt(0)) + "</div>";
  }

  function toolCard(t, root) {
    root = root || "";
    var tags = (t.tags || []).map(function (g) { return "<span>#" + esc(g) + "</span>"; }).join("");
    return (
      '<article class="tool-card" id="tool-' + esc(t.slug) + '">' +
      '<div class="tc-head">' +
      logoHtml(t, root) +
      '<div class="tc-title"><h3><a href="' + root + "tools/" + esc(t.slug) + '.html">' + esc(t.name) + "</a>" + VERIFIED + "</h3>" +
      '<span class="tc-cat">' + esc(t.category || "") + "</span></div>" +
      '<span class="' + badgeClass(t.pricing_model) + '">' + esc(t.pricing_model) + "</span>" +
      "</div>" +
      '<p class="tagline">' + esc(t.tagline) + "</p>" +
      '<div class="tags">' + tags + "</div>" +
      '<div class="tc-foot">' +
      '<div class="stars">' + starText(t.editorial_rating) + "<span>" + t.editorial_rating.toFixed(1) + "</span></div>" +
      '<div class="tc-actions">' +
      '<button class="cmp-toggle" data-cmp="' + esc(t.slug) + '" aria-label="Add ' + esc(t.name) + ' to compare">＋ Compare</button>' +
      '<a class="tc-review" href="' + root + "tools/" + esc(t.slug) + '.html">Review \u2192</a>' +
      '<a class="btn btn-outline btn-sm" href="' + esc(t.official_url) + '" target="_blank" rel="noopener sponsored">Visit Site</a>' +
      "</div></div>" +
      "</article>"
    );
  }

  /* ---------- explorer: search + filter + sort (homepage) ---------- */
  function initExplorer(root) {
    var grid = document.getElementById("explorer-grid");
    if (!grid || typeof TOOLS === "undefined") return;
    var q = document.getElementById("explorer-q");
    var sortSel = document.getElementById("explorer-sort");
    var count = document.getElementById("explorer-count");
    var pills = document.querySelectorAll("#explorer-filters button");
    var model = "All";

    pills.forEach(function (b) {
      b.addEventListener("click", function () {
        pills.forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        model = b.getAttribute("data-model");
        render();
      });
    });

    function matches(t) {
      var query = (q.value || "").trim().toLowerCase();
      if (model !== "All" && t.pricing_model !== model) return false;
      if (!query) return true;
      var hay = (t.name + " " + t.tagline + " " + t.description.join(" ") + " " + (t.tags || []).join(" ") + " " + t.category).toLowerCase();
      return query.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
    }

    function render() {
      var list = TOOLS.filter(matches);
      var sort = sortSel.value;
      if (sort === "rating") list.sort(function (a, b) { return b.editorial_rating - a.editorial_rating; });
      else if (sort === "name") list.sort(function (a, b) { return a.name.localeCompare(b.name); });
      else list.sort(function (a, b) { return b.bookmarks - a.bookmarks; }); // popular
      grid.innerHTML = list.map(function (t) { return toolCard(t, root); }).join("");
      count.textContent = list.length + (list.length === 1 ? " tool" : " tools") + " found";
    }

    q.addEventListener("input", render);
    sortSel.addEventListener("change", render);
    render();

    // expose so hero search can drive it
    window.__tpExplorer = {
      setQuery: function (v) { q.value = v; render(); }
    };
  }

  /* ---------- hero search -> explorer ---------- */
  function initHeroSearch() {
    var form = document.getElementById("hero-search-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = document.getElementById("hero-search-input").value;
      var target = document.getElementById("explore");
      if (window.__tpExplorer) window.__tpExplorer.setQuery(v);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------- header expanding search ---------- */
  function initHeaderSearch() {
    var btn = document.getElementById("search-toggle");
    var wrap = document.getElementById("header-search");
    if (!btn || !wrap) return;
    var input = wrap.querySelector("input");
    btn.addEventListener("click", function () {
      wrap.classList.toggle("open");
      if (wrap.classList.contains("open")) input.focus();
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        var v = input.value;
        var target = document.getElementById("explore");
        if (window.__tpExplorer) window.__tpExplorer.setQuery(v);
        else { window.location.href = "#explore"; }
        if (target) target.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  /* ---------- newsletter + contact placeholders ---------- */
  function initForms() {
    document.querySelectorAll("[data-real-form]").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var body = new URLSearchParams(new FormData(f)).toString();
        fetch(f.action, { method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
          body: body })
        .then(function (r) { if (!r.ok) throw new Error("send failed");
          f.style.display = "none";
          var thanks = f.parentElement.querySelector(".nl-thanks, .form-thanks");
          if (thanks) thanks.style.display = "block";
        })
        .catch(function () { f.submit(); });
      });
    });
    document.querySelectorAll("[data-nl-form]").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var thanks = f.parentElement.querySelector(".nl-thanks, .form-thanks");
        f.style.display = "none";
        if (thanks) thanks.style.display = "block";
      });
    });
  }

  /* ---------- share buttons (tool pages) ---------- */
  function initShare() {
    var bar = document.querySelector(".share-bar");
    if (!bar) return;
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-share]");
      if (!btn) return;
      var net = btn.getAttribute("data-share");
      var url = window.location.href;
      var text = document.title;
      if (net === "copy") {
        var done = function () {
          btn.classList.add("copied");
          var old = btn.getAttribute("aria-label");
          btn.setAttribute("aria-label", "Link copied!");
          setTimeout(function () { btn.classList.remove("copied"); btn.setAttribute("aria-label", old); }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, done);
        } else {
          var i = document.createElement("input");
          i.value = url; document.body.appendChild(i); i.select();
          try { document.execCommand("copy"); } catch (err) {}
          document.body.removeChild(i); done();
        }
        return;
      }
      var u = encodeURIComponent(url), t = encodeURIComponent(text);
      var links = {
        whatsapp: "https://wa.me/?text=" + t + "%20" + u,
        x: "https://twitter.com/intent/tweet?text=" + t + "&url=" + u,
        facebook: "https://www.facebook.com/sharer/sharer.php?u=" + u,
        linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=" + u
      };
      if (links[net]) window.open(links[net], "_blank", "noopener,width=640,height=560");
    });
  }

  /* ---------- compare: tray + selection (max 3, persisted) ---------- */
  var CMP_KEY = "tp_compare";
  function cmpGet() {
    try { var a = JSON.parse(localStorage.getItem(CMP_KEY)); return Array.isArray(a) ? a.slice(0, 3) : []; }
    catch (e) { return []; }
  }
  function cmpSet(a) { try { localStorage.setItem(CMP_KEY, JSON.stringify(a)); } catch (e) {} }
  function cmpBySlug(slug) {
    if (typeof TOOLS === "undefined") return null;
    for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i].slug === slug) return TOOLS[i];
    return null;
  }
  function cmpNudge() {
    var tray = document.getElementById("cmp-tray");
    if (!tray) return;
    tray.classList.remove("cmp-nudge"); void tray.offsetWidth; tray.classList.add("cmp-nudge");
  }
  function cmpSyncButtons() {
    var sel = cmpGet();
    document.querySelectorAll("[data-cmp]").forEach(function (b) {
      var on = sel.indexOf(b.getAttribute("data-cmp")) >= 0;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.innerHTML = on ? "✓ Added" : "＋ Compare";
    });
  }
  function cmpRender(root) {
    var tray = document.getElementById("cmp-tray");
    if (!tray) return;
    var sel = cmpGet().map(cmpBySlug).filter(Boolean);
    var items = document.getElementById("cmp-tray-items");
    items.innerHTML = sel.map(function (t) {
      return '<span class="cmp-chip" title="' + esc(t.name) + '">' + logoHtml(t, root) +
        '<button data-cmp-remove="' + esc(t.slug) + '" aria-label="Remove ' + esc(t.name) + '">×</button></span>';
    }).join("");
    var go = document.getElementById("cmp-go");
    go.textContent = "Compare Now (" + sel.length + ")";
    go.href = root + "compare.html?tools=" + sel.map(function (t) { return t.slug; }).join(",");
    go.classList.toggle("disabled", sel.length < 2);
    tray.hidden = sel.length === 0;
    cmpSyncButtons();
  }
  function initCompare(root) {
    if (typeof TOOLS === "undefined") return;
    var tray = document.createElement("div");
    tray.id = "cmp-tray"; tray.hidden = true;
    tray.innerHTML = '<div class="cmp-tray-inner">' +
      '<span class="cmp-tray-label">Compare:</span>' +
      '<div class="cmp-tray-items" id="cmp-tray-items"></div>' +
      '<a class="btn btn-primary btn-sm disabled" id="cmp-go" href="#">Compare Now (0)</a>' +
      '<button class="cmp-clear" id="cmp-clear">Clear</button></div>';
    document.body.appendChild(tray);
    document.addEventListener("click", function (e) {
      var tgl = e.target.closest("[data-cmp]");
      if (tgl) {
        var slug = tgl.getAttribute("data-cmp");
        var sel = cmpGet();
        var i = sel.indexOf(slug);
        if (i >= 0) sel.splice(i, 1);
        else {
          if (sel.length >= 3) { cmpNudge(); return; }
          sel.push(slug);
        }
        cmpSet(sel); cmpRender(root);
        return;
      }
      var rm = e.target.closest("[data-cmp-remove]");
      if (rm) {
        var rslug = rm.getAttribute("data-cmp-remove");
        cmpSet(cmpGet().filter(function (s) { return s !== rslug; }));
        cmpRender(root);
        return;
      }
      if (e.target.closest("#cmp-clear")) { cmpSet([]); cmpRender(root); }
    });
    var go = document.getElementById("cmp-go");
    go.addEventListener("click", function (e) { if (go.classList.contains("disabled")) e.preventDefault(); });
    cmpRender(root);
    var grid = document.getElementById("explorer-grid");
    if (grid && window.MutationObserver) {
      new MutationObserver(function () { cmpSyncButtons(); }).observe(grid, { childList: true });
    }
  }

  /* ---------- quiz: AI Tool Finder ---------- */
  function initQuiz(root) {
    var qbody = document.getElementById("quiz-body");
    if (!qbody || typeof TOOLS === "undefined") return;
    var steps = Array.prototype.slice.call(qbody.querySelectorAll(".quiz-step"));
    var fill = document.getElementById("quiz-fill");
    var label = document.getElementById("quiz-step-label");
    var back = document.getElementById("quiz-back");
    var results = document.getElementById("quiz-results");
    var ans = {};
    var cur = 0;
    var CAT_NAMES = {};
    TOOLS.forEach(function (t) { CAT_NAMES[t.category_slug] = t.category; });
    var BUDGET_LABEL = { Free: "Free only", Freemium: "Free or freemium", Paid: "Any price" };
    function quizCard(t, reason) {
      return '<article class="tool-card quiz-result-card">' +
        '<div class="tc-head">' + logoHtml(t, root) +
        '<div class="tc-title"><h3><a href="' + root + "tools/" + esc(t.slug) + '.html">' + esc(t.name) + "</a>" + VERIFIED + "</h3>" +
        '<span class="tc-cat">' + esc(t.category || "") + "</span></div>" +
        '<span class="' + badgeClass(t.pricing_model) + '">' + esc(t.pricing_model) + "</span></div>" +
        '<p class="tagline">' + esc(t.tagline) + "</p>" +
        '<p class="quiz-why"><strong>Why it matches:</strong> ' + reason + "</p>" +
        '<div class="tc-foot"><div class="stars">' + starText(t.editorial_rating) + "<span>" + t.editorial_rating.toFixed(1) + "</span></div>" +
        '<div class="tc-actions"><a class="tc-review" href="' + root + "tools/" + esc(t.slug) + '.html">Review \u2192</a>' +
        '<a class="btn btn-outline btn-sm" href="' + esc(t.official_url) + '" target="_blank" rel="noopener sponsored">Visit Site</a>' +
        "</div></div></article>";
    }
    function finish() {
      var allowed = ans.budget === "Free" ? ["Free"] :
        ans.budget === "Freemium" ? ["Free", "Freemium"] : ["Free", "Freemium", "Paid"];
      var pool = TOOLS.filter(function (t) {
        return t.category_slug === ans.cat && allowed.indexOf(t.pricing_model) >= 0;
      });
      var relaxed = false;
      if (!pool.length) {
        pool = TOOLS.filter(function (t) { return t.category_slug === ans.cat; });
        relaxed = true;
      }
      var scored = pool.map(function (t) {
        var s = t.editorial_rating;
        if (ans.priority === "value" && (t.pricing_model === "Free" || t.pricing_model === "Freemium")) s += 0.4;
        return { t: t, s: s };
      });
      scored.sort(function (a, b) { return (b.s - a.s) || (b.t.bookmarks - a.t.bookmarks); });
      var top = scored.slice(0, 3);
      var catName = CAT_NAMES[ans.cat] || ans.cat;
      var head = '<div class="quiz-results-head"><span class="eyebrow">Your matches</span>' +
        "<h2>Top 3 tools for you</h2>" +
        '<p class="quiz-summary">' + esc(catName) + " · " + esc(BUDGET_LABEL[ans.budget] || ans.budget) +
        (relaxed ? ' · <em>no exact budget match, showing closest picks</em>' : "") + "</p></div>";
      var cards = top.map(function (o, i) {
        var t = o.t;
        var reason = (i === 0 ? "Highest-rated match for your answers" : "Strong alternative pick") +
          " — " + esc(t.category) + " · " + esc(t.pricing_model) + " · rated " + t.editorial_rating.toFixed(1) + "/5 by our editors";
        return quizCard(t, reason);
      }).join("");
      results.innerHTML = head + '<div class="cards-grid quiz-results-grid">' + cards + "</div>" +
        '<div class="quiz-retake"><button class="btn btn-ghost" id="quiz-retake">↻ Retake quiz</button></div>';
      qbody.hidden = true; back.hidden = true;
      fill.style.width = "100%"; label.textContent = "Done — your matches";
      results.hidden = false;
      results.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("quiz-retake").addEventListener("click", function () {
        ans = {}; results.hidden = true; qbody.hidden = false; show(0);
      });
    }
    function show(i) {
      cur = i;
      steps.forEach(function (s, idx) { s.hidden = idx !== i; });
      fill.style.width = (i / 4 * 100) + "%";
      label.textContent = "Step " + (i + 1) + " of 4";
      back.hidden = i === 0;
      qbody.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    qbody.addEventListener("click", function (e) {
      var opt = e.target.closest(".quiz-opt");
      if (!opt) return;
      ans[opt.getAttribute("data-q")] = opt.getAttribute("data-v");
      if (cur < steps.length - 1) show(cur + 1); else finish();
    });
    back.addEventListener("click", function () { if (cur > 0) show(cur - 1); });
    show(0);
  }

  /* ---------- compare page ---------- */
  function initComparePage(root) {
    var shell = document.getElementById("compare-shell");
    if (!shell || typeof TOOLS === "undefined") return;
    var params = new URLSearchParams(window.location.search);
    var slugs = (params.get("tools") || "").split(",").map(function (s) { return s.trim(); })
      .filter(function (s, i, a) { return s && a.indexOf(s) === i; }).slice(0, 3);
    var tools = slugs.map(cmpBySlug).filter(Boolean);
    if (tools.length < 2) {
      shell.innerHTML = '<div class="cmp-empty"><h2>Select at least 2 tools</h2>' +
        '<p>Tap the ＋ Compare button on any tool card, then come back here to see them side by side.</p>' +
        '<a class="btn btn-primary" href="' + root + 'index.html#explore">Browse AI Tools</a></div>';
      return;
    }
    function li(items) {
      return "<ul>" + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    }
    var head = "<tr><th></th>" + tools.map(function (t) {
      return '<th><div class="cmp-tool">' + logoHtml(t, root) +
        '<div><a href="' + root + "tools/" + esc(t.slug) + '.html">' + esc(t.name) + "</a>" + VERIFIED + "</div></div></th>";
    }).join("") + "</tr>";
    function row(label, cells) {
      return "<tr><th>" + label + "</th>" + cells.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>";
    }
    var html = '<div class="cmp-table-wrap"><table class="cmp-table">' + head +
      row("Editorial rating", tools.map(function (t) {
        return '<span class="stars">' + starText(t.editorial_rating) + "</span> <strong>" + t.editorial_rating.toFixed(1) + "/5</strong>";
      })) +
      row("Pricing", tools.map(function (t) {
        return '<span class="' + badgeClass(t.pricing_model) + '">' + esc(t.pricing_model) + "</span>";
      })) +
      row("Price note", tools.map(function (t) { return esc(t.price_note || "—"); })) +
      row("Category", tools.map(function (t) { return esc(t.category || "—"); })) +
      row("Key features", tools.map(function (t) { return li((t.key_features || []).slice(0, 5)); })) +
      row("Pros", tools.map(function (t) { return li((t.pros || []).slice(0, 3)); })) +
      row("Cons", tools.map(function (t) { return li((t.cons || []).slice(0, 3)); })) +
      row("", tools.map(function (t) {
        return '<a class="btn btn-primary btn-sm" href="' + esc(t.official_url) + '" target="_blank" rel="noopener sponsored">Visit ' + esc(t.name) + "</a>";
      })) +
      "</table></div>" +
      '<p class="cmp-note">Ratings are our editors\u2019 independent scores. Prices are approximate — always confirm current pricing on the official site.</p>';
    shell.innerHTML = html;
  }

  /* ---------- cost calculator: AI Tool Cost Calculator ---------- */
  function initCostCalc(root) {
    var wrap = document.getElementById("calc-tools");
    if (!wrap) return;
    var checks = Array.prototype.slice.call(wrap.querySelectorAll(".calc-check"));
    var bar = document.getElementById("calc-bar");
    var advisor = document.getElementById("calc-advisor");
    var empty = document.getElementById("calc-empty");
    var share = document.getElementById("calc-share");
    var clearBtn = document.getElementById("calc-clear");
    function money(v) { return "$" + (Math.round(v * 100) / 100).toLocaleString("en-US"); }
    function priceOf(t) {
      var m = /\$\s?(\d+(?:\.\d+)?)/.exec(t.price_note || "");
      return m ? parseFloat(m[1]) : null;
    }
    function ticked() {
      return checks.filter(function (c) { return c.checked; }).map(function (c) {
        return { slug: c.getAttribute("data-slug"), name: c.getAttribute("data-name"),
                 price: parseFloat(c.getAttribute("data-price")),
                 cat: c.getAttribute("data-cat"), catName: c.getAttribute("data-catname"),
                 rating: parseFloat(c.getAttribute("data-rating")) };
      });
    }
    function render() {
      var sel = ticked();
      var monthly = sel.reduce(function (s, t) { return s + t.price; }, 0);
      var yearly = monthly * 12;
      document.getElementById("calc-monthly").textContent = money(monthly);
      document.getElementById("calc-yearly").textContent = money(yearly);
      document.getElementById("calc-count").textContent = sel.length;
      document.getElementById("calc-bar-monthly").textContent = money(monthly) + "/mo";
      document.getElementById("calc-bar-yearly").textContent = money(yearly) + "/yr";
      document.getElementById("calc-bar-count").textContent = sel.length + (sel.length === 1 ? " tool" : " tools");
      var on = sel.length > 0;
      bar.hidden = !on;
      document.body.classList.toggle("calc-bar-on", on);
      empty.hidden = on;
      share.hidden = !on;
      if (on) {
        var line = "I'm spending " + money(monthly) + "/month on AI tools";
        document.getElementById("calc-share-line").textContent = line;
        document.getElementById("calc-x").href = "https://twitter.com/intent/tweet?text=" +
          encodeURIComponent(line + " 💸 How much are you spending? Free calculator: https://grabaitool.github.io/ai-cost-calculator/");
      }
      var byCat = {};
      sel.forEach(function (t) { (byCat[t.cat] = byCat[t.cat] || []).push(t); });
      var notes = [];
      Object.keys(byCat).forEach(function (cat) {
        var list = byCat[cat];
        if (list.length < 2) return;
        var keep = list.slice().sort(function (a, b) { return b.rating - a.rating; })[0];
        var drop = list.filter(function (t) { return t.slug !== keep.slug; });
        var save = drop.reduce(function (s, t) { return s + t.price; }, 0);
        var html = '<div class="calc-advice"><h3>⚠️ Overlap in ' + esc(keep.catName) + "</h3>" +
          "<p>You&rsquo;re paying for " + list.length + " tools in " + esc(keep.catName) + " (" +
          list.map(function (t) { return esc(t.name); }).join(", ") +
          ") — most people only need one in this category. The highest-rated of the ones you ticked is " +
          '<a href="' + root + "tools/" + esc(keep.slug) + '.html">' + esc(keep.name) + "</a> (rated " +
          keep.rating.toFixed(1) + "/5 by our editors). Dropping the rest could save you up to <strong>" +
          money(save) + "/mo</strong>.</p>";
        if (typeof TOOLS !== "undefined") {
          var minTicked = Math.min.apply(null, list.map(function (x) { return x.price; }));
          var alts = TOOLS.filter(function (t) {
            if (t.category_slug !== cat) return false;
            if (sel.some(function (s) { return s.slug === t.slug; })) return false;
            var p = priceOf(t);
            return p !== null && p < minTicked;
          }).sort(function (a, b) { return b.editorial_rating - a.editorial_rating; }).slice(0, 2);
          if (alts.length) {
            html += "<p>Cheaper alternatives from our listings: " + alts.map(function (t) {
              return '<a href="' + root + "tools/" + esc(t.slug) + '.html">' + esc(t.name) +
                "</a> (~" + money(priceOf(t)) + "/mo, rated " + t.editorial_rating.toFixed(1) + "/5)";
            }).join(" · ") + "</p>";
          }
        }
        html += "</div>";
        notes.push(html);
      });
      advisor.innerHTML = notes.join("");
    }
    checks.forEach(function (c) { c.addEventListener("change", render); });
    if (clearBtn) clearBtn.addEventListener("click", function () {
      checks.forEach(function (c) { c.checked = false; });
      render();
    });
    var copyBtn = document.getElementById("calc-copy");
    if (copyBtn) copyBtn.addEventListener("click", function () {
      var line = document.getElementById("calc-share-line").textContent +
        " — via the AI Tool Cost Calculator: https://grabaitool.github.io/ai-cost-calculator/";
      function done() {
        copyBtn.textContent = "Copied ✓";
        setTimeout(function () { copyBtn.textContent = "Copy my result"; }, 2000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(line).then(done, done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = line;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (err) { /* clipboard unavailable */ }
        document.body.removeChild(ta);
        done();
      }
    });
    render();
  }

  /* ---------- mobile nav toggle ---------- */
  function initMobileNav() {
    var btn = document.getElementById("nav-toggle");
    var nav = document.getElementById("mobile-nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        btn.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.body.getAttribute("data-root") || "";
    initExplorer(root);
    initHeroSearch();
    initHeaderSearch();
    initForms();
    initShare();
    initMobileNav();
    initCompare(root);
    initQuiz(root);
    initComparePage(root);
    initCostCalc(root);
  });

  window.__tp = { toolCard: toolCard, starText: starText, esc: esc };
})();
