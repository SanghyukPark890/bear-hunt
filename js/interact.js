// 조작: 휠 확대 · 배경 드래그 이동 · 성 드래그(빈 자리로 이동 / 다른 성 위면 자리 교환)
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
    var p = view.toSvg(x, y), w = Math.min(vb.w, 20), h = vb.h * (w / vb.w);
    setViewBox({ x: p.x - w / 2, y: p.y - h / 2, w: w, h: h });
  }

  // 포인터가 올라간 자리 (자기 자리 제외)
  function seatAt(pt, except) {
    return ctx.base().seats.find(function (s) {
      return s.id !== except && pt.x >= s.col && pt.x < s.col + s.w && pt.y >= s.row && pt.y < s.row + s.h;
    }) || null;
  }

  function onWheel(e) {
    e.preventDefault();
    var p = clientTo(svg, e), k = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    setViewBox({ x: p.x - (p.x - vb.x) * k, y: p.y - (p.y - vb.y) * k, w: vb.w * k, h: vb.h * k });
  }

  function onDown(e) {
    var g = e.target.closest(".city");
    if (g && !ctx.readOnly()) {
      var sid = g.getAttribute("data-seat"), s = ctx.base().seats.find(function (v) { return v.id === sid; });
      var pt = clientTo(ctx.view().world, e);
      drag = { sid: sid, g: g, offX: pt.x - s.col, offY: pt.y - s.row, moved: false, target: null };
      g.classList.add("dragging");
      g.parentNode.appendChild(g);
    } else if (g) {
      ctx.select(g.getAttribute("data-seat"));
      return;
    } else {
      pan = { x: e.clientX, y: e.clientY, vb: vb };
    }
    svg.setPointerCapture(e.pointerId);
  }

  function onMove(e) {
    if (drag) {
      var pt = clientTo(ctx.view().world, e);
      drag.moved = true;
      drag.g.setAttribute("transform", "translate(" + (pt.x - drag.offX) + " " + (pt.y - drag.offY) + ")");
      var t = seatAt(pt, drag.sid);
      if (drag.target !== t) {
        svg.querySelectorAll(".drop").forEach(function (n) { n.classList.remove("drop"); });
        drag.target = t;
        if (t) svg.querySelector('[data-seat="' + t.id + '"]').classList.add("drop");
      }
    } else if (pan) {
      var r = svg.getBoundingClientRect(), k = pan.vb.w / r.width;
      setViewBox({ x: pan.vb.x - (e.clientX - pan.x) * k, y: pan.vb.y - (e.clientY - pan.y) * k, w: pan.vb.w, h: pan.vb.h });
    }
  }

  function onUp() {
    if (drag) {
      var d = drag; drag = null;
      if (!d.moved) { ctx.select(d.sid); return; }
      if (d.target) ctx.swap(d.sid, d.target.id);
      else { ctx.toast("자리 위에 놓아야 합니다"); ctx.redraw(); }
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
