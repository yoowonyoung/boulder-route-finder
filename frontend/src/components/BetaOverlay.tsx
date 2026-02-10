import React, { useRef, useEffect, useCallback } from 'react';
import { BetaResponse } from '../types';

interface BetaOverlayProps {
  imageUrl: string;
  betaData: BetaResponse;
  imageSize: { width: number; height: number };
}

export const BetaOverlay: React.FC<BetaOverlayProps> = ({
  imageUrl,
  betaData,
  imageSize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  // 화살표 그리기 함수
  const drawArrow = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      scaleX: number,
      scaleY: number
    ) => {
      const startX = fromX * scaleX;
      const startY = fromY * scaleY;
      const endX = toX * scaleX;
      const endY = toY * scaleY;

      // 화살표 선 - 크기 축소
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 화살표 머리 - 크기 축소
      const angle = Math.atan2(endY - startY, endX - startX);
      const headLength = 8;
      
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle - Math.PI / 6),
        endY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle + Math.PI / 6),
        endY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    },
    []
  );

  // 홀드 마커 그리기 (모바일 최적화 - 크기 절반)
  const drawHoldMarker = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      label: string,
      icon: string | undefined,
      isCrux: boolean,
      scaleX: number,
      scaleY: number
    ) => {
      const displayX = x * scaleX;
      const displayY = y * scaleY;

      // 크럭스 표시
      if (isCrux) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️', displayX, displayY - 18);
      }

      // 홀드 원 - 크기 절반 (20 -> 10)
      let circleColor = '#3b82f6';
      if (label === 'Start') circleColor = '#10b981';
      if (icon === '🏁') circleColor = '#ef4444';

      ctx.beginPath();
      ctx.arc(displayX, displayY, 10, 0, 2 * Math.PI);
      ctx.fillStyle = circleColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 아이콘 또는 라벨 - 폰트 크기 절반
      ctx.fillStyle = '#ffffff';
      if (icon) {
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, displayX, displayY);
      } else {
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, displayX, displayY);
      }
    },
    []
  );

  // 팁 말풍선 그리기 (모바일 최적화 - 크기 축소)
  const drawTipBubble = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      tip: string,
      scaleX: number,
      scaleY: number
    ) => {
      const displayX = x * scaleX;
      const displayY = y * scaleY;

      // 텍스트 크기 측정
      ctx.font = '9px Arial';
      const metrics = ctx.measureText(tip);
      const textWidth = metrics.width;
      const bubbleWidth = textWidth + 10;
      const bubbleHeight = 16;

      // 말풍선 위치 (홀드 오른쪽 위)
      const bubbleX = displayX + 14;
      const bubbleY = displayY - 22;

      // 말풍선 배경
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.beginPath();
      ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 4);
      ctx.fill();

      // 말풍선 꼬리
      ctx.beginPath();
      ctx.moveTo(bubbleX, bubbleY + 8);
      ctx.lineTo(displayX + 10, displayY - 8);
      ctx.lineTo(bubbleX + 5, bubbleY + 10);
      ctx.closePath();
      ctx.fill();

      // 텍스트
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tip, bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight / 2);
    },
    []
  );

  // 오버레이 그리기
  const drawOverlay = useCallback(() => {
    const canvas = overlayRef.current;
    const image = imageRef.current;
    const container = containerRef.current;
    
    if (!canvas || !image || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    const containerWidth = container.clientWidth;
    const aspectRatio = imageSize.height / imageSize.width;
    const displayWidth = Math.min(containerWidth, imageSize.width);
    const displayHeight = displayWidth * aspectRatio;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // 스케일 계산
    const scaleX = displayWidth / imageSize.width;
    const scaleY = displayHeight / imageSize.height;

    // 캔버스 클리어
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // 화살표 먼저 그리기 (홀드 뒤에)
    betaData.moves.forEach((move) => {
      if (move.arrow) {
        drawArrow(
          ctx,
          move.arrow.fromX,
          move.arrow.fromY,
          move.arrow.toX,
          move.arrow.toY,
          scaleX,
          scaleY
        );
      }
    });

    // 홀드 마커 그리기
    betaData.moves.forEach((move) => {
      drawHoldMarker(
        ctx,
        move.x,
        move.y,
        move.label,
        move.icon,
        move.isCrux,
        scaleX,
        scaleY
      );

      // 팁 말풍선
      if (move.shortTip) {
        drawTipBubble(ctx, move.x, move.y, move.shortTip, scaleX, scaleY);
      }
    });
  }, [betaData, imageSize, drawArrow, drawHoldMarker, drawTipBubble]);

  // 이미지 로드 및 리사이즈 처리
  useEffect(() => {
    const handleLoad = () => {
      setTimeout(drawOverlay, 0);
    };

    const image = imageRef.current;
    if (image) {
      if (image.complete) {
        handleLoad();
      } else {
        image.addEventListener('load', handleLoad);
        return () => image.removeEventListener('load', handleLoad);
      }
    }
  }, [drawOverlay]);

  // 윈도우 리사이즈 처리
  useEffect(() => {
    const handleResize = () => {
      setTimeout(drawOverlay, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawOverlay]);

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="relative inline-block max-w-full">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Boulder problem with beta"
          className="max-w-full max-h-96 rounded-lg shadow-lg"
        />
        <canvas
          ref={overlayRef}
          className="absolute top-0 left-0 pointer-events-none"
        />
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">범례</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>🚀 시작점</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>🏁 탑</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>일반 홀드</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">⚠️</span>
            <span>크럭스</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-500"></div>
            <span>무브 방향</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-black rounded text-white text-xs flex items-center justify-center">팁</div>
            <span>조언</span>
          </div>
        </div>
      </div>
    </div>
  );
};