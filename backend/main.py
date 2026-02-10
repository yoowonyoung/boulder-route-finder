"""
볼더링 루트파인더 Backend API
FastAPI + Claude API를 사용한 베타 생성 서비스
"""

import json
import os
import math
from typing import List, Dict, Any, Optional, Literal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from anthropic import Anthropic
from dotenv import load_dotenv

from prompts.beta_prompt import get_beta_prompt

# 환경변수 로드
load_dotenv()

app = FastAPI(
    title="Boulder Route Finder API",
    description="볼더링 루트 분석 및 베타 생성 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Anthropic 클라이언트 초기화
try:
    anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
except Exception as e:
    print(f"Warning: Anthropic API key not configured properly: {e}")
    anthropic = None

# Pydantic 모델 정의
class Hold(BaseModel):
    """홀드 좌표 정보"""
    x: float
    y: float
    order: int
    holdType: Literal["start", "middle", "top", "foot"] = "middle"

class BetaRequest(BaseModel):
    """베타 생성 요청 모델"""
    holds: List[Hold]
    imageWidth: int
    imageHeight: int

class Arrow(BaseModel):
    """화살표 정보"""
    fromX: float
    fromY: float
    toX: float
    toY: float
    direction: Optional[str] = None

class Move(BaseModel):
    """단일 무브 정보"""
    holdIndex: int
    x: float
    y: float
    label: str
    icon: Optional[str] = None
    shortTip: Optional[str] = None
    detailTip: Optional[str] = None
    isCrux: bool = False
    arrow: Optional[Arrow] = None

class Summary(BaseModel):
    """베타 요약 정보"""
    difficulty: str
    keyPoints: List[str]
    totalMoves: int

class BetaResponse(BaseModel):
    """베타 생성 응답 모델"""
    moves: List[Move]
    summary: Summary

# 유틸리티 함수
def calculate_distance_cm(x1: float, y1: float, x2: float, y2: float, image_height: int) -> float:
    """두 홀드 사이의 거리를 cm 단위로 추정 계산"""
    pixel_distance = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
    estimated_cm = pixel_distance * (400 / image_height)
    return round(estimated_cm, 1)

def get_direction(x1: float, y1: float, x2: float, y2: float) -> str:
    """두 홀드 사이의 방향을 분석"""
    dx = x2 - x1
    dy = y1 - y2  # y축 반전 (위쪽이 양수)
    
    if abs(dx) < 30 and dy > 20:
        return "up"
    elif dx > 30 and dy > 20:
        return "up-right" 
    elif dx < -30 and dy > 20:
        return "up-left"
    elif abs(dy) < 20 and dx > 30:
        return "right"
    elif abs(dy) < 20 and dx < -30:
        return "left"
    elif dx > 0 and dy > 0:
        return "up-right"
    elif dx < 0 and dy > 0:
        return "up-left"
    else:
        return "up"

def get_move_tip(distance_cm: float, direction: str) -> tuple[str, str, bool]:
    """거리와 방향에 따른 팁 생성"""
    short_tip = ""
    detail_tip = ""
    is_crux = False
    
    # 거리 기반 팁
    if distance_cm > 70:
        short_tip = "다이노!"
        detail_tip = "멀리 있음 - 점프하거나 최대 리치 필요"
        is_crux = True
    elif distance_cm > 50:
        short_tip = "큰 리치"
        detail_tip = "발 위치를 높이 올린 후 손 뻗기"
        is_crux = True
    elif distance_cm > 30:
        short_tip = "발 먼저!"
        detail_tip = "발을 먼저 이동하고 체중 이동 후 손 이동"
    else:
        short_tip = "정적"
        detail_tip = "천천히 안정적으로 이동"
    
    # 방향 기반 추가 팁
    if "left" in direction:
        detail_tip += " / 왼쪽으로 몸 회전"
    elif "right" in direction:
        detail_tip += " / 오른쪽으로 몸 회전"
    
    return short_tip, detail_tip, is_crux

def organize_holds(holds: List[Hold]) -> List[Dict]:
    """홀드를 시작 → 경유 → 탑 순서로 정리"""
    start_holds = [h for h in holds if h.holdType == "start"]
    middle_holds = [h for h in holds if h.holdType == "middle"]
    top_holds = [h for h in holds if h.holdType == "top"]
    
    # 시작 홀드: y좌표 기준 정렬 (낮은 게 먼저, 즉 화면에서 아래쪽)
    start_holds.sort(key=lambda h: -h.y)
    # 경유 홀드: y좌표 기준 정렬 (낮은 게 먼저, 아래서 위로)
    middle_holds.sort(key=lambda h: -h.y)
    # 탑 홀드: y좌표 기준 정렬
    top_holds.sort(key=lambda h: -h.y)
    
    organized = []
    
    # 시작 홀드들 추가
    for i, h in enumerate(start_holds):
        organized.append({
            "x": h.x, "y": h.y, 
            "holdType": "start",
            "startIndex": i + 1,
            "totalStarts": len(start_holds)
        })
    
    # 경유 홀드들 추가
    for i, h in enumerate(middle_holds):
        organized.append({
            "x": h.x, "y": h.y, 
            "holdType": "middle",
            "middleIndex": i + 1
        })
    
    # 탑 홀드들 추가
    for i, h in enumerate(top_holds):
        organized.append({
            "x": h.x, "y": h.y, 
            "holdType": "top",
            "topIndex": i + 1,
            "totalTops": len(top_holds)
        })
    
    return organized

def create_beta_response(holds: List[Hold], image_height: int) -> Dict[str, Any]:
    """홀드 정보로부터 베타 응답 생성"""
    organized = organize_holds(holds)
    moves = []
    
    start_count = len([h for h in holds if h.holdType == "start"])
    total_crux = 0
    max_distance = 0
    
    for i, hold in enumerate(organized):
        move = {
            "holdIndex": i + 1,
            "x": hold["x"],
            "y": hold["y"],
            "isCrux": False,
            "shortTip": None,
            "detailTip": None,
            "arrow": None
        }
        
        # 시작 홀드
        if hold["holdType"] == "start":
            if hold["totalStarts"] > 1:
                move["label"] = f"S{hold['startIndex']}"
                move["icon"] = "🚀"
                if hold["startIndex"] == 1:
                    move["shortTip"] = f"양손 시작"
                    move["detailTip"] = f"시작 홀드 {hold['totalStarts']}개 - 양손/양발 사용"
            else:
                move["label"] = "Start"
                move["icon"] = "🚀"
                move["shortTip"] = "시작!"
                move["detailTip"] = "시작 자세 잡기"
        
        # 탑 홀드
        elif hold["holdType"] == "top":
            if hold.get("totalTops", 1) > 1:
                move["label"] = f"T{hold['topIndex']}"
            else:
                move["label"] = "Top"
            move["icon"] = "🏁"
            move["shortTip"] = "탑!"
            move["detailTip"] = "마지막 홀드 잡고 완등"
            
            # 이전 홀드로부터 화살표
            if i > 0:
                prev = organized[i-1]
                distance = calculate_distance_cm(prev["x"], prev["y"], hold["x"], hold["y"], image_height)
                direction = get_direction(prev["x"], prev["y"], hold["x"], hold["y"])
                move["arrow"] = {
                    "fromX": prev["x"],
                    "fromY": prev["y"],
                    "toX": hold["x"],
                    "toY": hold["y"],
                    "direction": direction
                }
        
        # 경유 홀드
        else:
            move["label"] = str(hold["middleIndex"])
            
            # 이전 홀드로부터 화살표와 팁
            if i > 0:
                prev = organized[i-1]
                distance = calculate_distance_cm(prev["x"], prev["y"], hold["x"], hold["y"], image_height)
                direction = get_direction(prev["x"], prev["y"], hold["x"], hold["y"])
                
                short_tip, detail_tip, is_crux = get_move_tip(distance, direction)
                
                move["arrow"] = {
                    "fromX": prev["x"],
                    "fromY": prev["y"],
                    "toX": hold["x"],
                    "toY": hold["y"],
                    "direction": direction
                }
                move["shortTip"] = short_tip
                move["detailTip"] = detail_tip
                move["isCrux"] = is_crux
                
                if is_crux:
                    total_crux += 1
                if distance > max_distance:
                    max_distance = distance
        
        moves.append(move)
    
    # 난이도 추정
    if max_distance > 70 or total_crux >= 3:
        difficulty = "V4-V5 (어려움)"
    elif max_distance > 50 or total_crux >= 2:
        difficulty = "V3-V4 (중상)"
    elif max_distance > 30 or total_crux >= 1:
        difficulty = "V2-V3 (중간)"
    else:
        difficulty = "V1-V2 (쉬움)"
    
    # 핵심 포인트
    key_points = []
    if start_count > 1:
        key_points.append(f"시작 홀드 {start_count}개 (양손/양발)")
    if total_crux > 0:
        key_points.append(f"크럭스 구간 {total_crux}개")
    if max_distance > 50:
        key_points.append("큰 리치 무브 있음")
    if not key_points:
        key_points.append("비교적 안정적인 루트")
    
    return {
        "moves": moves,
        "summary": {
            "difficulty": difficulty,
            "keyPoints": key_points,
            "totalMoves": len(moves)
        }
    }

# API 엔드포인트
@app.get("/")
async def root():
    return {"message": "Boulder Route Finder API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    anthropic_status = "connected" if anthropic else "not configured"
    return {
        "status": "healthy",
        "anthropic_api": anthropic_status,
        "version": "1.0.0"
    }

@app.post("/api/beta", response_model=BetaResponse)
async def generate_beta(request: BetaRequest):
    """베타 생성 엔드포인트"""
    
    if not request.holds:
        raise HTTPException(status_code=400, detail="홀드 정보가 필요합니다")
    
    if len(request.holds) < 2:
        raise HTTPException(status_code=400, detail="최소 2개 이상의 홀드가 필요합니다")
    
    try:
        # 로컬 분석으로 베타 생성 (Claude API 사용하지 않음 - 더 빠르고 안정적)
        parsed_response = create_beta_response(request.holds, request.imageHeight)
        return BetaResponse(**parsed_response)
        
    except Exception as e:
        print(f"Error generating beta: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
