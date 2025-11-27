/**
 * 합계 및 비교 UI 관리
 * 실시간으로 합계를 계산하고 화면에 표시
 */

/**
 * 탭 요약 정보 업데이트 (통합 함수)
 * - 비중: 각 탭별 독립 합계 (Local Sum) -> 해당 탭에만 표시
 * - 점수: 모든 탭의 점수 총합을 탭 수로 나눔 (Global Average) -> 모든 탭에 동일하게 표시
 * @param {string} tabId (호환성을 위해 인자는 유지하되, 내부적으로는 모든 탭을 갱신합니다)
 */
function updateTabSummary(tabId) {
  // 데이터가 없으면 계산 중단
  if (!allTabs || allTabs.length === 0) return;

  const tabCount = Math.max(1, allTabs.length);
  let globalPrevScoreSum = 0;
  let globalCurrentScoreSum = 0;

  // 1. 전체 합계 계산 (데이터가 있는 탭만 계산)
  allTabs.forEach(tab => {
    if (tab && tab.tableData) {
      const totals = calculateTotals(tab.tableData);
      globalPrevScoreSum += totals.prevScoreTotal;
      globalCurrentScoreSum += totals.currentScoreTotal;
    }
  });

  const globalPrevAvg = globalPrevScoreSum / tabCount;
  const globalCurrentAvg = globalCurrentScoreSum / tabCount;
  const globalDiff = globalCurrentAvg - globalPrevAvg;

  // 2. UI 업데이트 (존재하는 DOM에만 값 적용)
  allTabs.forEach(tab => {
    // [핵심] 탭 데이터는 있지만 DOM이 없는 경우(삭제 직후 등) 건너뜀
    const tabContent = document.querySelector(`.tab-content[data-tab-id="${tab.id}"]`);
    if (!tabContent) return; 

    // 여기서부터는 안전함
    const localTotals = calculateTotals(tab.tableData);

    // (A) 비중 업데이트
    const prevWeightEl = tabContent.querySelector('.prev-weight-total');
    const weightEl = tabContent.querySelector('.weight-total');
    
    if (prevWeightEl) prevWeightEl.textContent = formatNumberRounded(localTotals.prevWeightTotal) + '%';
    if (weightEl) weightEl.textContent = formatNumberRounded(localTotals.weightTotal) + '%';

    // (B) 점수 업데이트
    const prevScoreEl = tabContent.querySelector('.prev-score-total');
    const currentScoreEl = tabContent.querySelector('.current-score-total');
    const diffEl = tabContent.querySelector('.score-difference');

    if (prevScoreEl) prevScoreEl.textContent = formatNumberRounded(globalPrevAvg);
    if (currentScoreEl) currentScoreEl.textContent = formatNumberRounded(globalCurrentAvg);
    if (diffEl) diffEl.textContent = formatNumberRounded(globalDiff);
    
    // (C) 차이 표시기
    const diffBox = tabContent.querySelector('.score-box.difference');
    const indicator = tabContent.querySelector('.difference-indicator');
    
    if (diffBox && indicator) {
      // 클래스 초기화 (기존 클래스 제거)
      diffBox.className = 'score-box difference';
      
      if (globalDiff > 0) {
        diffBox.classList.add('positive');
        indicator.textContent = '▲';
      } else if (globalDiff < 0) {
        diffBox.classList.add('negative');
        indicator.textContent = '▼';
      } else {
        indicator.textContent = '-';
      }
    }
  });
}

// 호환성 유지
const updateAllTabsSummary = updateTabSummary;