/**
 * 테이블 컴포넌트
 * 행 추가/삭제 및 데이터 입력 관리, 실시간 계산 처리
 */

// 행 ID 카운터
let rowIdCounter = 0;

// 현재 테이블 데이터
const tableData = [];

/**
 * 탭에 행 추가 (수정됨: 0 입력 버그 수정 및 입력 제한 해제)
 * @param {string} tabId 탭 ID
 * @param {Object} data 행 데이터 (선택적)
 * @param {HTMLElement} tbody tbody 요소 (선택적)
 */
function addRowToTab(tabId, data, tbody) {
  const tabData = allTabs.find(tab => tab.id === tabId);
  if (!tabData) return;

  const tabContent = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
  if (!tabContent) return;

  if (!tbody) {
    tbody = tabContent.querySelector('.table-body');
  }
  if (!tbody) return;

  // [핵심 변경] data가 이미 존재하는 객체(State)라면 새로 만들지 않고 그대로 사용
  let rowData;
  let isNewData = false;

  if (data && data.id && tabData.tableData.find(r => r.id === data.id)) {
    // 이미 존재하는 데이터 (Re-render 상황)
    rowData = data;
  } else {
    // 새로운 데이터 추가 상황
    isNewData = true;
    const rowId = `row-${Date.now()}-${Math.random()}`;
    
    rowData = {
      id: rowId,
      description: data?.description || '',
      startDate: data?.startDate || '',
      endDate: data?.endDate || '',
      weight: data?.weight ?? 0,
      score: data?.score ?? 0,
      evaluationScore: data?.evaluationScore ?? 0,
      prevWeight: data?.prevWeight ?? 0,
      prevScore: data?.prevScore ?? 0,
      prevEvaluationScore: data?.prevEvaluationScore ?? 0
    };
  }

  // [핵심] 새 데이터일 때만 배열에 추가 (재렌더링 시 중복 방지)
  if (isNewData) {
    tabData.tableData.push(rowData);
  }

  const tr = document.createElement('tr');
  tr.setAttribute('data-row-id', rowData.id);

  const safeVal = (val) => (val !== undefined && val !== null) ? val : '';

  // HTML 생성
  // [수정] input type="number"에서 step 속성을 제거하여 자유로운 입력 허용
  // [수정] value 속성에 safeVal 함수 적용
  tr.innerHTML = `
    <td class="col-checkbox">
      <input type="checkbox" class="row-checkbox">
    </td>
    <td class="col-description">
      <textarea class="input-description" placeholder="설명을 입력하세요" rows="2">${rowData.description}</textarea>
    </td>
    <td class="col-date">
      <div class="date-input-wrapper">
        <input type="text" class="input-start-date-display" placeholder="YYYY.MM.DD" value="${formatDateWithDots(rowData.startDate)}">
        <button type="button" class="calendar-icon" data-target="start">📅</button>
        <input type="date" class="input-start-date-hidden" value="${rowData.startDate}">
      </div>
    </td>
    <td class="col-date">
      <div class="date-input-wrapper">
        <input type="text" class="input-end-date-display" placeholder="YYYY.MM.DD" value="${formatDateWithDots(rowData.endDate)}">
        <button type="button" class="calendar-icon" data-target="end">📅</button>
        <input type="date" class="input-end-date-hidden" value="${rowData.endDate}">
      </div>
    </td>
    <td class="col-number">
      <input type="number" class="input-prev-weight" min="0" max="100" value="${safeVal(rowData.prevWeight)}">
    </td>
    <td class="col-number">
      <input type="number" class="input-prev-score" min="0" max="100" value="${safeVal(rowData.prevScore)}">
    </td>
    <td class="col-number">
      <input type="text" class="input-prev-eval-score readonly-field" value="${formatNumberFull(rowData.prevEvaluationScore)}" readonly>
    </td>
    <td class="col-number">
      <input type="number" class="input-weight" min="0" max="100" value="${safeVal(rowData.weight)}">
    </td>
    <td class="col-number">
      <input type="number" class="input-score" min="0" max="100" value="${safeVal(rowData.score)}">
    </td>
    <td class="col-number">
      <input type="text" class="input-eval-score readonly-field" value="${formatNumberFull(rowData.evaluationScore)}" readonly>
    </td>
  `;

  tbody.appendChild(tr);

  // 이벤트 리스너 추가
  attachRowEventListeners(tr, rowData, tabData);

  // textarea 자동 높이 조절
  const textarea = tr.querySelector('.input-description');
  if (textarea) {
    adjustTextareaHeight(textarea);
  }

  // 합계 업데이트 (재렌더링 시에는 호출하지 않아도 되지만 안전을 위해 유지)
  // 단, 대량 렌더링 시 성능을 위해 updateTabSummary는 상위에서 한 번만 호출하는 것이 좋습니다.
  // 여기서는 그대로 둡니다.
  updateTabSummary(tabData.id);
}


/**
 * 행에 이벤트 리스너 추가
 * @param {HTMLTableRowElement} tr 테이블 행 요소
 * @param {Object} rowData 행 데이터
 * @param {Object} tabData 탭 데이터
 */
function attachRowEventListeners(tr, rowData, tabData) {
  // 설명 입력
  const descriptionInput = tr.querySelector('.input-description');
  if (descriptionInput) {
    descriptionInput.addEventListener('input', (e) => {
      rowData.description = e.target.value;
      adjustTextareaHeight(e.target);
    });
  }

  // 시작일 입력
  const startDateDisplay = tr.querySelector('.input-start-date-display');
  const startDateHidden = tr.querySelector('.input-start-date-hidden');
  const startCalendarIcon = tr.querySelector('.calendar-icon[data-target="start"]');
  
  if (startDateDisplay && startDateHidden && startCalendarIcon) {
    // 달력 아이콘 클릭 시 date picker 열기
    startCalendarIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      startDateHidden.showPicker();
    });
    
    // 직접 입력 시 자동 포맷팅
    startDateDisplay.addEventListener('input', (e) => {
      const formatted = formatDateInput(e.target.value);
      if (formatted !== e.target.value) {
        e.target.value = formatted;
      }
    });
    
    // 입력 완료 시 (blur) 최종 검증 및 저장
    startDateDisplay.addEventListener('blur', (e) => {
      const value = e.target.value;
      const isoDate = parseDotsDateToISO(value);
      
      if (isoDate) {
        rowData.startDate = isoDate;
        startDateHidden.value = isoDate;
        e.target.value = formatDateWithDots(isoDate);
      } else if (value.trim() === '') {
        rowData.startDate = '';
        startDateHidden.value = '';
      }
    });
    
    // hidden date input 변경 시 (달력 선택) 표시 업데이트
    startDateHidden.addEventListener('change', (e) => {
      rowData.startDate = e.target.value;
      startDateDisplay.value = formatDateWithDots(e.target.value);
    });
  }

  // 종료일 입력
  const endDateDisplay = tr.querySelector('.input-end-date-display');
  const endDateHidden = tr.querySelector('.input-end-date-hidden');
  const endCalendarIcon = tr.querySelector('.calendar-icon[data-target="end"]');
  
  if (endDateDisplay && endDateHidden && endCalendarIcon) {
    // 달력 아이콘 클릭 시 date picker 열기
    endCalendarIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      endDateHidden.showPicker();
    });
    
    // 직접 입력 시 자동 포맷팅
    endDateDisplay.addEventListener('input', (e) => {
      const formatted = formatDateInput(e.target.value);
      if (formatted !== e.target.value) {
        e.target.value = formatted;
      }
    });
    
    // 입력 완료 시 (blur) 최종 검증 및 저장
    endDateDisplay.addEventListener('blur', (e) => {
      const value = e.target.value;
      const isoDate = parseDotsDateToISO(value);
      
      if (isoDate) {
        rowData.endDate = isoDate;
        endDateHidden.value = isoDate;
        e.target.value = formatDateWithDots(isoDate);
      } else if (value.trim() === '') {
        rowData.endDate = '';
        endDateHidden.value = '';
      }
    });
    
    // hidden date input 변경 시 (달력 선택) 표시 업데이트
    endDateHidden.addEventListener('change', (e) => {
      rowData.endDate = e.target.value;
      endDateDisplay.value = formatDateWithDots(e.target.value);
    });
  }

  // 비중 입력 (실시간 계산)
  const weightInput = tr.querySelector('.input-weight');
  const scoreInput = tr.querySelector('.input-score');
  const evalScoreInput = tr.querySelector('.input-eval-score');

  if (weightInput) {
    weightInput.addEventListener('input', () => {
      rowData.weight = parseNumberSafe(weightInput.value);
      rowData.evaluationScore = calculateEvaluationScore(rowData.weight, rowData.score);
      evalScoreInput.value = formatNumberFull(rowData.evaluationScore);
      updateTabSummary(tabData.id);
    });
  }

  // 점수 입력 (실시간 계산)
  if (scoreInput) {
    scoreInput.addEventListener('input', () => {
      rowData.score = parseNumberSafe(scoreInput.value);
      rowData.evaluationScore = calculateEvaluationScore(rowData.weight, rowData.score);
      evalScoreInput.value = formatNumberFull(rowData.evaluationScore);
      updateTabSummary(tabData.id);
    });
  }

  // 이전 비중 입력 (실시간 계산)
  const prevWeightInput = tr.querySelector('.input-prev-weight');
  const prevScoreInput = tr.querySelector('.input-prev-score');
  const prevEvalScoreInput = tr.querySelector('.input-prev-eval-score');

  if (prevWeightInput) {
    prevWeightInput.addEventListener('input', () => {
      rowData.prevWeight = parseNumberSafe(prevWeightInput.value);
      rowData.prevEvaluationScore = calculateEvaluationScore(rowData.prevWeight, rowData.prevScore);
      prevEvalScoreInput.value = formatNumberFull(rowData.prevEvaluationScore);
      updateTabSummary(tabData.id);
    });
  }

  // 이전 점수 입력 (실시간 계산)
  if (prevScoreInput) {
    prevScoreInput.addEventListener('input', () => {
      rowData.prevScore = parseNumberSafe(prevScoreInput.value);
      rowData.prevEvaluationScore = calculateEvaluationScore(rowData.prevWeight, rowData.prevScore);
      prevEvalScoreInput.value = formatNumberFull(rowData.prevEvaluationScore);
      updateTabSummary(tabData.id);
    });
  }
}

/**
 * textarea 높이 자동 조절
 * @param {HTMLTextAreaElement} textarea textarea 요소
 */
function adjustTextareaHeight(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

/**
 * 날짜를 점(.) 포맷으로 변환
 * @param {string} dateStr ISO 형식 날짜 (YYYY-MM-DD)
 * @returns {string} 점 포맷 날짜 (YYYY.MM.DD)
 */
function formatDateWithDots(dateStr) {
  if (!dateStr) return '';
  // ISO 형식(YYYY-MM-DD)을 점 형식(YYYY.MM.DD)으로 변환
  return dateStr.replace(/-/g, '.');
}

/**
 * 사용자 입력을 실시간으로 포맷팅 (입력 중)
 * @param {string} input 사용자 입력
 * @returns {string} 포맷된 입력
 */
function formatDateInput(input) {
  if (!input) return '';
  
  // 숫자와 점만 유지
  let cleaned = input.replace(/[^\d.]/g, '');
  
  // 점이 너무 많으면 마지막 2개만 유지
  const dots = cleaned.match(/\./g);
  if (dots && dots.length > 2) {
    const parts = cleaned.split('.');
    cleaned = parts[0] + '.' + parts[1] + '.' + parts.slice(2).join('');
  }
  
  return cleaned;
}

/**
 * 점 포맷 날짜를 ISO 형식으로 파싱 (유효성 검사 포함)
 * @param {string} dotDate 점 포맷 날짜 (YYYY.MM.DD 또는 다양한 형식)
 * @returns {string|null} ISO 형식 날짜 (YYYY-MM-DD) 또는 null (유효하지 않음)
 */
function parseDotsDateToISO(dotDate) {
  if (!dotDate || dotDate.trim() === '') return null;
  
  // 숫자만 추출
  const numbers = dotDate.replace(/[^\d]/g, '');
  
  // 8자리 숫자 확인 (YYYYMMDD)
  if (numbers.length !== 8) return null;
  
  const year = numbers.substring(0, 4);
  const month = numbers.substring(4, 6);
  const day = numbers.substring(6, 8);
  
  // 유효한 날짜인지 검증
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) return null;
  
  // 월과 일이 범위 내인지 확인
  if (parseInt(month) < 1 || parseInt(month) > 12) return null;
  if (parseInt(day) < 1 || parseInt(day) > 31) return null;
  
  return `${year}-${month}-${day}`;
}

/**
 * 탭에서 선택된 행 삭제
 * @param {string} tabId 탭 ID
 */
function deleteSelectedRowsFromTab(tabId) {
  const tabData = allTabs.find(tab => tab.id === tabId);
  if (!tabData) return;

  const tabContent = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
  if (!tabContent) return;

  const tbody = tabContent.querySelector('.table-body');
  if (!tbody) return;

  const checkboxes = tbody.querySelectorAll('.row-checkbox:checked');
  
  checkboxes.forEach(checkbox => {
    const row = checkbox.closest('tr');
    if (row) {
      const rowId = row.getAttribute('data-row-id');
      
      // 테이블 데이터에서 제거
      const index = tabData.tableData.findIndex(data => data.id === rowId);
      if (index !== -1) {
        tabData.tableData.splice(index, 1);
      }
      
      // DOM에서 제거
      row.remove();
    }
  });

  // 전체 선택 체크박스 해제
  const selectAllCheckbox = tabContent.querySelector('.select-all');
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = false;
  }

  // 합계 업데이트
  updateTabSummary(tabId);
}



