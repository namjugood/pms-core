/**
 * 애플리케이션 메인 진입점
 * 모든 컴포넌트 초기화 및 파일 저장/불러오기 처리
 */

// Electron IPC
const { ipcRenderer } = require('electron');

// 현재 열린 파일 경로
let currentFilePath = null;

/**
 * 앱 초기화
 */
function initializeApp() {
  // 탭 매니저 초기화
  initializeTabManager();

  // 메뉴 이벤트 설정
  setupMenuListeners();
}

/**
 * 메뉴 이벤트 리스너 설정
 */
function setupMenuListeners() {
  // Save 메뉴 (Ctrl+S)
  ipcRenderer.on('menu-save', async () => {
    await handleSave();
  });

  // Save As 메뉴 (Ctrl+Shift+S)
  ipcRenderer.on('menu-save-as', async () => {
    await handleSaveAs();
  });

  // Load 메뉴 (Ctrl+O)
  ipcRenderer.on('menu-load', async () => {
    await handleLoad();
  });

  // Validate 메뉴 (Ctrl+Shift+V)
  ipcRenderer.on('menu-validate', () => {
    handleValidate();
  });
}

/**
 * 유효성 검사 실행
 */
function handleValidate() {
  const allTabsDataToValidate = getAllTabsData();
  const validationResult = validateAllTabs(allTabsDataToValidate);
  
  if (validationResult.isValid) {
    alert('✅ 모든 데이터가 유효합니다!\n\n비중 합계: 100%\n모든 필드가 올바르게 입력되었습니다.');
  } else {
    let message = '⚠️ 다음 사항을 확인해주세요:\n\n';
    
    validationResult.errors.forEach((error, index) => {
      message += `${index + 1}. ${error.message}\n`;
    });
    
    alert(message);
  }
}

/**
 * Save 처리 (현재 파일에 저장 또는 Save As)
 */
async function handleSave() {
  if (currentFilePath) {
    // 기존 파일에 저장
    await saveToFile(currentFilePath);
  } else {
    // 파일 경로가 없으면 Save As 실행
    await handleSaveAs();
  }
}

/**
 * Save As 처리 (다른 이름으로 저장)
 */
async function handleSaveAs() {
  try {
    // 파일 저장 경로 선택
    const filePath = await ipcRenderer.invoke('select-save-file');
    if (!filePath) return;

    await saveToFile(filePath);
    currentFilePath = filePath;
  } catch (error) {
    alert(`저장 중 오류 발생: ${error.message}`);
  }
}

/**
 * 파일에 데이터 저장
 */
async function saveToFile(filePath) {
  try {
    // 모든 탭 데이터 가져오기
    const allTabsDataToSave = getAllTabsData();
    
    // 유효성 검사
    const validationResult = validateAllTabs(allTabsDataToSave);
    
    if (!validationResult.isValid) {
      // 유효성 검사 실패 시 사용자에게 확인
      const shouldContinue = showValidationErrors(validationResult);
      
      if (!shouldContinue) {
        // 사용자가 취소를 선택한 경우
        return;
      }
    }
    
    // 저장할 데이터 구조
    const saveData = {
      version: '2.0',
      savedAt: new Date().toISOString(),
      tabs: allTabsDataToSave.map(tab => ({
        name: tab.name,
        tableData: tab.tableData
      }))
    };

    // 파일 저장
    const result = await ipcRenderer.invoke('save-data', saveData, filePath);
    
    if (result.success) {
      // 타이틀 바 업데이트
      document.title = `기여도 평가 점수 프로그램 - ${filePath.split('\\').pop()}`;
      
      // 유효성 검사 통과 시 성공 메시지 없이 조용히 저장
      if (validationResult.isValid) {
        // 상태바나 타이틀로 저장 완료 표시 (선택적)
      }
    } else {
      alert(`저장 실패: ${result.error}`);
    }
  } catch (error) {
    alert(`저장 중 오류 발생: ${error.message}`);
  }
}

/**
 * Load 처리 (파일 불러오기)
 */
async function handleLoad() {
  try {
    // 파일 선택
    const filePath = await ipcRenderer.invoke('select-load-file');
    if (!filePath) return;

    // 파일 로드
    const result = await ipcRenderer.invoke('load-data', filePath);
    
    if (result.success) {
      const loadedData = result.data;
      
      // 버전에 따라 데이터 로드
      if (loadedData.version === '2.0' && loadedData.tabs && Array.isArray(loadedData.tabs)) {
        // 새 버전 (탭 지원)
        loadAllTabsData(loadedData.tabs);
      } else if (loadedData.data && Array.isArray(loadedData.data)) {
        // 구 버전 (단일 테이블)
        loadAllTabsData([{
          name: '시스템개발',
          tableData: loadedData.data
        }]);
      } else {
        alert('데이터 형식이 올바르지 않습니다.');
        return;
      }
      
      // 현재 파일 경로 저장
      currentFilePath = filePath;
      
      // 타이틀 바 업데이트
      document.title = `기여도 평가 점수 프로그램 - ${filePath.split('\\').pop()}`;
    } else {
      alert(`불러오기 실패: ${result.error}`);
    }
  } catch (error) {
    alert(`불러오기 중 오류 발생: ${error.message}`);
  }
}

// DOM 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

