# 곰 사냥 작전 배치도

WOS 곰 사냥 작전용 연맹 성 배치도. 연맹 시트의 고정 배치도(덫 · 시설 · 성 자리 126개)에 연맹원 이름을 배정한다.

## 쓰는 법
- **명단**: 한 줄에 한 명, 줄 순서 = 전투력 순. 이름 뒤에 참여 곰 번호 `1` 곰1 · `2` 곰2 · `12` 둘 다 · `0` 미참여 (없으면 미지정).
  같은 구역 자리 중 덫에 가까운 자리부터 순서대로 배정된다. 구역 자리가 모자라면 미지정 빈자리로 넘치고 ⚠ 표시.
- **드래그**: 성을 다른 자리 위에 놓으면 이동(빈 자리) 또는 교환(사람 있는 자리).
- **↻ 시점**: 시트 격자 ↔ 게임처럼 45° 마름모.
- **🔒 보기 전용**: 연맹원이 실수로 옮기지 않게 잠금.

## 배치도 갱신 (자리 · 시설이 바뀌었을 때)
작업 폴더(저장소 밖)에서 `python -I tools/import_ref.py <참고 사이트 index.html> --keep-plan` → `data/base.js` 만 새로 만든다.

## 공유 (정본 = `data/plan.js`)
편집 내용은 내 브라우저에만 저장된다. 공유하려면:
1. [배치 내보내기] → 받은 `plan.js` 를 `data/plan.js` 에 덮어쓰기
2. `git add data/plan.js && git commit -m "배치 갱신" && git push`
3. 1~2분 뒤 GitHub Pages 주소에 반영

## GitHub Pages 처음 설정
1. GitHub 에서 새 저장소 생성 (Public)
2. `git remote add origin https://github.com/<계정>/<저장소>.git && git push -u origin main`
3. 저장소 Settings → Pages → Branch: `main` / `/ (root)` → Save
4. 주소: `https://<계정>.github.io/<저장소>/`

로컬에서는 `index.html` 더블클릭으로도 열린다.
