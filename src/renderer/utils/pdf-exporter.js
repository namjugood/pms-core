/**
 * PDF 내보내기 유틸리티
 * 데이터를 HTML 형식으로 변환하여 메인 프로세스로 전달
 */

const fs = require('fs');
const path = require('path');

let currentZoom = 1.0;
let previewHtmlContent = '';

function exportToPDF() {
  const allTabsData = getAllTabsData();
  const hasData = allTabsData.some(tab => tab.tableData && tab.tableData.length > 0);
  
  if (!hasData) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }

  previewHtmlContent = generateReportHTML(allTabsData);
  openPreviewModal(previewHtmlContent);
}

/**
 * 전체 데이터에서 가장 이른 날짜와 가장 늦은 날짜를 찾아 기간 문자열 반환
 */
function calculateTotalPeriod(tabsData) {
  let minDate = null;
  let maxDate = null;

  tabsData.forEach(tab => {
    if (!tab.tableData) return;
    
    tab.tableData.forEach(row => {
      // 시작일 비교 (가장 이른 날짜 찾기)
      if (row.startDate) {
        if (!minDate || row.startDate < minDate) {
          minDate = row.startDate;
        }
      }
      
      // 종료일 비교 (가장 늦은 날짜 찾기)
      if (row.endDate) {
        if (!maxDate || row.endDate > maxDate) {
          maxDate = row.endDate;
        }
      }
    });
  });

  const formatDate = (d) => d ? d.replace(/-/g, '.') : '';

  if (minDate && maxDate) {
    return `${formatDate(minDate)} ~ ${formatDate(maxDate)}`;
  } else if (minDate) {
    return `${formatDate(minDate)} ~ (진행 중)`;
  } else if (maxDate) {
    return `~ ${formatDate(maxDate)}`;
  } else {
    return '-';
  }
}

function generateReportHTML(tabsData) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, '0')}. ${String(today.getDate()).padStart(2, '0')}`;
  
  // [추가됨] 전체 총 기간 계산
  const totalPeriodStr = calculateTotalPeriod(tabsData);

  let cssContent = '';
  try {
    const cssPath = path.join(__dirname, '../renderer/styles/pdf.css');
    cssContent = fs.readFileSync(cssPath, 'utf-8');
  } catch (err) {
    console.error('PDF CSS 파일을 읽을 수 없습니다:', err);
    cssContent = `body { padding: 20px; font-family: sans-serif; }`;
  }

  let tableRows = '';
  tabsData.forEach(tab => {
    const validRows = tab.tableData.filter(row => row.description || row.startDate || row.endDate);
    
    validRows.forEach(row => {
      const startDate = row.startDate ? row.startDate.replace(/-/g, '.') : '';
      const endDate = row.endDate ? row.endDate.replace(/-/g, '.') : '';
      
      let period = '-';
      if (startDate && endDate) period = `${startDate} ~ ${endDate}`;
      else if (startDate) period = `${startDate} ~`;
      else if (endDate) period = `~ ${endDate}`;

      const description = row.description ? row.description.replace(/\n/g, '<br>') : '';

      tableRows += `
        <tr>
          <td class="cell-center category">${tab.name}</td>
          <td class="cell-center period">${period}</td>
          <td class="cell-left outcome">${description}</td>
        </tr>
      `;
    });
  });

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>경력 기술서 성과 요약</title>
      <style>
        ${cssContent} 
      </style>
    </head>
    <body>
      <div class="header">
        <h1>경력 기술서 작성을 위한 성과 요약</h1>
        <div class="meta-info">
          <div class="total-period"><span>총 활동 기간:</span> ${totalPeriodStr}</div>
          <div class="report-date">출력일: ${dateStr}</div>
        </div>
      </div>
      
      <table>
        <colgroup>
          <col class="w-category">
          <col class="w-period">
          <col class="w-outcome">
        </colgroup>
        <thead>
          <tr>
            <th>구분</th>
            <th>기간</th>
            <th>성과 및 상세 내용</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows || '<tr><td colspan="3" style="text-align:center; padding: 30px;">입력된 데이터가 없습니다.</td></tr>'}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

// --- 아래는 기존과 동일한 미리보기 및 줌 관련 로직 ---

function openPreviewModal(htmlContent) {
  if (!document.getElementById('pdf-preview-modal')) {
    createModalDOM();
  }

  const modal = document.getElementById('pdf-preview-modal');
  const iframe = document.getElementById('pdf-preview-iframe');
  
  modal.style.display = 'flex';

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  const iframeWin = iframe.contentWindow;
  iframeWin.removeEventListener('wheel', handleWheelZoom);
  iframeWin.addEventListener('wheel', handleWheelZoom, { passive: false });

  iframe.onload = () => {
    resizeIframe(iframe);
    iframe.contentWindow.removeEventListener('wheel', handleWheelZoom);
    iframe.contentWindow.addEventListener('wheel', handleWheelZoom, { passive: false });
  };
  
  setTimeout(() => resizeIframe(iframe), 100);

  currentZoom = 1.0;
  updateZoom();
  
  modal.focus();
}

function handleWheelZoom(e) {
  if (e.ctrlKey) {
    e.preventDefault();
    e.stopPropagation();
    if (e.deltaY > 0) zoomIn();
    else zoomOut();
  }
}

function resizeIframe(iframe) {
  if (!iframe.contentWindow) return;
  try {
    const body = iframe.contentWindow.document.body;
    const html = iframe.contentWindow.document.documentElement;
    const height = Math.max(
      body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight
    );
    iframe.style.height = (height + 20) + 'px';
    updateZoom();
  } catch (e) {
    console.warn('iframe resize failed:', e);
  }
}

function closePreviewModal() {
  const modal = document.getElementById('pdf-preview-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function updateZoom() {
  const iframe = document.getElementById('pdf-preview-iframe');
  const wrapper = document.getElementById('iframe-wrapper');
  const zoomLevelText = document.getElementById('zoom-level-text');
  
  if (iframe && wrapper && zoomLevelText) {
    zoomLevelText.textContent = `${Math.round(currentZoom * 100)}%`;
    iframe.style.transform = `scale(${currentZoom})`;
    
    const unscaledWidth = iframe.offsetWidth;
    const unscaledHeight = iframe.offsetHeight;
    
    if (unscaledWidth && unscaledHeight) {
      wrapper.style.width = `${unscaledWidth * currentZoom}px`;
      wrapper.style.height = `${unscaledHeight * currentZoom}px`;
    }
  }
}

function zoomIn() {
  if (currentZoom < 2.5) {
    currentZoom = Math.round((currentZoom + 0.1) * 10) / 10;
    updateZoom();
  }
}

function zoomOut() {
  if (currentZoom > 0.3) {
    currentZoom = Math.round((currentZoom - 0.1) * 10) / 10;
    updateZoom();
  }
}

async function savePDF() {
  try {
    const result = await ipcRenderer.invoke('export-to-pdf', previewHtmlContent);
    if (result.success) {
      alert('PDF 저장이 완료되었습니다!\n경로: ' + result.filePath);
      closePreviewModal();
    } else if (!result.canceled) {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error(error);
    alert(`PDF 생성 실패: ${error.message}`);
  }
}

function createModalDOM() {
  if (document.getElementById('pdf-preview-modal')) return;

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'pdf-preview-modal';
  modalOverlay.className = 'modal-overlay';
  modalOverlay.setAttribute('tabindex', '-1');
  
  modalOverlay.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <div class="modal-title"><span>📄 PDF 미리보기</span></div>
        <div class="modal-controls">
          <div class="zoom-controls">
            <button class="btn-zoom" id="btn-zoom-out" title="축소 (Ctrl+휠업)">－</button>
            <span class="zoom-level" id="zoom-level-text">100%</span>
            <button class="btn-zoom" id="btn-zoom-in" title="확대 (Ctrl+휠다운)">＋</button>
          </div>
          <button class="btn btn-primary" id="btn-save-pdf">💾 저장하기</button>
          <button class="btn btn-secondary" id="btn-close-modal">닫기</button>
        </div>
      </div>
      <div class="preview-body">
        <div id="iframe-wrapper">
          <iframe id="pdf-preview-iframe"></iframe>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  document.getElementById('btn-close-modal').addEventListener('click', closePreviewModal);
  document.getElementById('btn-save-pdf').addEventListener('click', savePDF);
  document.getElementById('btn-zoom-in').addEventListener('click', zoomIn);
  document.getElementById('btn-zoom-out').addEventListener('click', zoomOut);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closePreviewModal();
  });

  modalOverlay.addEventListener('wheel', handleWheelZoom, { passive: false });
}

window.exportToPDF = exportToPDF;