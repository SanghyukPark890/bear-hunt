// 그리기: SVG 한 장에 격자 · 덫 · 시설 · 성 자리. 1칸 = 1 단위 (시트 셀 좌표).
window.BT = window.BT || {};
BT.render = (function () {
  var NS = "http://www.w3.org/2000/svg";

  // 원본 시트 색 기준
  var GROUP = {
    A: { label: "곰1", color: "#ffd966", pale: "#fff2cc" },
    B: { label: "곰2", color: "#93c47d", pale: "#d9ead3" },
    AB: { label: "곰1·2", color: "#6fa8dc", pale: "#cfe2f3" },
    N: { label: "미참여", color: "#e06666", pale: "#f4cccc" },
    "": { label: "미지정", color: "#ffffff", pale: "#eeeeee" }
  };
  var FIXED = { banner: "#b7b7b7", resource: "#a67c52", hq: "#7f6fb0" };
  var TAG = { farm: "농", mini: "미" };

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // 곰1 3위 → "1-3", 둘 다 → "12-3", 미참여 → "미-3", 미지정 → "#전체순위"
  function tagOf(v) {
    var p = { A: "1-", B: "2-", AB: "12-", N: "미-" }[v.group];
    return p ? p + v.grank : "#" + v.rank;
  }

  function bounds(base) {
    var all = base.traps.concat(base.fixed, base.seats);
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    all.forEach(function (o) {
      minX = Math.min(minX, o.col); minY = Math.min(minY, o.row);
      maxX = Math.max(maxX, o.col + o.w); maxY = Math.max(maxY, o.row + o.h);
    });
    var p = 2;
    return { x: minX - p, y: minY - p, w: maxX - minX + p * 2, h: maxY - minY + p * 2 };
  }

  // 회전 시점: 45도 돌려 게임 화면(마름모)처럼. 글자는 바로 세운다.
  function makeView(b, rotated) {
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2, a = rotated ? Math.PI / 4 : 0;
    var cos = Math.cos(a), sin = Math.sin(a);
    return {
      rotated: rotated,
      transform: rotated ? "rotate(45 " + cx + " " + cy + ")" : "",
      toSvg: function (x, y) {
        var dx = x - cx, dy = y - cy;
        return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
      }
    };
  }

  function label(parent, view, x, y, text, cls) {
    var t = el("text", { x: x, y: y, "class": cls }, parent);
    if (view.rotated) t.setAttribute("transform", "rotate(-45 " + x + " " + y + ")");
    t.textContent = text;
    return t;
  }

  function short(name, n) { return name.length > n ? name.slice(0, n - 1) + "…" : name; }

  function draw(svg, base, vm, opts) {
    var b = bounds(base), view = makeView(b, opts.rotated);
    svg.innerHTML = "";

    var defs = el("defs", {}, svg);
    var pat = el("pattern", { id: "grid", width: 1, height: 1, patternUnits: "userSpaceOnUse" }, defs);
    el("path", { d: "M1 0H0V1", "class": "grid-line" }, pat);

    var world = el("g", { id: "world", transform: view.transform }, svg);
    el("rect", { x: b.x, y: b.y, width: b.w, height: b.h, fill: "url(#grid)", "class": "ground" }, world);

    base.fixed.forEach(function (f) {
      var g = el("g", { "class": "fixed fixed-" + f.type }, world);
      el("rect", { x: f.col + 0.05, y: f.row + 0.05, width: f.w - 0.1, height: f.h - 0.1, fill: FIXED[f.type] || "#888" }, g);
      if (f.w > 1) label(g, view, f.col + f.w / 2, f.row + f.h / 2, short(f.name.replace(/^연맹 /, ""), 5), "fixed-name");
      el("title", {}, g).textContent = f.name + " (" + f.id + ")";
    });

    base.traps.forEach(function (t) {
      var g = el("g", { "class": "trap" }, world);
      el("rect", { x: t.col, y: t.row, width: t.w, height: t.h }, g);
      label(g, view, t.col + t.w / 2, t.row + t.h / 2, t.name, "trap-name");
    });

    var q = (opts.search || "").trim().toLowerCase();
    vm.seats.forEach(function (v) {
      var s = v.seat, gi = GROUP[s.cat] || GROUP[""];
      var hit = q && v.name && v.name.toLowerCase().indexOf(q) >= 0;
      var cls = "seat" + (v.name ? " city" : " vacant") + (v.mismatch ? " mismatch" : "") + (v.planet ? " planet" : "") + (v.buffBy.length ? " buffed" : "") +
        (opts.selected && opts.selected === v.name ? " selected" : "") + (hit ? " hit" : "") + (q && !hit ? " dim" : "");
      var g = el("g", { "class": cls, transform: "translate(" + s.col + " " + s.row + ")", "data-seat": s.id }, world);
      var fill = v.name ? (GROUP[v.group] || GROUP[""]).color : gi.pale;
      el("rect", { x: 0.06, y: 0.06, width: s.w - 0.12, height: s.h - 0.12, rx: 0.15, fill: fill, stroke: gi.color }, g);
      if (v.name) {
        label(g, view, s.w / 2, s.h / 2 - 0.4, tagOf(v), "city-rank");
        label(g, view, s.w / 2, s.h / 2 + 0.1, short(v.name, 7), "city-name");
      } else {
        label(g, view, s.w / 2, s.h / 2 - 0.15, "빈 자리", "seat-empty");
      }
      label(g, view, s.w / 2, s.h / 2 + 0.6, s.id, "city-coord");
      if (v.planet) label(g, view, s.w - 0.35, 0.35, "🪐", "seat-planet");
      (s.tags || []).forEach(function (t, i) {
        label(g, view, 0.35 + i * 0.4, 0.35, TAG[t] || t, "seat-tag");
      });
      el("title", {}, g).textContent = (v.name ? tagOf(v) + " " + v.name + "\n" : "빈 자리\n") +
        "자리 " + s.id + " · 구역 " + gi.label + (v.mismatch ? "\n⚠ 참여 곰과 구역이 다름" : "") +
        (v.planet ? "\n🪐 행성 버프 제공" : "") + (v.buffBy.length ? "\n🪐 버프 받음: " + v.buffBy.join(", ") : "");
      v.el = g;
    });

    var pts = [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].map(function (p) { return view.toSvg(p[0], p[1]); });
    var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    view.fit = { x: Math.min.apply(null, xs), y: Math.min.apply(null, ys) };
    view.fit.w = Math.max.apply(null, xs) - view.fit.x;
    view.fit.h = Math.max.apply(null, ys) - view.fit.y;
    view.world = world;
    return view;
  }

  return { draw: draw, tagOf: tagOf, GROUP: GROUP };
})();
