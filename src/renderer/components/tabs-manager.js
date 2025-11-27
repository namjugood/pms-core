/**
 * 탭 관리 시스템
 * 여러 탭을 생성하고 각 탭마다 독립적인 테이블 데이터 관리
 */

// 탭 ID 카운터
let tabIdCounter = 0;

// 모든 탭 데이터 저장
const allTabs = [];

// 현재 활성 탭
let activeTabId = null;

/**
 * 탭 관리 시스템 (State-Driven Rendering)
 * DOM 조작을 최소화하고, 상태(State) 변경 후 UI를 통째로 다시 그립니다.
 */
function initializeTabManager() {
  const addTabBtn = document.getElementById('add-tab-btn');
  if (addTabBtn) {
    addTabBtn.addEventListener('click', () => {
      createTab();
    });
  }
  // 초기 탭 생성
  createTab('시스템개발');
}

/**
 * [핵심] UI 렌더링 함수
 * 현재 상태(allTabs, activeTabId)를 기반으로 화면을 깨끗하게 다시 그립니다.
 */
function renderUI() {
  const tabsContainer = document.getElementById('tabs-container');
  const contentsWrapper = document.getElementById('tab-contents-wrapper');

  // 1. DOM 초기화
  tabsContainer.innerHTML = '';
  contentsWrapper.innerHTML = '';

  // 2. 탭 재구성
  allTabs.forEach(tab => {
    // (A) 탭 버튼 생성
    const tabBtn = document.createElement('div');
    tabBtn.className = `tab-item ${tab.id === activeTabId ? 'active' : ''}`;
    tabBtn.setAttribute('data-tab-id', tab.id);
    
    tabBtn.innerHTML = `
      <span class="tab-name" title="더블클릭하여 이름 변경">${tab.name}</span>
      <button class="tab-close-btn" title="탭 닫기">×</button>
    `;
    
    const tabNameSpan = tabBtn.querySelector('.tab-name');
    const closeBtn = tabBtn.querySelector('.tab-close-btn');

    tabBtn.addEventListener('click', (e) => {
      if (e.target === closeBtn) return;
      switchTab(tab.id);
    });

    tabNameSpan.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      renameTab(tab, tabNameSpan);
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });

    tabsContainer.appendChild(tabBtn);

    // (B) 활성 탭 컨텐츠 생성
    if (tab.id === activeTabId) {
      // 1. 기본 HTML 구조 생성
      createTabContent(tab, true); 
      
      const tabContent = document.querySelector(`.tab-content[data-tab-id="${tab.id}"]`);
      
      if (tabContent) {
        // [수정됨] active 클래스 추가 (화면에 보이게 함)
        tabContent.classList.add('active');

        const tbody = tabContent.querySelector('.table-body');

        // 2. 데이터 복원 (행 추가)
        if (tab.tableData && tab.tableData.length > 0) {
          tab.tableData.forEach(rowData => {
            addRowToTab(tab.id, rowData, tbody);
          });
        } else {
          addRowToTab(tab.id, null, tbody);
        }
      }
    }
  });

  // 3. 합계 업데이트
  if (typeof updateAllTabsSummary === 'function') {
    updateAllTabsSummary();
  }
}

/**
 * 새 탭 생성
 * @param {string} name 탭 이름 (선택적)
 * @param {boolean} skipDefaultRow 기본 빈 행 추가 여부 (true면 추가 안 함)
 */
function createTab(name, skipDefaultRow = false) {
  const tabId = `tab-${tabIdCounter++}`;
  const tabName = name || `탭 ${tabIdCounter}`;
  
  const tabData = {
    id: tabId,
    name: tabName,
    tableData: []
  };
  
  allTabs.push(tabData);
  
  // 새 탭을 활성화 (renderUI 호출됨)
  switchTab(tabId);
}

/**
 * 탭 버튼 생성
 * @param {Object} tabData 탭 데이터
 */
function createTabButton(tabData) {
  const tabsContainer = document.getElementById('tabs-container');
  if (!tabsContainer) return;

  const tabBtn = document.createElement('div');
  tabBtn.className = 'tab-item';
  tabBtn.setAttribute('data-tab-id', tabData.id);
  
  tabBtn.innerHTML = `
    <span class="tab-name" title="더블클릭하여 이름 변경">${tabData.name}</span>
    <button class="tab-close-btn" title="탭 닫기">×</button>
  `;
  
  const tabNameSpan = tabBtn.querySelector('.tab-name');
  const closeBtn = tabBtn.querySelector('.tab-close-btn');
  
  // 탭 클릭 - 탭 전환
  tabBtn.addEventListener('click', (e) => {
    if (e.target === closeBtn) return;
    switchTab(tabData.id);
  });
  
  // 탭 이름 더블클릭 - 이름 변경
  tabNameSpan.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    // tabNameSpan 요소를 두 번째 인자로 전달합니다.
    renameTab(tabData, tabNameSpan);
  });
  
  // 탭 닫기
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(tabData.id);
  });
  
  tabsContainer.appendChild(tabBtn);
}

/**
 * 탭 컨텐츠 생성
 * @param {Object} tabData 탭 데이터
 * @param {boolean} skipDefaultRow 기본 빈 행 추가 여부
 */
function createTabContent(tabData, skipDefaultRow) {
  const wrapper = document.getElementById('tab-contents-wrapper');
  if (!wrapper) return;

  const tabContent = document.createElement('div');
  tabContent.className = 'tab-content';
  tabContent.setAttribute('data-tab-id', tabData.id);
  
  // ... (HTML 생성 코드는 기존과 동일하므로 생략, 그대로 유지하세요) ...
  tabContent.innerHTML = `
    <div class="action-buttons">
      <button class="btn btn-add add-row-btn">+ 행 추가</button>
      <button class="btn btn-delete delete-row-btn">× 행 삭제</button>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-checkbox"><input type="checkbox" class="select-all"></th>
            <th class="col-description">설명</th>
            <th class="col-date">시작일</th>
            <th class="col-date">종료일</th>
            <th class="col-number">이전 비중 (%)</th>
            <th class="col-number">이전 점수</th>
            <th class="col-number">이전평가점수</th>
            <th class="col-number">비중 (%)</th>
            <th class="col-number">점수</th>
            <th class="col-number">예상평가점수</th>
          </tr>
        </thead>
        <tbody class="table-body"></tbody>
      </table>
    </div>
    <div class="summary-section">
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">이전 비중 합계:</span>
          <span class="summary-value prev-weight-total">0%</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">비중 합계:</span>
          <span class="summary-value weight-total">0%</span>
        </div>
      </div>
      <div class="score-comparison">
        <div class="score-box">
          <h3>이전평가점수 합계</h3>
          <div class="score-value prev-score-total">0.0</div>
        </div>
        <div class="score-box">
          <h3>예상평가점수 합계</h3>
          <div class="score-value current-score-total">0.0</div>
        </div>
        <div class="score-box difference">
          <h3>차이</h3>
          <div class="score-value score-difference">0.0</div>
          <div class="difference-indicator"></div>
        </div>
      </div>
    </div>
  `;
  
  wrapper.appendChild(tabContent);
  
  // 이벤트 리스너 설정
  setupTabContentEvents(tabContent, tabData);
  
  // [수정된 부분] 
  // skipDefaultRow가 false(기본값)이고, 데이터가 없을 때만 빈 행 추가
  if (!skipDefaultRow && tabData.tableData.length === 0) {
    const tbody = tabContent.querySelector('.table-body');
    addRowToTab(tabData.id, null, tbody);
  }
}

/**
 * 탭 컨텐츠 이벤트 설정
 * @param {HTMLElement} tabContent 탭 컨텐츠 요소
 * @param {Object} tabData 탭 데이터
 */
function setupTabContentEvents(tabContent, tabData) {
  const addRowBtn = tabContent.querySelector('.add-row-btn');
  const deleteRowBtn = tabContent.querySelector('.delete-row-btn');
  const selectAllCheckbox = tabContent.querySelector('.select-all');
  
  // 행 추가
  if (addRowBtn) {
    addRowBtn.addEventListener('click', () => {
      addRowToTab(tabData.id);
    });
  }
  
  // 행 삭제
  if (deleteRowBtn) {
    deleteRowBtn.addEventListener('click', () => {
      deleteSelectedRowsFromTab(tabData.id);
    });
  }
  
  // 전체 선택
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
      const tbody = tabContent.querySelector('.table-body');
      const checkboxes = tbody.querySelectorAll('.row-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
      });
    });
  }
}

/**
 * 탭 전환
 */
function switchTab(tabId) {
  activeTabId = tabId;
  renderUI(); // 화면 다시 그리기
  
  // 전환 후 입력창 포커스
  setTimeout(() => {
    const tabContent = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
    if (tabContent) {
      const firstInput = tabContent.querySelector('input:not([type="hidden"]), textarea');
      if (firstInput) firstInput.focus();
    }
  }, 50);
}

/**
 * 탭 이름 변경 (인라인 편집 모드)
 * @param {Object} tabData 탭 데이터
 * @param {HTMLElement} nameElement 이름을 표시하는 span 요소
 */
function renameTab(tabData, nameElement) {
  // 이미 편집 중이라면 중복 실행 방지
  if (nameElement.style.display === 'none') return;

  const currentName = tabData.name;
  const parent = nameElement.parentNode;

  // 1. 입력창 생성
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.className = 'tab-name-input';
  
  // 2. Span 숨기고 Input 끼워넣기
  nameElement.style.display = 'none';
  parent.insertBefore(input, nameElement);
  
  // 입력창에 포커스 및 텍스트 전체 선택
  input.focus();
  input.select();

  // 3. 편집 종료 처리 함수
  const finishEditing = (save) => {
    // 이미 제거되었다면 실행 안 함
    if (!input.parentNode) return;

    if (save) {
      const newName = input.value.trim();
      if (newName) {
        tabData.name = newName;
        nameElement.textContent = newName;
      }
    }
    
    // Input 제거하고 Span 다시 표시
    input.remove();
    nameElement.style.display = '';
  };

  // 4. 이벤트 리스너 (엔터, ESC, 포커스 해제)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      finishEditing(true); // 저장 후 종료
    } else if (e.key === 'Escape') {
      finishEditing(false); // 저장 안 하고 종료
    }
  });

  // 입력창 밖을 클릭했을 때 저장
  input.addEventListener('blur', () => {
    finishEditing(true);
  });
}

/**
 * 탭 닫기
 */
function closeTab(tabId) {
  if (allTabs.length <= 1) {
    alert('최소 1개의 탭이 필요합니다.');
    return;
  }
  
  if (!confirm('이 탭을 닫으시겠습니까?')) {
    return;
  }

  // 1. 데이터 삭제
  const tabIndex = allTabs.findIndex(tab => tab.id === tabId);
  if (tabIndex !== -1) {
    allTabs.splice(tabIndex, 1);
  }

  // 2. 활성 탭 인덱스 조정
  if (activeTabId === tabId) {
    const newIndex = Math.max(0, tabIndex - 1);
    activeTabId = allTabs[newIndex] ? allTabs[newIndex].id : null;
  }

  // 3. UI 다시 그리기
  renderUI();

  // 4. [핵심] 메인 프로세스에 포커스 리셋 요청 (Alt+Tab 효과)
  // DOM 렌더링 후 약간의 딜레이를 두고 실행
  setTimeout(() => {
    ipcRenderer.send('fix-focus-trap');
  }, 50);
}

/**
 * 현재 활성 탭의 데이터 가져오기
 * @returns {Object} 탭 데이터
 */
function getActiveTabData() {
  return allTabs.find(tab => tab.id === activeTabId);
}

/**
 * 모든 탭 데이터 가져오기
 * @returns {Array} 모든 탭 데이터
 */
function getAllTabsData() {
  return allTabs;
}

/**
 * 데이터 로드
 */
function loadAllTabsData(tabsData) {
  allTabs.length = 0;
  tabIdCounter = 0;
  
  if (tabsData && tabsData.length > 0) {
    tabsData.forEach(sourceTab => {
      const tabId = `tab-${tabIdCounter++}`;
      allTabs.push({
        id: tabId,
        name: sourceTab.name,
        tableData: sourceTab.tableData || [] 
      });
    });
    
    if (allTabs.length > 0) {
      activeTabId = allTabs[0].id;
    }
  } else {
    createTab('시스템개발');
    return;
  }

  renderUI();
}

/**
 * 입력창 강제 리셋 (핵심 해결책)
 * 브라우저의 입력 연결을 끊었다가 다시 연결하여 먹통 현상 해결
 * @param {HTMLElement} container 포커스를 찾을 컨테이너
 */
function forceInputReset(container) {
  if (!container) return;

  // 다음 리페인트 프레임(화면 그리기 직전)에 실행
  requestAnimationFrame(() => {
    // 1. 컨테이너 자체를 먼저 한 번 찍음 (포커스 문맥 환기)
    container.setAttribute('tabindex', '-1');
    container.focus();
    container.style.outline = 'none';

    // 2. 내부 입력창 찾기
    const input = container.querySelector('input:not([type="hidden"]), textarea');
    
    if (input) {
      // [Magic Code] 입력창을 아주 잠깐 '사용 불가'로 만들었다가 풉니다.
      // 이 과정에서 브라우저는 키보드 이벤트 리스너를 강제로 재등록합니다.
      const originalDisabled = input.disabled;
      input.disabled = true;
      
      // 강제 리플로우 (상태 변화 적용)
      input.offsetHeight; 
      
      input.disabled = originalDisabled;
      
      // 3. 포커스 및 클릭 이벤트 강제 발생
      input.focus();
      input.click(); // 클릭 이벤트까지 쏴서 활성화 확인
    }
  });
}