// 화면 연결: 상단 버튼 · 명단 사이드바 · 설정/명단 창
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var loaded = BT.store.load();
  var plan = loaded.plan, cities = [], view = null;
  var state = { rotated: true, selected: null, search: "", readOnly: false };
  var svg = $("map");

  function positionsOf(list) {
    var p = {};
    list.forEach(function (c) { p[c.name] = [c.x, c.y]; });
    return p;
  }

  function toast(msg) {
    var t = $("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  function setDirty(on) { $("dirty").hidden = !on; }

  function recompute() {
    cities = BT.layout.place(plan.config, plan.members, plan.positions);
    plan.positions = positionsOf(cities);
  }

  function redraw(refit) {
    view = BT.render.draw(svg, plan, cities, state);
    if (refit || !BT.interact.hasView()) BT.interact.fit(view); else BT.interact.restore();
    renderList();
  }

  function persist() { BT.store.save(plan); setDirty(true); }

  function renderList() {
    var q = state.search.trim().toLowerCase(), ul = $("list");
    ul.innerHTML = "";
    cities.forEach(function (c) {
      if (q && c.name.toLowerCase().indexOf(q) < 0) return;
      var li = document.createElement("li");
      var tier = BT.render.tierOf(plan.config, c.rank);
      li.innerHTML = '<span class="dot"></span><b>#' + c.rank + '</b> <span class="nm"></span><span class="xy">' + c.x + "," + c.y + "</span>";
      li.querySelector(".dot").style.background = tier.color;
      li.querySelector(".nm").textContent = c.name;
      if (state.selected === c.name) li.classList.add("selected");
      li.onclick = function () { select(c.name, true); };
      ul.appendChild(li);
    });
    $("count").textContent = cities.length + "명";
    $("legend").innerHTML = plan.config.tiers.filter(function (t, i) {
      return i === 0 || plan.config.tiers[i - 1].upTo < cities.length;
    }).map(function (t, i, arr) {
      var from = i === 0 ? 1 : arr[i - 1].upTo + 1, to = Math.min(t.upTo, cities.length);
      return '<span><i style="background:' + t.color + '"></i>' + t.label + " " + from + "~" + to + "</span>";
    }).join("");
  }

  function select(name, focus) {
    state.selected = state.selected === name && !focus ? null : name;
    redraw();
    var c = cities.find(function (v) { return v.name === name; });
    if (focus && c) BT.interact.centerOn(view, c.x + 1, c.y + 1);
  }

  function commit(moves, msg) {
    moves.forEach(function (m) { plan.positions[m[0]] = [m[1], m[2]]; });
    recompute(); persist(); redraw(); toast(msg);
  }

  // 상단 버튼
  $("search").oninput = function (e) { state.search = e.target.value; redraw(); };
  $("btn-rotate").onclick = function () { state.rotated = !state.rotated; redraw(true); };
  $("btn-fit").onclick = function () { BT.interact.fit(view); };
  $("btn-lock").onclick = function () {
    state.readOnly = !state.readOnly;
    this.textContent = state.readOnly ? "🔒 보기 전용" : "✋ 편집 중";
  };
  $("btn-auto").onclick = function () {
    if (!confirm("드래그로 옮긴 자리를 모두 버리고 순서대로 다시 배치할까요?")) return;
    plan.positions = null; recompute(); persist(); redraw(true); toast("순서대로 다시 배치했습니다");
  };
  $("btn-export").onclick = function () { BT.store.exportFile(plan); toast("plan.js 저장 → site/data/plan.js 에 덮어쓰고 커밋"); };
  $("btn-reset").onclick = function () {
    if (!confirm("이 브라우저의 편집 내용을 버리고 공유본(plan.js)으로 되돌릴까요?")) return;
    BT.store.clear(); plan = BT.store.clone(window.PLAN); recompute(); setDirty(false); redraw(true);
  };

  // 명단 창
  $("btn-members").onclick = function () { $("members-text").value = plan.members.join("\n"); $("dlg-members").showModal(); };
  $("members-apply").onclick = function () {
    var seen = {}, list = [];
    $("members-text").value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (n) {
      var name = n, k = 2;
      while (seen[name]) name = n + "(" + k++ + ")";
      seen[name] = true; list.push(name);
    });
    if (!list.length) { toast("명단이 비었습니다"); return; }
    plan.members = list;
    if ($("members-reflow").checked) plan.positions = null;
    recompute(); persist(); redraw(true); $("dlg-members").close();
    toast(list.length + "명 반영");
  };

  // 설정 창 (덫 좌표)
  $("btn-settings").onclick = function () {
    var t = plan.config.traps;
    $("ax").value = t[0].x; $("ay").value = t[0].y; $("bx").value = t[1].x; $("by").value = t[1].y;
    $("gap").value = plan.config.trapGap; $("scoring").value = plan.config.scoring;
    $("dlg-settings").showModal();
  };
  $("settings-apply").onclick = function () {
    var t = plan.config.traps, num = function (id) { return parseInt($(id).value, 10); };
    var dx = num("ax") - t[0].x, dy = num("ay") - t[0].y;
    t[0].x = num("ax"); t[0].y = num("ay"); t[1].x = num("bx"); t[1].y = num("by");
    plan.config.trapGap = Math.max(0, num("gap") || 0);
    plan.config.scoring = $("scoring").value;
    if ($("shift-all").checked && plan.positions) {
      Object.keys(plan.positions).forEach(function (k) { plan.positions[k][0] += dx; plan.positions[k][1] += dy; });
    }
    recompute(); persist(); redraw(true); $("dlg-settings").close();
  };
  document.querySelectorAll("[data-close]").forEach(function (b) { b.onclick = function () { b.closest("dialog").close(); }; });

  BT.interact.init(svg, {
    plan: function () { return plan; }, cities: function () { return cities; }, view: function () { return view; },
    readOnly: function () { return state.readOnly; },
    select: function (n) { select(n, false); }, commit: commit, toast: toast, redraw: function () { redraw(); }
  });

  recompute();
  setDirty(loaded.local);
  redraw(true);
})();
