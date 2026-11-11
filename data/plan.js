// 곰 사냥 배치 데이터 (정본).
// 사이트에서 [배치 내보내기]로 받은 plan.js 를 이 파일에 덮어쓰고 커밋하면 공유 사이트에 반영된다.
window.PLAN = {
  "config": {
    "trapSize": 3,
    "citySize": 2,
    "trapGap": 0,
    "scoring": "sum",
    "traps": [
      { "id": "A", "x": 500, "y": 500 },
      { "id": "B", "x": 513, "y": 500 }
    ],
    "groupColors": { "A": "#e8734a", "B": "#4a9ee8", "": "#9a9a9a" }
  },
  "members": (function () {
    var list = [];
    for (var i = 1; i <= 100; i++) list.push("멤버" + String(i).padStart(3, "0"));
    return list;
  })(),
  "groups": (function () {
    var g = {};
    for (var i = 1; i <= 100; i++) g["멤버" + String(i).padStart(3, "0")] = i % 2 ? "A" : "B";
    return g;
  })(),
  "positions": null
};
