// 화면 연결: 상단 버튼 · 사이드바(곰별 명단 · 빈 자리) · 명단 창
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var base = window.BASE, loaded = BT.store.load();
  var plan = loaded.plan, vm = null, view = null;
  var state = { rotated: false, selected: null, search: "", readOnly: false };
  var svg = $("map"), G = BT.render.GROUP;

  function toast(msg) {
    var t = $("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }

  function setDirty(on) { $("dirty").hidden = !on; }
  function persist() { BT.store.save(plan); setDirty(true); }

  function redraw(refit) {
    vm = BT.layout.view(base, plan);
    view = BT.render.draw(svg, base, vm, state);
    if (refit || !BT.interact.hasView()) BT.interact.fit(view); else BT.interact.restore();
    renderSide();
  }

  function renderSide() {
    var q = state.search.trim().toLowerCase(), ul = $("list");
    ul.innerHTML = "";
    var byG = {};
    vm.seats.forEach(function (v) { if (v.name) (byG[v.group] = byG[v.group] || []).push(v); });

    // 행성 버프: 행성마다 버프 받는 인원 수
    vm.seats.filter(function (v) { return v.planet; }).forEach(function (p) {
      var n = vm.seats.filter(function (v) { return v.name && v.buffBy.indexOf(p.name) >= 0; }).length;
      var li = document.createElement("li");
      li.className = "planet-row";
      li.innerHTML = '🪐 <span class="nm"></span><span class="xy">' + p.seat.id + " · 버프 " + n + "명</span>";
      li.querySelector(".nm").textContent = p.name;
      li.onclick = function () { select(p.seat.id, true); };
      ul.appendChild(li);
    });

    BT.layout.GROUPS.forEach(function (g) {
      var list = (byG[g] || []).sort(function (a, b) { return a.grank - b.grank; });
      var zone = base.seats.filter(function (s) { return s.cat === g; }).length;
      if (!list.length && !zone) return;
      var h = document.createElement("li");
      h.className = "group-head";
      h.innerHTML = '<span class="dot"></span>' + G[g].label + " <small>" + list.length + "명 / 구역 " + zone + "자리</small>";
      h.querySelector(".dot").style.background = G[g].color;
      ul.appendChild(h);
      list.forEach(function (v) {
        if (q && v.name.toLowerCase().indexOf(q) < 0) return;
        var li = document.createElement("li");
        li.innerHTML = "<b>" + BT.render.tagOf(v) + '</b> <span class="nm"></span><span class="xy">' + (v.mismatch ? "⚠ " : "") + v.seat.id + "</span>";
        li.querySelector(".nm").textContent = (v.planet ? "🪐 " : "") + v.name + (v.buffBy.length ? " ✦" : "");
        if (state.selected === v.seat.id) li.classList.add("selected");
        li.onclick = function () { select(v.seat.id, true); };
        ul.appendChild(li);
      });
    });

    if (vm.unseated.length) {
      var w = document.createElement("li");
      w.className = "group-head warn";
      w.textContent = "자리 없음 " + vm.unseated.length + "명: " + vm.unseated.join(", ");
      ul.appendChild(w);
    }
    var vacant = vm.seats.filter(function (v) { return !v.name; }).length;
    var bad = vm.seats.filter(function (v) { return v.mismatch; }).length;
    $("count").textContent = plan.members.length + "명 · 빈 자리 " + vacant + (bad ? " · ⚠ 구역 다름 " + bad : "");
  }

  function select(seatId, focus) {
    state.selected = state.selected === seatId && !focus ? null : seatId;
    var v = vm.seats.find(function (x) { return x.seat.id === seatId; });
    state.selected = state.selected && v && v.name ? v.name : null;
    redraw();
    if (focus && v) BT.interact.centerOn(view, v.seat.col + 1, v.seat.row + 1);
  }

  function swap(fromId, toId) {
    var a = plan.assign[fromId], b = plan.assign[toId];
    if (b) plan.assign[fromId] = b; else delete plan.assign[fromId];
    plan.assign[toId] = a;
    persist(); redraw();
    toast(b ? "자리 교환: " + a + " ↔ " + b : "이동: " + a + " → " + toId);
  }

  function assignAll(keep) {
    var r = BT.layout.autoAssign(base, plan.members, plan.groups, keep ? plan.assign : null, plan.planets);
    plan.assign = r.assign;
    if (r.unplaced.length) toast("자리가 모자랍니다: " + r.unplaced.length + "명");
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
    if (!confirm("드래그로 옮긴 자리를 모두 버리고 명단 순서대로 다시 배정할까요?")) return;
    assignAll(false); persist(); redraw(); toast("명단 순서대로 다시 배정했습니다");
  };
  $("btn-export").onclick = function () { BT.store.exportFile(plan); toast("plan.js 저장 → site/data/plan.js 에 덮어쓰고 커밋"); };
  $("btn-reset").onclick = function () {
    if (!confirm("이 브라우저의 편집 내용을 버리고 공유본(plan.js)으로 되돌릴까요?")) return;
    BT.store.clear(); plan = BT.store.clone(window.PLAN); setDirty(false); redraw(true);
  };

  // 명단 창. 한 줄 = "이름 1" / "이름 2" / "이름 12"(둘 다) / "이름 0"(미참여). 번호 없으면 미지정.
  // 행성 버프 인원은 맨 뒤에 * (또는 "행성").
  var CODE = { "1": "A", "2": "B", "12": "AB", "3": "AB", "0": "N" };
  var CODE_OUT = { A: "1", B: "2", AB: "12", N: "0" };
  $("btn-members").onclick = function () {
    var planets = plan.planets || [];
    $("members-text").value = plan.members.map(function (n) {
      var c = CODE_OUT[plan.groups[n] || ""];
      return (c ? n + " " + c : n) + (planets.indexOf(n) >= 0 ? " *" : "");
    }).join("\n");
    $("dlg-members").showModal();
  };
  $("members-apply").onclick = function () {
    var seen = {}, list = [], groups = {}, planets = [];
    $("members-text").value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (line) {
      var p = line.match(/^(.*?)[\s,\t]*(?:\*|★|행성)$/);
      if (p) line = p[1].trim();
      var m = line.match(/^(.*?)[\s,\t]+(?:곰)?(12|1|2|3|0)$/);
      var n = m ? m[1].trim() : line, name = n, k = 2;
      while (seen[name]) name = n + "(" + k++ + ")";
      seen[name] = true; list.push(name);
      groups[name] = m ? CODE[m[2]] : "";
      if (p) planets.push(name);
    });
    if (!list.length) { toast("명단이 비었습니다"); return; }
    plan.members = list; plan.groups = groups; plan.planets = planets;
    assignAll($("members-keep").checked);
    persist(); redraw(); $("dlg-members").close();
    toast(list.length + "명 배정");
  };
  document.querySelectorAll("[data-close]").forEach(function (b) { b.onclick = function () { b.closest("dialog").close(); }; });

  // 범례
  $("legend").innerHTML = BT.layout.GROUPS.map(function (g) {
    return '<span><i style="background:' + G[g].color + '"></i>' + G[g].label + "</span>";
  }).join("") + '<span>🪐 행성 · <i style="background:none;border:2px solid #b388ff"></i>버프 범위</span><span><i style="background:#b7b7b7"></i>깃발</span><span><i style="background:#a67c52"></i>시설</span>';
  $("snapshot").textContent = base.snapshotDate ? "배치도 기준 " + base.snapshotDate : "";

  BT.interact.init(svg, {
    base: function () { return base; }, view: function () { return view; },
    readOnly: function () { return state.readOnly; },
    select: function (id) { select(id, false); }, swap: swap, toast: toast, redraw: function () { redraw(); }
  });

  setDirty(loaded.local);
  redraw(true);
})();
