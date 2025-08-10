# 🚀 실시간 개발 가이드

이 문서는 실시간으로 웹페이지를 보면서 코드를 수정하는 방법을 설명합니다.

## 🎯 가장 좋은 실시간 개발 방법

### 1. **기본 실시간 개발** (추천)
```bash
# 개발 서버 시작 (자동으로 브라우저 열림)
npm run dev:all
```

### 2. **자동 저장과 함께 실시간 개발**
```bash
# 개발 서버 + 자동 저장 (파일 변경 시 자동으로 GitHub에 저장)
npm run dev:full
```

### 3. **수동 저장과 함께 실시간 개발**
```bash
# 개발 서버만 시작
npm run dev:all

# 별도 터미널에서 자동 저장 실행
npm run watch-save
```

## 🛠️ 개발 환경 설정

### 필수 요구사항
- Node.js 18+ 또는 Bun
- Git
- 브라우저 (Chrome, Firefox, Safari 등)

### 권장 개발 도구
- **VS Code** (추천)
  - Live Server 확장
  - Auto Rename Tag
  - Bracket Pair Colorizer
  - Prettier

- **브라우저 개발자 도구**
  - React Developer Tools
  - Redux DevTools (Redux 사용 시)

## 🎨 실시간 개발 워크플로우

### 1. 개발 서버 시작
```bash
# 프로젝트 루트에서
npm run dev:all
```

### 2. 브라우저에서 확인
- 자동으로 `http://localhost:8080`이 열립니다
- 또는 수동으로 브라우저에서 접속

### 3. 코드 수정
- VS Code에서 파일을 수정
- 저장하면 자동으로 브라우저가 새로고침됨
- Hot Module Replacement (HMR)로 빠른 업데이트

### 4. 자동 저장 (선택사항)
```bash
# 별도 터미널에서
npm run watch-save
```

## 🔧 고급 설정

### Vite 설정 최적화
- `vite.config.ts`에서 이미 최적화됨:
  - 자동 브라우저 열기
  - 파일 변경 감지 개선
  - HMR 오버레이
  - 소스맵 활성화

### 네트워크 접근
```bash
# 로컬 네트워크에서 접근 가능 (모바일 테스트용)
npm run dev:host
```

### 포트 변경
`vite.config.ts`에서 포트를 변경할 수 있습니다:
```typescript
server: {
  port: 3000, // 원하는 포트로 변경
}
```

## 🐛 문제 해결

### 개발 서버가 시작되지 않는 경우
1. 포트가 사용 중인지 확인
2. Node.js 버전 확인 (`node --version`)
3. 의존성 재설치: `npm install`

### 브라우저가 자동으로 열리지 않는 경우
1. `npm run dev:open` 사용
2. 수동으로 `http://localhost:8080` 접속

### 파일 변경이 감지되지 않는 경우
1. `vite.config.ts`의 `usePolling: true` 설정 확인
2. 파일 시스템 권한 확인

### 자동 저장이 작동하지 않는 경우
1. Git 설정 확인
2. GitHub 토큰 설정 확인
3. `npm run quick-save`로 수동 테스트

## 📱 모바일 테스트

### 로컬 네트워크에서 모바일 접근
```bash
# 호스트 모드로 시작
npm run dev:host

# 터미널에 표시되는 IP 주소로 모바일에서 접속
# 예: http://192.168.1.100:8080
```

### 모바일 개발자 도구
- Chrome DevTools의 Device Toolbar 사용
- 실제 모바일 기기로 테스트 권장

## 🎯 개발 팁

### 1. 빠른 개발
- `Ctrl+S` (또는 `Cmd+S`)로 자주 저장
- 브라우저 개발자 도구 활용
- React Developer Tools 설치

### 2. 디버깅
- `console.log()` 대신 브라우저 개발자 도구 사용
- React Developer Tools로 컴포넌트 상태 확인
- Network 탭으로 API 요청 확인

### 3. 성능 최적화
- 개발 시에는 소스맵 활성화
- 프로덕션 빌드 시에는 소스맵 비활성화
- 불필요한 리렌더링 확인

## 🔄 자동화 스크립트

### 자동 저장 스크립트
```bash
# 기본 자동 저장
npm run auto-save

# 커스텀 메시지와 함께
./scripts/auto-commit.sh "주소 검색 기능 개선"

# Node.js 기반
node scripts/auto-commit.js "UI 개선"
```

### 개발 + 자동 저장
```bash
# 개발 서버 + 자동 저장 (추천)
npm run dev:full
```

이제 실시간으로 웹페이지를 보면서 코드를 수정할 수 있습니다! 🎉

