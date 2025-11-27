/**
 * Electron 메인 프로세스
 * 애플리케이션 창 생성 및 IPC 통신 관리
 */

import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import * as path from 'path';
import { saveDataFile, loadDataFile } from './storage';

let mainWindow: BrowserWindow | null = null;
let userGuideWindow: BrowserWindow | null = null;

/**
 * 메인 윈도우 생성
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#1e1e1e',
    title: '기여도 평가 점수 프로그램'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 개발 시 개발자 도구 자동 열기
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 앱 준비 완료 시 윈도우 생성
app.whenReady().then(() => {
  createWindow();
  createMenu();

  // [추가된 코드] 앱이 시작되자마자 사용자 가이드 창 열기
  openUserGuide();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 모든 윈도우가 닫혔을 때
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * 애플리케이션 메뉴 생성
 */
function createMenu(): void {
  const template: any[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-save');
            }
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-save-as');
            }
          }
        },
        {
          label: 'Load...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-load');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Validate',
          accelerator: 'CmdOrCtrl+Shift+V',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-validate');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' },
        { role: 'selectAll', label: 'Select All' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Reset Zoom' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: '사용자 가이드',
          accelerator: 'F1',
          click: () => {
            openUserGuide();
          }
        },
        { type: 'separator' },
        {
          label: '정보',
          click: () => {
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: '프로그램 정보',
                message: '기여도 평가 점수 프로그램',
                detail: '버전: 1.0.0\n\n프로젝트 기여도를 평가하고 관리하는 도구입니다.\n\n© 2024 All rights reserved.',
                buttons: ['확인']
              });
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * 사용자 가이드 창 열기
 */
function openUserGuide(): void {
  // 이미 열려있으면 포커스만
  if (userGuideWindow && !userGuideWindow.isDestroyed()) {
    userGuideWindow.focus();
    return;
  }

  userGuideWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#1e1e1e',
    title: '사용자 가이드',
    parent: mainWindow || undefined,
    modal: false
  });

  userGuideWindow.loadFile(path.join(__dirname, '../renderer/user-guide.html'));

  // 메뉴바 제거
  userGuideWindow.setMenuBarVisibility(false);

  userGuideWindow.on('closed', () => {
    userGuideWindow = null;
  });
}

/**
 * IPC 핸들러: 저장 디렉터리 선택
 */
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

/**
 * IPC 핸들러: 데이터 저장
 */
ipcMain.handle('save-data', async (event, data: any, filePath: string) => {
  try {
    await saveDataFile(data, filePath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

/**
 * IPC 핸들러: 데이터 불러오기
 */
ipcMain.handle('load-data', async (event, filePath: string) => {
  try {
    const data = await loadDataFile(filePath);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

/**
 * IPC 핸들러: 저장 파일 선택 (저장용)
 */
ipcMain.handle('select-save-file', async () => {
  const result = await dialog.showSaveDialog({
    defaultPath: 'evaluation_data.dat',
    filters: [
      { name: 'Data Files', extensions: ['dat'] }
    ]
  });
  
  if (!result.canceled && result.filePath) {
    return result.filePath;
  }
  return null;
});

/**
 * IPC 핸들러: 파일 선택 (불러오기용)
 */
ipcMain.handle('select-load-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Data Files', extensions: ['dat'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

/**
 * IPC 핸들러: 포커스 강제 재설정 (입력 먹통 해결용)
 * 렌더러에서 요청이 오면 창을 Blur 했다가 다시 Focus 합니다.
 */
ipcMain.on('fix-focus-trap', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // 1. 강제로 포커스 해제 (다른 앱으로 전환한 효과)
    mainWindow.blur();
    
    // 2. 아주 짧은 딜레이 후 다시 포커스 (돌아온 효과)
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.focus();
        // 웹 컨텐츠에도 포커스 전달
        mainWindow.webContents.focus();
      }
    }, 50);
  }
});