# 빠른 시작 가이드

## 1단계: 프로젝트 빌드

```powershell
node build.js
```

이 명령은 다음 작업을 수행합니다:
- TypeScript 파일을 JavaScript로 컴파일
- 필요한 파일들을 `dist` 폴더로 복사

## 2단계: 애플리케이션 실행

```powershell
npm start
```

또는 빌드와 실행을 한 번에:

```powershell
npm run dev
```

## 애플리케이션 사용

### 기본 작업 흐름

1. **행 추가**
   - "+ 행 추가" 버튼 클릭
   - 설명, 날짜, 비중, 점수 입력

2. **실시간 계산 확인**
   - 비중과 점수 입력 시 예상평가점수가 자동 계산됨
   - 하단의 합계가 실시간으로 업데이트됨

3. **데이터 저장**
   - File → Save (Ctrl+S)
   - 또는 File → Save As (Ctrl+Shift+S)

4. **데이터 불러오기**
   - File → Load (Ctrl+O)
   - 저장된 .dat 파일 선택

## 예제 데이터 사용

프로젝트에 포함된 `example-data.dat` 파일을 불러와서 예제를 확인할 수 있습니다.

## 주요 기능

✅ **실시간 계산**: 입력 즉시 결과 반영  
✅ **멀티라인 설명**: 여러 줄 작성 가능  
✅ **자동 높이 조절**: 설명란이 내용에 맞게 자동 확장  
✅ **100% 검증**: 비중 합계가 100%인지 자동 확인  
✅ **안전한 저장**: Base64 인코딩된 .dat 파일  

## 문제 해결

### "Cannot find module" 오류
```powershell
npm install
```

### "dist 폴더가 없습니다" 오류
```powershell
node build.js
```

### 애플리케이션이 실행되지 않음
1. `node_modules` 폴더 확인
2. `dist` 폴더 확인
3. 위 명령들을 순서대로 실행

## 배포용 실행 파일 생성

```powershell
npm run dist
```

`release` 폴더에 Windows 설치 파일이 생성됩니다.

