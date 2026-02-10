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

## v2 로드맵

### 거리 계산 정확도 개선
- [ ] T-nut 구멍 자동 인식 (OpenCV)
- [ ] 사용자 캘리브레이션 (볼트 구멍 2개 클릭 → 20cm 기준)
- [ ] 원근 변환으로 벽 각도 보정

### 입력 개선
- [ ] 홀드 타입 선택 (저그/크림프/슬로퍼/핀치/포켓)
- [ ] 홀드 크기 입력
- [ ] 벽 경사도 입력 (슬랩/수직/오버행)
- [ ] 클라이머 신장/팔 길이 입력

### 베타 품질 개선
- [ ] 실제 거리 기반 무브 추천
- [ ] 클라이머 신체 조건 반영
- [ ] 홀드 타입별 그립 추천

### UX 개선
- [ ] 베타 히스토리 저장
- [ ] 루트 공유 기능
- [ ] 오프라인 모드

## 라이선스

MIT
