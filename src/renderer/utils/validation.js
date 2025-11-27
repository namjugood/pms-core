/**
 * 유효성 검사 유틸리티
 * 데이터 저장 전 유효성 검사
 */

/**
 * 모든 탭 데이터 유효성 검사
 * @param {Array} allTabsData 모든 탭 데이터
 * @returns {Object} { isValid: boolean, errors: Array }
 */
function validateAllTabs(allTabsData) {
  const errors = [];
  
  allTabsData.forEach((tab, tabIndex) => {
    const tabErrors = validateTabData(tab.name, tab.tableData);
    if (tabErrors.length > 0) {
      errors.push(...tabErrors);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * 개별 탭 데이터 유효성 검사
 * @param {string} tabName 탭 이름
 * @param {Array} tableData 테이블 데이터
 * @returns {Array} 에러 메시지 배열
 */
function validateTabData(tabName, tableData) {
  const errors = [];
  
  // 비어있는 탭은 검사하지 않음
  if (!tableData || tableData.length === 0) {
    return errors;
  }
  
  // 데이터가 있는 행만 필터링
  const filledRows = tableData.filter(row => {
    return row.weight > 0 || row.score > 0 || row.description.trim().length > 0;
  });
  
  if (filledRows.length === 0) {
    return errors;
  }
  
  // 1. 비중이 있는데 점수가 없는 경우
  const weightWithoutScore = filledRows.filter(row => {
    return row.weight > 0 && (!row.score || row.score === 0);
  });
  
  if (weightWithoutScore.length > 0) {
    errors.push({
      tab: tabName,
      type: 'weight_without_score',
      message: `[${tabName}] 비중이 입력되었으나 점수가 없는 행이 ${weightWithoutScore.length}개 있습니다.`,
      rows: weightWithoutScore.length
    });
  }
  
  // 2. 점수가 있는데 비중이 없는 경우
  const scoreWithoutWeight = filledRows.filter(row => {
    return row.score > 0 && (!row.weight || row.weight === 0);
  });
  
  if (scoreWithoutWeight.length > 0) {
    errors.push({
      tab: tabName,
      type: 'score_without_weight',
      message: `[${tabName}] 점수가 입력되었으나 비중이 없는 행이 ${scoreWithoutWeight.length}개 있습니다.`,
      rows: scoreWithoutWeight.length
    });
  }
  
  // 3. 비중 합계가 100이 아닌 경우
  const weightTotal = tableData.reduce((sum, row) => sum + (row.weight || 0), 0);
  const roundedTotal = Math.round(weightTotal * 10) / 10;
  
  // 비중이 하나라도 입력된 경우에만 체크
  const hasWeight = tableData.some(row => row.weight > 0);
  
  if (hasWeight && Math.abs(roundedTotal - 100) > 0.1) {
    errors.push({
      tab: tabName,
      type: 'weight_sum_not_100',
      message: `[${tabName}] 비중의 합계가 ${roundedTotal}%입니다. 100%가 되어야 합니다.`,
      total: roundedTotal
    });
  }
  
  return errors;
}

/**
 * 유효성 검사 결과를 팝업으로 표시
 * @param {Object} validationResult 유효성 검사 결과
 * @returns {boolean} 사용자가 계속 진행할지 여부
 */
function showValidationErrors(validationResult) {
  if (validationResult.isValid) {
    return true;
  }
  
  // 에러 메시지 구성
  let message = '다음과 같은 문제가 발견되었습니다:\n\n';
  
  validationResult.errors.forEach((error, index) => {
    message += `${index + 1}. ${error.message}\n`;
  });
  
  message += '\n그래도 저장하시겠습니까?';
  
  // 사용자에게 선택권 부여
  return confirm(message);
}

/**
 * 빠른 유효성 검사 (경고만 표시, 저장 차단 안함)
 * @param {Array} allTabsData 모든 탭 데이터
 */
function quickValidate(allTabsData) {
  const result = validateAllTabs(allTabsData);
  
  if (!result.isValid) {
    let message = '⚠️ 다음 사항을 확인해주세요:\n\n';
    
    result.errors.forEach((error, index) => {
      message += `${index + 1}. ${error.message}\n`;
    });
    
    alert(message);
  }
}

/**
 * 현재 활성 탭의 유효성 실시간 체크
 * @param {string} tabId 탭 ID
 * @returns {Object} 유효성 검사 결과
 */
function validateCurrentTab(tabId) {
  const tabData = allTabs.find(tab => tab.id === tabId);
  if (!tabData) {
    return { isValid: true, errors: [] };
  }
  
  const errors = validateTabData(tabData.name, tabData.tableData);
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

