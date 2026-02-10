# Boulder Route Finder 🧗

볼더링 루트 분석 도구 - 클라이밍 벽 사진에서 홀드를 마킹하면 AI가 최적의 베타(등반 순서)를 추천합니다.

## 기능

- 📷 클라이밍 벽 사진 업로드
- 🎯 홀드 마킹 (시작/중간/탑 + 손/발 구분)
- 🤖 Claude AI 기반 베타 생성
- 🎨 스틱맨 포즈 가이드 시각화
- 📱 모바일 터치 제스처 지원 (zoom/pan)

## 스크린샷

*coming soon*

## 기술 스택

**Frontend**
- React + TypeScript + Vite
- Tailwind CSS
- Canvas API (홀드 마킹 & 오버레이)

**Backend**
- Python + FastAPI
- Claude API (Anthropic)

**Infrastructure**
- Docker Compose
- Nginx

## 실행 방법

### 사전 요구사항
- Docker & Docker Compose
- Anthropic API Key

### 설정

```bash
# 백엔드 환경변수 설정
cp backend/.env.example backend/.env
# backend/.env 파일에 ANTHROPIC_API_KEY 입력
```

### 실행

```bash
docker-compose up --build
```

브라우저에서 `http://localhost:8080` 접속

## 사용법

1. 클라이밍 벽 사진 업로드
2. 홀드 마킹
   - 🚀 시작 홀드 (초록) - 복수 선택 가능
   - ⬆️ 중간 홀드 (파랑)
   - 🏁 탑 홀드 (빨강)
   - 손/발 홀드 구분 가능
3. "베타 생성" 버튼 클릭
4. AI가 추천하는 등반 순서와 스틱맨 포즈 확인

## 라이선스

MIT
