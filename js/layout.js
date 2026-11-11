// 매핑: 고정 자리(BASE.seats)에 명단을 배정한다.
// 자리마다 구역(cat)이 있다: A=곰1, B=곰2, AB=둘 다, N=미참여, ""=미지정.
// 같은 구역 안에서는 명단 순서(전투력 순)대로 덫에 가까운 자리부터.
window.BT = window.BT || {};
BT.layout = (function () {
  var GROUPS = ["A", "B", "AB", "N", ""];

  function center(o) { return { x: o.col + o.w / 2, y: o.row + o.h / 2 }; }

  function trapOf(base, key) {
    return base.traps.find(function (t) { return t.key === key; });
  }

  function dist(a, t) {
    if (!t) return 0;
    var c = center(t);
    return Math.hypot(a.x - c.x, a.y - c.y);
  }

  // 그룹별 "가까움" 기준: 곰1/곰2 는 자기 덫, 둘 다는 두 덫 거리 합, 그 외는 가까운 덫
  function score(base, seat, group) {
    var c = center(seat), a = dist(c, trapOf(base, "A")), b = dist(c, trapOf(base, "B"));
    if (group === "A") return a;
    if (group === "B") return b;
    if (group === "AB") return a + b;
    return Math.min(a, b);
  }

  function sortedSeats(base, seats, group) {
    return seats.slice().sort(function (p, q) {
      return score(base, p, group) - score(base, q, group) || p.row - q.row || p.col - q.col;
    });
  }

  // 행성 버프 범위: 둘러싼 성 1줄 = 두 자리 사이 틈이 가로 · 세로 모두 1칸 이하(깃발 1칸 사이도 포함)
  function gap(a0, a1, b0, b1) { return Math.max(0, b0 - a1, a0 - b1); }
  function isNeighbor(p, q) {
    return p.id !== q.id && gap(p.col, p.col + p.w, q.col, q.col + q.w) <= 1 && gap(p.row, p.row + p.h, q.row, q.row + q.h) <= 1;
  }
  function neighbors(base, seat) {
    if (!base._nb) base._nb = {};
    if (!base._nb[seat.id]) base._nb[seat.id] = base.seats.filter(function (q) { return isNeighbor(seat, q); });
    return base._nb[seat.id];
  }

  // 행성 자리: 자기 구역에서 덫에 가까운 6자리 중, 주변에 같은 구역 자리가 가장 많은 곳
  function planetSeat(base, g, used) {
    var cands = sortedSeats(base, base.seats.filter(function (s) { return s.cat === g && !used[s.id]; }), g).slice(0, 6);
    var best = null, bestN = -1;
    cands.forEach(function (s) {
      var n = neighbors(base, s).filter(function (q) { return q.cat === g && !used[q.id]; }).length;
      if (n > bestN) { best = s; bestN = n; }
    });
    return best;
  }

  // 명단 → assign {seatId: name}.
  // 1) 행성 인원을 먼저 앉히고 2) 그 버프 범위 자리를 같은 구역 전투력 상위부터 채운 뒤 3) 나머지는 덫에 가까운 순.
  // 구역 자리가 모자라면 미지정 빈자리 → 남은 아무 자리 순으로 넘친다.
  function autoAssign(base, members, groups, keep, planets) {
    var assign = {}, used = {}, placed = {};
    planets = planets || [];
    if (keep) {
      Object.keys(keep).forEach(function (sid) {
        var n = keep[sid];
        if (members.indexOf(n) >= 0 && !placed[n]) { assign[sid] = n; used[sid] = true; placed[n] = true; }
      });
    }
    var buffed = {};
    members.forEach(function (n) {
      if (planets.indexOf(n) < 0 || placed[n]) return;
      var s = planetSeat(base, groups[n] || "", used);
      if (!s) return;
      assign[s.id] = n; used[s.id] = true; placed[n] = true;
    });
    Object.keys(assign).forEach(function (sid) {
      if (planets.indexOf(assign[sid]) < 0) return;
      var s = base.seats.find(function (v) { return v.id === sid; });
      neighbors(base, s).forEach(function (q) { buffed[q.id] = true; });
    });
    var overflow = [];
    GROUPS.forEach(function (g) {
      var list = members.filter(function (n) { return !placed[n] && (groups[n] || "") === g; });
      var free = base.seats.filter(function (s) { return s.cat === g && !used[s.id]; });
      var seats = sortedSeats(base, free.filter(function (s) { return buffed[s.id]; }), g)
        .concat(sortedSeats(base, free.filter(function (s) { return !buffed[s.id]; }), g));
      list.forEach(function (n, i) {
        if (seats[i]) { assign[seats[i].id] = n; used[seats[i].id] = true; placed[n] = true; }
        else overflow.push(n);
      });
    });
    var unplaced = [];
    overflow.forEach(function (n) {
      var g = groups[n] || "";
      var free = base.seats.filter(function (s) { return !used[s.id]; });
      var pref = free.filter(function (s) { return s.cat === ""; });
      var pick = sortedSeats(base, pref.length ? pref : free, g)[0];
      if (pick) { assign[pick.id] = n; used[pick.id] = true; } else unplaced.push(n);
    });
    return { assign: assign, unplaced: unplaced };
  }

  // 화면용: 자리 목록 + 앉은 사람 정보(전체 순위 · 그룹 내 순위 · 구역 불일치)
  function view(base, plan) {
    var rank = {}, grank = {}, gcount = {};
    plan.members.forEach(function (n, i) {
      var g = plan.groups[n] || "";
      rank[n] = i + 1;
      gcount[g] = (gcount[g] || 0) + 1;
      grank[n] = gcount[g];
    });
    var seated = {}, planets = plan.planets || [];
    var seats = base.seats.map(function (s) {
      var n = plan.assign[s.id];
      if (n && rank[n] === undefined) n = null; // 명단에서 빠진 사람
      var v = { seat: s, name: n || null, buffBy: [] };
      if (n) {
        seated[n] = s.id;
        v.group = plan.groups[n] || "";
        v.rank = rank[n]; v.grank = grank[n];
        v.mismatch = v.group !== s.cat;
        v.planet = planets.indexOf(n) >= 0;
      }
      return v;
    });
    // 버프 범위 표시: 행성 자리 주변 1줄
    var byId = {};
    seats.forEach(function (v) { byId[v.seat.id] = v; });
    seats.forEach(function (v) {
      if (!v.planet) return;
      neighbors(base, v.seat).forEach(function (q) { byId[q.id].buffBy.push(v.name); });
    });
    var unseated = plan.members.filter(function (n) { return !seated[n]; });
    return { seats: seats, unseated: unseated, seatOf: seated };
  }

  return { GROUPS: GROUPS, autoAssign: autoAssign, view: view, center: center, neighbors: neighbors };
})();
