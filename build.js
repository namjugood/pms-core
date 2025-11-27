/**
 * 간단한 빌드 스크립트
 * TypeScript 파일을 JavaScript로 컴파일
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('빌드 시작...');

// dist 디렉터리 생성
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// TypeScript 컴파일
try {
  console.log('TypeScript 컴파일 중...');
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('TypeScript 컴파일 완료!');
} catch (error) {
  console.error('TypeScript 컴파일 실패:', error.message);
  process.exit(1);
}

// renderer 파일 복사
console.log('Renderer 파일 복사 중...');
const rendererSrc = path.join(__dirname, 'src', 'renderer');
const rendererDist = path.join(distDir, 'renderer');

// 디렉터리 생성
if (!fs.existsSync(rendererDist)) {
  fs.mkdirSync(rendererDist, { recursive: true });
}

// 파일 복사 함수
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else if (
      entry.name.endsWith('.js') || 
      entry.name.endsWith('.html') || 
      entry.name.endsWith('.css') ||
      entry.name.endsWith('.json') ||
      entry.name.endsWith('.dat')
    ) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirectory(rendererSrc, rendererDist);

console.log('빌드 완료!');

