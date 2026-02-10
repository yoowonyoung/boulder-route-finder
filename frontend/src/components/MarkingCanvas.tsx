import React, { useRef, useEffect, useCallback, useState } from 'react';
import { HoldInput, HoldType } from '../types';

interface MarkingCanvasProps {
  imageUrl: string;
  holds: HoldInput[];
  onHoldsChange: (holds: HoldInput[]) => void;
  onImageLoad: (width: number, height: number) => void;
}

export const MarkingCanvas: React.FC<MarkingCanvasProps> = ({
  imageUrl,
  holds,
  onHoldsChange,
  onImageLoad,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(null);
  
  // 홀드 타입 선택 모드
  const [currentMode, setCurrentMode] = useState<HoldType>('start');
  
  // 줌 관련 상태
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // 홀드 타입별 색상
  const getHoldColor = (holdType: HoldType) => {
    switch (holdType) {
      case 'start': return '#22c55e'; // 초록
      case 'top': return '#ef4444';   // 빨강
      case 'foot': return '#f59e0b';  // 주황
      default: return '#3b82f6';      // 파랑
    }
  };

  // 홀드 타입별 아이콘
  const getHoldIcon = (holdType: HoldType) => {
    switch (holdType) {
      case 'start': return '🚀';
      case 'top': return '🏁';
      case 'foot': return '🦶';
      default: return '';
    }
  };

  // 홀드 번호 원 그리기 (모바일 최적화 - 크기 절반)
  const drawHoldCircle = useCallback((
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    order: number,
    holdType: HoldType
  ) => {
    const color = getHoldColor(holdType);
    const icon = getHoldIcon(holdType);
    
    // 외부 원 (검은색) - 크기 절반 (22 -> 11)
    ctx.beginPath();
    ctx.arc(x, y, 11 / zoom, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1 / zoom;
    ctx.stroke();

    // 내부 원 (색상) - 크기 절반 (18 -> 9)
    ctx.beginPath();
    ctx.arc(x, y, 9 / zoom, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // 번호 또는 아이콘 - 폰트 크기 절반 (14 -> 7, 16 -> 8)
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${7 / zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (icon && (holdType === 'start' || holdType === 'top')) {
      ctx.font = `${8 / zoom}px Arial`;
      ctx.fillText(icon, x, y);
    } else {
      ctx.fillText(order.toString(), x, y);
    }
  }, [zoom]);

  // 캔버스 다시 그리기
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || !displaySize) return;

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 변환 적용 (줌 & 팬)
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 홀드들 그리기
    holds.forEach((hold) => {
      if (imageSize && displaySize) {
        const displayX = (hold.x / imageSize.width) * displaySize.width;
        const displayY = (hold.y / imageSize.height) * displaySize.height;
        drawHoldCircle(ctx, displayX, displayY, hold.order, hold.holdType);
      }
    });

    ctx.restore();
  }, [holds, imageSize, displaySize, drawHoldCircle, zoom, pan]);

  // 이미지 로드 처리
  const handleImageLoad = useCallback(() => {
    const image = imageRef.current;
    const container = containerRef.current;
    if (!image || !container) return;

    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    
    setImageSize({ width: naturalWidth, height: naturalHeight });
    onImageLoad(naturalWidth, naturalHeight);

    const containerWidth = container.clientWidth;
    const aspectRatio = naturalHeight / naturalWidth;
    const displayWidth = Math.min(containerWidth, naturalWidth);
    const displayHeight = displayWidth * aspectRatio;
    
    setDisplaySize({ width: displayWidth, height: displayHeight });
  }, [onImageLoad]);

  // 캔버스 클릭 처리
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!imageSize || !displaySize || isPanning) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // 줌 & 팬 고려한 좌표 변환
      const adjustedX = (clickX - pan.x) / zoom;
      const adjustedY = (clickY - pan.y) / zoom;

      // 표시 좌표를 실제 이미지 좌표로 변환
      const imageX = (adjustedX / displaySize.width) * imageSize.width;
      const imageY = (adjustedY / displaySize.height) * imageSize.height;

      // 현재 모드에 따른 order 계산
      const sameTypeCount = holds.filter(h => h.holdType === currentMode).length;
      
      const newHold: HoldInput = {
        x: Math.round(imageX),
        y: Math.round(imageY),
        order: currentMode === 'middle' ? sameTypeCount + 1 : sameTypeCount + 1,
        holdType: currentMode,
      };

      onHoldsChange([...holds, newHold]);
      
      // 시작 홀드 추가 후 자동으로 중간 모드로 전환
      if (currentMode === 'start' && holds.filter(h => h.holdType === 'start').length >= 1) {
        // 2개 이상 시작 홀드도 허용하므로 유지
      }
    },
    [holds, onHoldsChange, imageSize, displaySize, currentMode, zoom, pan, isPanning]
  );

  // 터치 상태 관리
  const [touchState, setTouchState] = useState<{
    startPos: { x: number; y: number } | null;
    isMoved: boolean;
    isMultiTouch: boolean;
    lastDistance: number | null;
    lastCenter: { x: number; y: number } | null;
  }>({
    startPos: null,
    isMoved: false,
    isMultiTouch: false,
    lastDistance: null,
    lastCenter: null,
  });

  // 두 점 사이 거리 계산
  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 두 점의 중심 계산
  const getTouchCenter = (touches: React.TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  // 터치 시작 (모바일)
  const handleCanvasTouch = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      // 두 손가락이면 줌/팬 모드
      if (e.touches.length === 2) {
        setTouchState({
          startPos: null,
          isMoved: true,
          isMultiTouch: true,
          lastDistance: getTouchDistance(e.touches),
          lastCenter: getTouchCenter(e.touches),
        });
        return;
      }
      
      // 한 손가락이면 시작 위치 기록 (아직 홀드 추가 안 함)
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        setTouchState({
          startPos: { x: touch.clientX, y: touch.clientY },
          isMoved: false,
          isMultiTouch: false,
          lastDistance: null,
          lastCenter: null,
        });
      }
    },
    []
  );

  // 터치 이동
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      
      // 두 손가락 줌/팬
      if (e.touches.length === 2 && touchState.lastDistance && touchState.lastCenter) {
        const newDistance = getTouchDistance(e.touches);
        const scale = newDistance / touchState.lastDistance;
        setZoom(z => Math.min(Math.max(z * scale, 1), 4));

        const newCenter = getTouchCenter(e.touches);
        const dx = newCenter.x - touchState.lastCenter.x;
        const dy = newCenter.y - touchState.lastCenter.y;
        setPan(p => ({ x: p.x + dx, y: p.y + dy }));

        setTouchState(prev => ({
          ...prev,
          lastDistance: newDistance,
          lastCenter: newCenter,
        }));
        return;
      }
      
      // 한 손가락 이동 - 움직임 감지
      if (e.touches.length === 1 && touchState.startPos) {
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchState.startPos.x);
        const dy = Math.abs(touch.clientY - touchState.startPos.y);
        
        // 10px 이상 움직이면 드래그로 간주
        if (dx > 10 || dy > 10) {
          setTouchState(prev => ({ ...prev, isMoved: true }));
        }
      }
    },
    [touchState]
  );

  // 터치 종료 - 여기서 홀드 추가
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      
      // 멀티터치였거나 움직였으면 홀드 추가 안 함
      if (touchState.isMultiTouch || touchState.isMoved || !touchState.startPos) {
        setTouchState({
          startPos: null,
          isMoved: false,
          isMultiTouch: false,
          lastDistance: null,
          lastCenter: null,
        });
        return;
      }
      
      // 한 손가락 탭 - 홀드 추가
      if (!imageSize || !displaySize) {
        setTouchState({
          startPos: null,
          isMoved: false,
          isMultiTouch: false,
          lastDistance: null,
          lastCenter: null,
        });
        return;
      }
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const touchX = touchState.startPos.x - rect.left;
      const touchY = touchState.startPos.y - rect.top;

      const adjustedX = (touchX - pan.x) / zoom;
      const adjustedY = (touchY - pan.y) / zoom;

      const imageX = (adjustedX / displaySize.width) * imageSize.width;
      const imageY = (adjustedY / displaySize.height) * imageSize.height;

      const sameTypeCount = holds.filter(h => h.holdType === currentMode).length;

      const newHold: HoldInput = {
        x: Math.round(imageX),
        y: Math.round(imageY),
        order: sameTypeCount + 1,
        holdType: currentMode,
      };

      onHoldsChange([...holds, newHold]);
      
      // 상태 초기화
      setTouchState({
        startPos: null,
        isMoved: false,
        isMultiTouch: false,
        lastDistance: null,
        lastCenter: null,
      });
    },
    [touchState, holds, onHoldsChange, imageSize, displaySize, currentMode, zoom, pan]
  );

  // 줌 인/아웃
  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z * 1.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z / 1.5, 1));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // 마우스 휠로 줌
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 1), 4));
  }, []);

  // 팬 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // 미들 클릭 또는 Alt+클릭
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, []);

  // 팬 이동
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint]);

  // 팬 종료
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // 실행취소
  const handleUndo = useCallback(() => {
    if (holds.length > 0) {
      onHoldsChange(holds.slice(0, -1));
    }
  }, [holds, onHoldsChange]);

  // 전체 초기화
  const handleClear = useCallback(() => {
    onHoldsChange([]);
    setCurrentMode('start');
  }, [onHoldsChange]);

  // 캔버스 크기 업데이트
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && displaySize) {
      canvas.width = displaySize.width;
      canvas.height = displaySize.height;
      redrawCanvas();
    }
  }, [displaySize, redrawCanvas]);

  // 홀드 변경시 캔버스 다시 그리기
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // 홀드 타입별 개수
  const startCount = holds.filter(h => h.holdType === 'start').length;
  const middleCount = holds.filter(h => h.holdType === 'middle').length;
  const topCount = holds.filter(h => h.holdType === 'top').length;
  const footCount = holds.filter(h => h.holdType === 'foot').length;

  return (
    <div className="space-y-4">
      {/* 모드 선택 버튼 */}
      <div className="flex gap-2 justify-center flex-wrap">
        <button
          onClick={() => setCurrentMode('start')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            currentMode === 'start'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🚀 시작 홀드 ({startCount})
        </button>
        <button
          onClick={() => setCurrentMode('middle')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            currentMode === 'middle'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ⬆️ 경유 홀드 ({middleCount})
        </button>
        <button
          onClick={() => setCurrentMode('top')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            currentMode === 'top'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🏁 탑 ({topCount})
        </button>
        <button
          onClick={() => setCurrentMode('foot')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            currentMode === 'foot'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🦶 발 ({footCount})
        </button>
      </div>

      {/* 줌 컨트롤 */}
      <div className="flex gap-2 justify-center items-center">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          ➖
        </button>
        <span className="px-3 py-1 bg-gray-100 rounded min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 4}
          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          ➕
        </button>
        <button
          onClick={handleZoomReset}
          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          ↺ 리셋
        </button>
      </div>

      {/* 캔버스 영역 */}
      <div 
        ref={containerRef} 
        className="relative overflow-hidden rounded-lg shadow-lg bg-gray-900"
        style={{ maxHeight: '70vh' }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Boulder problem"
            className="max-w-full"
            onLoad={handleImageLoad}
            style={displaySize ? { width: displaySize.width, height: displaySize.height } : {}}
          />
        </div>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 cursor-crosshair"
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasTouch}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ touchAction: 'none' }}
        />
      </div>
      
      {/* 안내 메시지 */}
      {zoom > 1 && (
        <div className="text-center text-sm text-blue-600">
          💡 Alt + 드래그로 이미지 이동 가능
        </div>
      )}

      {/* 컨트롤 버튼들 */}
      <div className="flex gap-2 justify-center flex-wrap">
        <button
          onClick={handleUndo}
          disabled={holds.length === 0}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          ↶ 실행취소
        </button>
        <button
          onClick={handleClear}
          disabled={holds.length === 0}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          🗑️ 전체 초기화
        </button>
        <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded">
          총 홀드: {holds.length}
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-600">
        모드를 선택하고 클릭하여 홀드를 추가하세요. 마우스 휠로 확대/축소할 수 있습니다.
      </div>
    </div>
  );
};
