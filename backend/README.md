# 🧗‍♂️ Boulder Route Finder Backend

볼더링 루트 분석 및 베타 생성을 위한 FastAPI 백엔드 서비스입니다.

## 📁 프로젝트 구조

```
backend/
├── main.py              # FastAPI 메인 애플리케이션
├── requirements.txt     # Python 의존성
├── Dockerfile          # 도커 설정
├── .env.example        # 환경변수 설정 예시
├── test_request.json   # API 테스트용 예시 요청
├── README.md           # 이 파일
└── prompts/
    └── beta_prompt.py  # 볼더링 도메인 지식 프롬프트
```

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 1. 환경변수 파일 생성
cp .env.example .env

# 2. .env 파일에서 API 키 설정
# ANTHROPIC_API_KEY=your_actual_api_key_here
```

### 2. 로컬 실행

```bash
# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python main.py
```

### 3. Docker 실행

```bash
# 이미지 빌드
docker build -t boulder-backend .

# 컨테이너 실행
docker run -d -p 8000:8000 --env-file .env boulder-backend
```

## 📡 API 엔드포인트

### GET /api/health
상태 체크

```bash
curl http://localhost:8000/api/health
```

**응답:**
```json
{
  "status": "healthy",
  "anthropic_api": "connected",
  "version": "1.0.0"
}
```

### POST /api/beta
베타 생성

```bash
curl -X POST http://localhost:8000/api/beta \
  -H "Content-Type: application/json" \
  -d @test_request.json
```

**요청 형식:**
```json
{
  "holds": [
    {"x": 320, "y": 1050, "order": 1},
    {"x": 280, "y": 870, "order": 2},
    {"x": 310, "y": 720, "order": 3}
  ],
  "imageWidth": 720,
  "imageHeight": 1280
}
```

**응답 형식:**
```json
{
  "moves": [
    {
      "holdIndex": 1,
      "x": 320, "y": 1050,
      "label": "Start",
      "icon": "🚀",
      "shortTip": null,
      "isCrux": false,
      "arrow": null
    },
    {
      "holdIndex": 2,
      "x": 280, "y": 870,
      "label": "2",
      "arrow": {
        "fromX": 320, "fromY": 1050,
        "toX": 280, "toY": 870,
        "direction": "up-left"
      },
      "shortTip": "발 먼저!",
      "isCrux": false
    }
  ],
  "summary": {
    "difficulty": "V3-V4",
    "keyPoints": ["크럭스 구간", "발이 핵심"],
    "totalMoves": 5
  }
}
```

## 🧠 볼더링 도메인 지식

베타 생성시 다음 요소들을 고려합니다:

### 홀드 타입
- **저그(Jug)**: 큰 손잡이, 안정적
- **크림프(Crimp)**: 작은 홀드, 파워 그립
- **슬로퍼(Sloper)**: 경사진 홀드, 마찰력
- **핀치(Pinch)**: 엄지로 조이기
- **포켓(Pocket)**: 손가락 1-3개

### 무브 타입
- **정적 무브**: 20cm 이하, 컨트롤된 이동
- **다이나믹**: 20-40cm, 리치 + 바디 텐션
- **다이노**: 40cm+, 점프 무브

### 고급 테크닉
- **힐훅**: 발꿈치로 홀드 걸기
- **토훅**: 발가락 끝으로 걸기
- **플래깅**: 균형용 발 교차
- **드롭니**: 무릎 꺾어 무게중심 이동

### 크럭스 판단
- 거리 50cm+ 다이나믹 무브
- 홀드 크기 급변 구간
- 방향 전환 복잡 구간
- 특수 body position 필요

## 🔧 개발

### 의존성 관리
```bash
# 새 패키지 추가시
pip install package_name
pip freeze > requirements.txt
```

### 로그 확인
```bash
# 컨테이너 로그
docker logs boulder-backend

# 실시간 로그
docker logs -f boulder-backend
```

### API 문서
서버 실행 후 다음 URL에서 확인:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## ⚠️ 주의사항

1. **API 키 보안**: `.env` 파일은 절대 Git에 커밋하지 마세요
2. **CORS 설정**: 운영환경에서는 `allow_origins=["*"]`을 특정 도메인으로 변경하세요
3. **에러 핸들링**: Claude API 호출 실패시 fallback 응답을 제공합니다
4. **좌표 시스템**: 이미지 좌표계 (0,0)는 좌상단, y축은 아래로 증가

## 📞 트러블슈팅

### Claude API 에러
```bash
# API 키 확인
echo $ANTHROPIC_API_KEY

# 헬스체크로 연결 상태 확인
curl http://localhost:8000/api/health
```

### 서버 실행 에러
```bash
# 포트 사용중인지 확인
lsof -i :8000

# 의존성 재설치
pip install --force-reinstall -r requirements.txt
```