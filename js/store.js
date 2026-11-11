// 저장: 편집 중 내용은 브라우저(localStorage), 공유 정본은 data/plan.js
window.BT = window.BT || {};
BT.store = (function () {
  var KEY = "bt.plan.v3";

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function load() {
    try {
      var s = localStorage.getItem(KEY);
      if (s) return { plan: JSON.parse(s), local: true };
    } catch (e) { /* 저장소 막힘 */ }
    return { plan: clone(window.PLAN), local: false };
  }

  function save(plan) {
    try { localStorage.setItem(KEY, JSON.stringify(plan)); } catch (e) { /* 무시 */ }
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ }
  }

  function exportFile(plan) {
    var text =
      "// 곰 사냥 배치 데이터 (정본).\n" +
      "// 사이트에서 [배치 내보내기]로 받은 plan.js 를 이 파일에 덮어쓰고 커밋하면 공유 사이트에 반영된다.\n" +
      "window.PLAN = " + JSON.stringify(plan, null, 2) + ";\n";
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
    a.download = "plan.js";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return { load: load, save: save, clear: clear, exportFile: exportFile, clone: clone };
})();
