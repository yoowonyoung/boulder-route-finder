# Boulder Route Finder - Frontend

볼더링 루트 파인더의 프론트엔드 애플리케이션입니다. React + TypeScript + Vite + Tailwind CSS로 구축되었습니다.

## 🚀 기능

- **이미지 업로드**: 드래그앤드롭 또는 파일 선택으로 볼더링 문제 이미지 업로드
- **홀드 마킹**: 캔버스에 클릭/터치로 홀드 위치 마킹 (순서 자동 부여)
- **베타 시각화**: AI 분석 결과를 이미지 위에 오버레이로 표시
  - 시작점/탑 표시 (🚀/🏁)
  - 무브 방향 화살표
  - 크럭스 표시 (⚠️)
  - 짧은 팁 말풍선
- **베타 요약**: 난이도 추정, 핵심 포인트, 총 무브 수

## 🛠️ 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **HTML Canvas API** - 이미지 위 마킹 및 시각화

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── ImageUploader.tsx     # 이미지 업로드 컴포넌트
│   ├── MarkingCanvas.tsx     # 홀드 마킹 캔버스
│   ├── BetaOverlay.tsx       # 베타 시각화 오버레이
│   └── BetaSummary.tsx       # 베타 요약 패널
├── services/
│   └── api.ts                # API 통신 서비스
├── types/
│   └── index.ts              # TypeScript 타입 정의
├── App.tsx                   # 메인 앱 컴포넌트
└── main.tsx                  # 엔트리 포인트
```

## 🏃‍♀️ 개발 환경 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

애플리케이션이 http://localhost:5173 에서 실행됩니다.

### 3. 빌드
```bash
npm run build
```

### 4. 프로덕션 프리뷰
```bash
npm run preview
```

## 🐋 Docker 실행

### 1. 이미지 빌드
```bash
docker build -t boulder-route-finder-frontend .
```

### 2. 컨테이너 실행
```bash
docker run -p 80:80 boulder-route-finder-frontend
```

애플리케이션이 http://localhost 에서 실행됩니다.

## 🔧 설정

### API 프록시

개발 환경에서 백엔드 API는 `vite.config.ts`에 설정된 프록시를 통해 접근합니다:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

프로덕션 환경에서는 nginx가 API 요청을 백엔드로 프록시합니다.

### 환경 변수

필요시 `.env` 파일을 생성하여 환경별 설정을 추가할 수 있습니다:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 📱 모바일 지원

- 터치 이벤트 지원으로 모바일에서도 홀드 마킹 가능
- 반응형 디자인으로 다양한 화면 크기 지원
- 터치 스크롤 방지 및 드래그 방지 설정

## 🎨 UX 흐름

1. **이미지 업로드**: 볼더링 문제 사진 업로드
2. **홀드 마킹**: 클릭/터치로 홀드 위치 마킹 (순서대로)
3. **베타 분석**: AI API 호출하여 베타 분석
4. **결과 표시**: 이미지 위에 베타 오버레이 + 요약 패널

## 🔍 주요 컴포넌트

### ImageUploader
- 드래그앤드롭 파일 업로드
- 이미지 미리보기
- 이미지 제거 기능

### MarkingCanvas
- 이미지 위 캔버스 오버레이
- 클릭/터치로 홀드 마킹
- 실행취소/전체 초기화
- 좌표 정규화 (실제 이미지 크기 기준)

### BetaOverlay
- 베타 시각화 렌더링
- 화살표, 홀드 마커, 팁 말풍선
- 반응형 크기 조정

### BetaSummary
- 베타 분석 결과 요약
- 난이도, 무브 수, 핵심 포인트
- 무브별 상세 정보

## 📦 빌드 아티팩트

- `/dist` - 빌드된 정적 파일들
- 정적 호스팅 또는 nginx로 서빙 가능