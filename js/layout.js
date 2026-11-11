// 배치 계산: 덫 주변 빈칸을 점수(덫까지 거리) 순으로 채운다.
window.BT = window.BT || {};
BT.layout = (function () {
  function key(x, y) { return x + "," + y; }

  function trapRect(t, size) {
    var h = Math.floor(size / 2);
    return { x: t.x - h, y: t.y - h, w: size, h: size };
  }

  // 덫 중심 = 가운데 칸의 중앙
  function trapDists(cx, cy, traps) {
    return traps.map(function (t) { return Math.hypot(cx - (t.x + 0.5), cy - (t.y + 0.5)); });
  }

  function score(cx, cy, cfg) {
    var d = trapDists(cx, cy, cfg.traps);
    if (cfg.scoring === "min") return Math.min.apply(null, d);
    return d.reduce(function (a, b) { return a + b; }, 0);
  }

  function blockTraps(cfg, occ) {
    var pad = cfg.trapGap || 0;
    cfg.traps.forEach(function (t) {
      var r = trapRect(t, cfg.trapSize);
      for (var x = r.x - pad; x < r.x + r.w + pad; x++)
        for (var y = r.y - pad; y < r.y + r.h + pad; y++) occ.add(key(x, y));
    });
  }

  function fits(occ, x, y, s) {
    for (var i = 0; i < s; i++)
      for (var j = 0; j < s; j++) if (occ.has(key(x + i, y + j))) return false;
    return true;
  }

  function mark(occ, x, y, s) {
    for (var i = 0; i < s; i++)
      for (var j = 0; j < s; j++) occ.add(key(x + i, y + j));
  }

  // occ 에 이미 찬 칸을 피해 가까운 순으로 count 개 자리를 찾는다 (occ 갱신)
  function freeSlots(cfg, occ, count) {
    var s = cfg.citySize;
    var xs = cfg.traps.map(function (t) { return t.x; });
    var ys = cfg.traps.map(function (t) { return t.y; });
    var R = Math.ceil(Math.sqrt((count + occ.size / (s * s)) * s * s)) + cfg.trapSize + 4;
    var cands = [];
    for (var x = Math.min.apply(null, xs) - R; x <= Math.max.apply(null, xs) + R; x++)
      for (var y = Math.min.apply(null, ys) - R; y <= Math.max.apply(null, ys) + R; y++)
        cands.push({ x: x, y: y, sc: score(x + s / 2, y + s / 2, cfg) });
    cands.sort(function (a, b) { return a.sc - b.sc || a.y - b.y || a.x - b.x; });
    var out = [];
    for (var k = 0; k < cands.length && out.length < count; k++) {
      var c = cands[k];
      if (fits(occ, c.x, c.y, s)) { mark(occ, c.x, c.y, s); out.push(c); }
    }
    return out;
  }

  // 저장된 자리는 유지하고, 없거나 겹치는 인원만 순서대로 빈자리에 넣는다
  function place(cfg, members, positions) {
    var s = cfg.citySize, occ = new Set();
    blockTraps(cfg, occ);
    var out = new Array(members.length), pending = [];
    members.forEach(function (name, i) {
      var p = positions && positions[name];
      if (p && fits(occ, p[0], p[1], s)) {
        mark(occ, p[0], p[1], s);
        out[i] = { name: name, rank: i + 1, x: p[0], y: p[1] };
      } else pending.push(i);
    });
    if (pending.length) {
      var slots = freeSlots(cfg, occ, pending.length);
      pending.forEach(function (i, k) {
        out[i] = { name: members[i], rank: i + 1, x: slots[k].x, y: slots[k].y };
      });
    }
    return out;
  }

  // 드래그 검사용: except 를 뺀 점유 칸
  function occupancy(cfg, cities, except) {
    var occ = new Set();
    blockTraps(cfg, occ);
    cities.forEach(function (c) { if (c !== except) mark(occ, c.x, c.y, cfg.citySize); });
    return occ;
  }

  return {
    trapRect: trapRect, trapDists: trapDists, place: place,
    occupancy: occupancy, fits: fits
  };
})();
