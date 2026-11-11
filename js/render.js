// 그리기: SVG 한 장에 격자 · 덫 · 성. 1칸 = 1 단위.
window.BT = window.BT || {};
BT.render = (function () {
  var NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function colorOf(cfg, c) { return cfg.groupColors[c.group] || cfg.groupColors[""]; }

  // 곰1 3위 → "1-3", 그룹 없으면 전체 순번
  function tagOf(cfg, c) {
    var idx = cfg.traps.findIndex(function (t) { return t.id === c.group; });
    return idx >= 0 ? (idx + 1) + "-" + c.grank : "#" + c.rank;
  }

  function bounds(cfg, cities) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    function add(x, y, w, h) {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
    }
    cfg.traps.forEach(function (t) { var r = BT.layout.trapRect(t, cfg.trapSize); add(r.x, r.y, r.w, r.h); });
    cities.forEach(function (c) { add(c.x, c.y, cfg.citySize, cfg.citySize); });
    var p = 4;
    return { x: minX - p, y: minY - p, w: maxX - minX + p * 2, h: maxY - minY + p * 2 };
  }

  // 회전 시점: 격자를 45도 돌려 게임 화면(마름모)처럼 본다. 글자는 바로 세운다.
  function makeView(b, rotated) {
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2, a = rotated ? Math.PI / 4 : 0;
    var cos = Math.cos(a), sin = Math.sin(a);
    return {
      rotated: rotated, cx: cx, cy: cy,
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

  function draw(svg, plan, cities, opts) {
    var cfg = plan.config, s = cfg.citySize;
    var b = bounds(cfg, cities), view = makeView(b, opts.rotated);
    svg.innerHTML = "";

    var defs = el("defs", {}, svg);
    var pat = el("pattern", { id: "grid", width: 1, height: 1, patternUnits: "userSpaceOnUse" }, defs);
    el("path", { d: "M1 0H0V1", "class": "grid-line" }, pat);

    var world = el("g", { id: "world", transform: view.transform }, svg);
    el("rect", { x: b.x, y: b.y, width: b.w, height: b.h, fill: "url(#grid)", "class": "ground" }, world);

    cfg.traps.forEach(function (t) {
      var r = BT.layout.trapRect(t, cfg.trapSize);
      var g = el("g", { "class": "trap" }, world);
      el("rect", { x: r.x, y: r.y, width: r.w, height: r.h }, g);
      label(g, view, r.x + r.w / 2, r.y + r.h / 2 - 0.2, "곰" + (cfg.traps.indexOf(t) + 1), "trap-name");
      label(g, view, r.x + r.w / 2, r.y + r.h / 2 + 0.6, "X:" + t.x + " Y:" + t.y, "trap-coord");
    });

    var q = (opts.search || "").trim().toLowerCase();
    cities.forEach(function (c) {
      var hit = q && c.name.toLowerCase().indexOf(q) >= 0;
      var cls = "city" + (opts.selected === c.name ? " selected" : "") + (hit ? " hit" : "") + (q && !hit ? " dim" : "");
      var g = el("g", { "class": cls, transform: "translate(" + c.x + " " + c.y + ")", "data-name": c.name }, world);
      el("rect", { x: 0.05, y: 0.05, width: s - 0.1, height: s - 0.1, rx: 0.15, fill: colorOf(cfg, c) }, g);
      label(g, view, s / 2, s / 2 - 0.35, tagOf(cfg, c), "city-rank");
      label(g, view, s / 2, s / 2 + 0.15, short(c.name, 7), "city-name");
      label(g, view, s / 2, s / 2 + 0.62, c.x + "," + c.y, "city-coord");
      var d = BT.layout.trapDists(c.x + s / 2, c.y + s / 2, cfg.traps)
        .map(function (v, i) { return "곰" + (i + 1) + " " + v.toFixed(1); }).join(" / ");
      el("title", {}, g).textContent = tagOf(cfg, c) + " " + c.name + "\nX:" + c.x + " Y:" + c.y + "\n덫 거리 " + d;
      c.el = g;
    });

    // 회전 반영한 전체 영역
    var pts = [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].map(function (p) { return view.toSvg(p[0], p[1]); });
    var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    view.fit = { x: Math.min.apply(null, xs), y: Math.min.apply(null, ys) };
    view.fit.w = Math.max.apply(null, xs) - view.fit.x;
    view.fit.h = Math.max.apply(null, ys) - view.fit.y;
    view.world = world;
    return view;
  }

  return { draw: draw, colorOf: colorOf, tagOf: tagOf };
})();
