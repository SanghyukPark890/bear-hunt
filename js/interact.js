// 조작: 휠 확대 · 배경 드래그 이동 · 성 드래그(빈칸 이동 / 다른 성 위면 자리 교환)
window.BT = window.BT || {};
BT.interact = (function () {
  var svg, ctx, vb = null, pan = null, drag = null;

  function setViewBox(b) {
    vb = b;
    svg.setAttribute("viewBox", [b.x, b.y, b.w, b.h].join(" "));
  }

  function clientTo(elm, e) {
    var p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(elm.getScreenCTM().inverse());
  }

  function fit(view) { setViewBox({ x: view.fit.x, y: view.fit.y, w: view.fit.w, h: view.fit.h }); }

  function centerOn(view, x, y) {
    var p = view.toSvg(x, y), w = Math.min(vb.w, 24), h = vb.h * (w / vb.w);
    setViewBox({ x: p.x - w / 2, y: p.y - h / 2, w: w, h: h });
  }

  function cityAt(cities, cx, cy, s, except) {
    for (var i = 0; i < cities.length; i++) {
      var c = cities[i];
      if (c !== except && cx >= c.x && cx < c.x + s && cy >= c.y && cy < c.y + s) return c;
    }
    return null;
  }

  function onWheel(e) {
    e.preventDefault();
    var p = clientTo(svg, e), k = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    setViewBox({ x: p.x - (p.x - vb.x) * k, y: p.y - (p.y - vb.y) * k, w: vb.w * k, h: vb.h * k });
  }

  function onDown(e) {
    var g = e.target.closest(".city");
    if (g && !ctx.readOnly()) {
      var cities = ctx.cities(), c = cities.find(function (v) { return v.name === g.getAttribute("data-name"); });
      var pt = clientTo(ctx.view().world, e);
      drag = { city: c, g: g, offX: pt.x - c.x, offY: pt.y - c.y, nx: c.x, ny: c.y, moved: false,
               occ: BT.layout.occupancy(ctx.plan().config, cities, c) };
      g.classList.add("dragging");
      g.parentNode.appendChild(g);
    } else if (g) {
      ctx.select(g.getAttribute("data-name"));
      return;
    } else {
      pan = { x: e.clientX, y: e.clientY, vb: vb };
    }
    svg.setPointerCapture(e.pointerId);
  }

  function onMove(e) {
    if (drag) {
      var pt = clientTo(ctx.view().world, e);
      var nx = Math.round(pt.x - drag.offX), ny = Math.round(pt.y - drag.offY);
      if (nx === drag.nx && ny === drag.ny) return;
      drag.nx = nx; drag.ny = ny; drag.moved = true;
      drag.g.setAttribute("transform", "translate(" + nx + " " + ny + ")");
      var s = ctx.plan().config.citySize;
      var swap = cityAt(ctx.cities(), pt.x, pt.y, s, drag.city);
      var ok = BT.layout.fits(drag.occ, nx, ny, s);
      drag.g.classList.toggle("bad", !ok && !swap);
      drag.g.classList.toggle("swap", !!swap);
    } else if (pan) {
      var r = svg.getBoundingClientRect(), k = pan.vb.w / r.width;
      setViewBox({ x: pan.vb.x - (e.clientX - pan.x) * k, y: pan.vb.y - (e.clientY - pan.y) * k, w: pan.vb.w, h: pan.vb.h });
    }
  }

  function onUp(e) {
    if (drag) {
      var d = drag; drag = null;
      if (!d.moved) { ctx.select(d.city.name); return; }
      var s = ctx.plan().config.citySize, pt = clientTo(ctx.view().world, e);
      var swap = cityAt(ctx.cities(), pt.x, pt.y, s, d.city);
      if (swap) {
        var ox = d.city.x, oy = d.city.y;
        ctx.commit([[d.city.name, swap.x, swap.y], [swap.name, ox, oy]], "자리 교환: " + d.city.name + " ↔ " + swap.name);
      } else if (BT.layout.fits(d.occ, d.nx, d.ny, s)) {
        ctx.commit([[d.city.name, d.nx, d.ny]], "이동: " + d.city.name + " → " + d.nx + "," + d.ny);
      } else {
        ctx.toast("겹치는 자리라 되돌렸습니다");
        ctx.redraw();
      }
    }
    pan = null;
  }

  function init(svgEl, context) {
    svg = svgEl; ctx = context;
    svg.addEventListener("wheel", onWheel, { passive: false });
    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);
    svg.addEventListener("pointercancel", onUp);
  }

  return { init: init, fit: fit, centerOn: centerOn, hasView: function () { return !!vb; },
           restore: function () { if (vb) setViewBox(vb); } };
})();
