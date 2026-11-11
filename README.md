# 곰 사냥 작전 배치도

WOS 곰 사냥 작전용 연맹 성 배치도. 곰 덫 2개(3×3) 주변에 성(2×2)을 명단 순서대로 가까운 자리부터 배치한다.

## 쓰는 법
- **명단**: 한 줄에 한 명. 위에 있을수록 덫에 가까운 자리.
- **덫 좌표**: 게임에서 덫 가운데 칸 좌표를 넣으면 성 좌표가 전부 맞춰진다.
- **드래그**: 빈칸으로 끌면 이동, 다른 성 위에 놓으면 자리 교환(초록), 겹치면 빨강 → 되돌림.
- **↻ 시점**: 격자 정사각형 ↔ 게임처럼 45° 마름모.
- **🔒 보기 전용**: 연맹원이 실수로 옮기지 않게 잠금. 클릭하면 선택만 된다.

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
