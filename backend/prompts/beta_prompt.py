"""
볼더링 베타 생성을 위한 도메인 지식 프롬프트
"""

def get_beta_prompt(holds_data, image_dimensions):
    """
    홀드 데이터를 기반으로 베타 생성 프롬프트를 생성합니다.
    
    Args:
        holds_data: 홀드 좌표와 순서 정보
        image_dimensions: 이미지 크기 정보
    
    Returns:
        str: Claude API에 전송할 프롬프트
    """
    
    holds_info = []
    for i, hold in enumerate(holds_data):
        if i == 0:
            holds_info.append(f"홀드 {hold['order']} (시작): ({hold['x']}, {hold['y']})")
        elif i == len(holds_data) - 1:
            holds_info.append(f"홀드 {hold['order']} (탑): ({hold['x']}, {hold['y']})")
        else:
            holds_info.append(f"홀드 {hold['order']}: ({hold['x']}, {hold['y']})")
    
    # 홀드 간 거리 및 방향 분석
    moves_analysis = []
    for i in range(1, len(holds_data)):
        prev_hold = holds_data[i-1]
        curr_hold = holds_data[i]
        
        # 거리 계산 (픽셀 → 대략적인 cm 변환, 가정: 이미지 높이 1280px = 약 400cm)
        pixel_distance = ((curr_hold['x'] - prev_hold['x'])**2 + (curr_hold['y'] - prev_hold['y'])**2)**0.5
        estimated_cm = pixel_distance * (400 / image_dimensions['height'])
        
        # 방향 분석
        dx = curr_hold['x'] - prev_hold['x']
        dy = prev_hold['y'] - curr_hold['y']  # y축 반전 (위쪽이 양수)
        
        if abs(dx) < 20 and dy > 0:
            direction = "straight up"
        elif dx > 20 and dy > 0:
            direction = "up-right"
        elif dx < -20 and dy > 0:
            direction = "up-left"
        elif abs(dy) < 20 and dx > 0:
            direction = "right"
        elif abs(dy) < 20 and dx < 0:
            direction = "left"
        else:
            direction = "diagonal"
        
        moves_analysis.append({
            'from_hold': prev_hold['order'],
            'to_hold': curr_hold['order'],
            'distance_cm': round(estimated_cm, 1),
            'direction': direction,
            'pixel_distance': round(pixel_distance, 1)
        })
    
    moves_text = []
    for move in moves_analysis:
        moves_text.append(f"홀드 {move['from_hold']} → {move['to_hold']}: {move['direction']}, 약 {move['distance_cm']}cm")
    
    prompt = f"""당신은 볼더링 전문가입니다. 다음 홀드 순서를 분석하여 최적의 베타(climbing sequence)를 추천해주세요.

## 홀드 정보
{chr(10).join(holds_info)}

## 무브 분석
{chr(10).join(moves_text)}

## 볼더링 도메인 지식

### 홀드 타입별 그립 방식
- 저그(Jug): 큰 손잡이, 안정적 그립
- 크림프(Crimp): 작은 홀드, 손가락 끝으로 파워 그립
- 슬로퍼(Sloper): 경사진 홀드, 마찰력과 손목 각도가 중요
- 핀치(Pinch): 엄지와 나머지 손가락으로 조여서 그립
- 포켓(Pocket): 손가락 1-3개를 넣어 그립

### 거리별 무브 추천
- 20cm 이하: 정적 무브 (controlled movement)
- 20-40cm: 리치 + 바디 텐션
- 40-60cm: 다이나믹 무브 또는 중간 홀드 탐색
- 60cm 이상: 다이노(dyno) 고려

### 방향별 테크닉
- **Straight up**: 발 위치가 핵심, 코어 strength 필요
- **Up-right/Up-left**: 몸 회전 활용, 반대편 발로 balance
- **Diagonal**: 사이드풀 + 플래깅 (flagging) 테크닉
- **Sideways**: 크로스오버 또는 매치 무브

### 고급 테크닉
- **힐훅(Heel Hook)**: 발꿈치로 홀드를 걸어 안정감 확보
- **토훅(Toe Hook)**: 발가락 끝으로 홀드를 걸기
- **플래깅(Flagging)**: 균형용 발 교차
- **드롭니(Drop Knee)**: 무릎을 꺾어 무게중심 이동
- **바 (Bar)**: 양손으로 같은 홀드 잡기

### 크럭스 판단 기준
- 거리 50cm 이상의 다이나믹 무브
- 홀드 크기가 급격히 작아지는 구간
- 방향 전환이 필요한 복잡한 무브
- 특수한 body position이 필요한 홀드

## 응답 형식
다음 JSON 형식으로만 응답해주세요:

```json
{{
  "moves": [
    {{
      "holdIndex": 1,
      "label": "Start",
      "icon": "🚀",
      "shortTip": null,
      "isCrux": false,
      "arrow": null
    }},
    {{
      "holdIndex": 2,
      "label": "2",
      "arrow": {{"fromX": {holds_data[0]['x']}, "fromY": {holds_data[0]['y']}, "toX": {holds_data[1]['x'] if len(holds_data) > 1 else holds_data[0]['x']}, "toY": {holds_data[1]['y'] if len(holds_data) > 1 else holds_data[0]['y']}, "direction": "up-left"}},
      "shortTip": "발 먼저!",
      "isCrux": false
    }}
  ],
  "summary": {{
    "difficulty": "V2-V3",
    "keyPoints": ["크럭스 구간 설명", "핵심 테크닉"],
    "totalMoves": {len(holds_data)}
  }}
}}
```

## 주요 고려사항
1. shortTip은 5-7자 이내의 핵심 조언만 (예: "힐훅!", "발 넓게", "몸 회전")
2. 첫 홀드는 "Start" + 🚀, 마지막 홀드는 "Top" + 🏁
3. 거리 40cm 이상이거나 복잡한 body position 필요시 isCrux: true
4. difficulty는 V-scale 사용 (V0~V16)
5. keyPoints는 2-4개의 핵심 포인트만

실제 볼더링 경험을 바탕으로 현실적이고 실용적인 베타를 제공해주세요."""

    return prompt