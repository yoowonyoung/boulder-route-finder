import React, { useRef, useEffect } from 'react';
import { HoldInput } from '../types';

interface MoveSequenceProps {
  imageUrl: string;
  holds: HoldInput[];
  imageSize: { width: number; height: number };
}

interface Pose {
  leftHand?: { x: number; y: number };
  rightHand?: { x: number; y: number };
  leftFoot?: { x: number; y: number };
  rightFoot?: { x: number; y: number };
}

export const MoveSequence: React.FC<MoveSequenceProps> = ({
  imageUrl,
  holds,
  imageSize,
}) => {
  // 홀드 타입별 분리
  const startHolds = holds.filter(h => h.holdType === 'start').sort((a, b) => a.x - b.x);
  const middleHolds = holds.filter(h => h.holdType === 'middle').sort((a, b) => -a.y + b.y); // y 낮은게 먼저(아래서 위)
  const topHolds = holds.filter(h => h.holdType === 'top');
  const footHolds = holds.filter(h => h.holdType === 'foot').sort((a, b) => a.x - b.x);

  // 각 무브별 포즈 계산
  const calculatePoses = (): Pose[] => {
    const poses: Pose[] = [];
    
    // 시작 포즈
    const startPose: Pose = {};
    if (startHolds.length >= 2) {
      startPose.leftHand = { x: startHolds[0].x, y: startHolds[0].y };
      startPose.rightHand = { x: startHolds[1].x, y: startHolds[1].y };
    } else if (startHolds.length === 1) {
      startPose.leftHand = { x: startHolds[0].x, y: startHolds[0].y };
      startPose.rightHand = { x: startHolds[0].x + 30, y: startHolds[0].y };
    }
    
    if (footHolds.length >= 2) {
      startPose.leftFoot = { x: footHolds[0].x, y: footHolds[0].y };
      startPose.rightFoot = { x: footHolds[1].x, y: footHolds[1].y };
    } else if (footHolds.length === 1) {
      startPose.leftFoot = { x: footHolds[0].x - 20, y: footHolds[0].y };
      startPose.rightFoot = { x: footHolds[0].x + 20, y: footHolds[0].y };
    } else if (startHolds.length > 0) {
      // 발 홀드 없으면 시작 홀드 아래에 가상 발 위치
      const avgX = startHolds.reduce((sum, h) => sum + h.x, 0) / startHolds.length;
      const avgY = startHolds.reduce((sum, h) => sum + h.y, 0) / startHolds.length;
      startPose.leftFoot = { x: avgX - 30, y: avgY + 100 };
      startPose.rightFoot = { x: avgX + 30, y: avgY + 100 };
    }
    
    poses.push(startPose);
    
    // 경유 홀드별 포즈 (한 손씩 이동)
    let currentPose = { ...startPose };
    let isLeftHandNext = true;
    
    for (const hold of middleHolds) {
      const newPose = { ...currentPose };
      
      // 번갈아가며 손 이동
      if (isLeftHandNext) {
        newPose.leftHand = { x: hold.x, y: hold.y };
      } else {
        newPose.rightHand = { x: hold.x, y: hold.y };
      }
      
      // 발 위치도 점진적으로 올리기
      if (newPose.leftFoot && newPose.rightFoot && newPose.leftHand && newPose.rightHand) {
        const handAvgY = (newPose.leftHand.y + newPose.rightHand.y) / 2;
        const targetFootY = handAvgY + 80;
        
        if (newPose.leftFoot.y > targetFootY) {
          newPose.leftFoot = { ...newPose.leftFoot, y: targetFootY };
        }
        if (newPose.rightFoot.y > targetFootY) {
          newPose.rightFoot = { ...newPose.rightFoot, y: targetFootY };
        }
      }
      
      poses.push(newPose);
      currentPose = newPose;
      isLeftHandNext = !isLeftHandNext;
    }
    
    // 탑 포즈
    if (topHolds.length > 0) {
      const topPose = { ...currentPose };
      if (topHolds.length >= 2) {
        topPose.leftHand = { x: topHolds[0].x, y: topHolds[0].y };
        topPose.rightHand = { x: topHolds[1].x, y: topHolds[1].y };
      } else {
        topPose.leftHand = { x: topHolds[0].x - 15, y: topHolds[0].y };
        topPose.rightHand = { x: topHolds[0].x + 15, y: topHolds[0].y };
      }
      poses.push(topPose);
    }
    
    return poses;
  };

  const poses = calculatePoses();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        🏃 무브별 포즈 가이드
      </h2>
      
      <div className="flex gap-3 overflow-x-auto pb-2">
        {poses.map((pose, index) => (
          <MoveCard
            key={index}
            moveIndex={index}
            pose={pose}
            imageUrl={imageUrl}
            imageSize={imageSize}
            isStart={index === 0}
            isTop={index === poses.length - 1 && topHolds.length > 0}
          />
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        💡 좌우로 스크롤하여 각 무브 확인 • 스틱맨은 예상 자세입니다
      </div>
    </div>
  );
};

// 개별 무브 카드 컴포넌트
interface MoveCardProps {
  moveIndex: number;
  pose: Pose;
  imageUrl: string;
  imageSize: { width: number; height: number };
  isStart: boolean;
  isTop: boolean;
}

const MoveCard: React.FC<MoveCardProps> = ({
  moveIndex,
  pose,
  imageUrl,
  imageSize,
  isStart,
  isTop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardWidth = 150;
  const cardHeight = 200;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, cardWidth, cardHeight);
      
      // 스케일 계산
      const scaleX = cardWidth / imageSize.width;
      const scaleY = cardHeight / imageSize.height;
      
      // 스틱맨 그리기
      drawStickman(ctx, pose, scaleX, scaleY);
    };
  }, [imageUrl, pose, imageSize]);

  const drawStickman = (
    ctx: CanvasRenderingContext2D,
    pose: Pose,
    scaleX: number,
    scaleY: number
  ) => {
    const { leftHand, rightHand, leftFoot, rightFoot } = pose;
    
    if (!leftHand && !rightHand) return;
    
    // 몸통 중심 계산
    const hands = [leftHand, rightHand].filter(Boolean) as { x: number; y: number }[];
    const feet = [leftFoot, rightFoot].filter(Boolean) as { x: number; y: number }[];
    
    const handCenterX = hands.reduce((sum, h) => sum + h.x, 0) / hands.length;
    const handCenterY = hands.reduce((sum, h) => sum + h.y, 0) / hands.length;
    
    let footCenterX = handCenterX;
    let footCenterY = handCenterY + 60;
    
    if (feet.length > 0) {
      footCenterX = feet.reduce((sum, f) => sum + f.x, 0) / feet.length;
      footCenterY = feet.reduce((sum, f) => sum + f.y, 0) / feet.length;
    }
    
    // 몸통 중심
    const bodyX = (handCenterX + footCenterX) / 2;
    const bodyY = (handCenterY + footCenterY) / 2;
    
    // 어깨/엉덩이 위치
    const shoulderY = bodyY - 15;
    const hipY = bodyY + 15;
    
    // 머리 위치
    const headX = bodyX;
    const headY = shoulderY - 20;
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // 그림자 효과
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 2;
    
    // 머리 (원)
    ctx.beginPath();
    ctx.arc(headX * scaleX, headY * scaleY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.stroke();
    
    // 몸통 (선)
    ctx.beginPath();
    ctx.moveTo(bodyX * scaleX, shoulderY * scaleY);
    ctx.lineTo(bodyX * scaleX, hipY * scaleY);
    ctx.stroke();
    
    // 왼팔
    if (leftHand) {
      ctx.beginPath();
      ctx.moveTo(bodyX * scaleX, shoulderY * scaleY);
      ctx.lineTo(leftHand.x * scaleX, leftHand.y * scaleY);
      ctx.strokeStyle = '#ef4444';
      ctx.stroke();
      
      // 손 (작은 원)
      ctx.beginPath();
      ctx.arc(leftHand.x * scaleX, leftHand.y * scaleY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }
    
    // 오른팔
    if (rightHand) {
      ctx.beginPath();
      ctx.moveTo(bodyX * scaleX, shoulderY * scaleY);
      ctx.lineTo(rightHand.x * scaleX, rightHand.y * scaleY);
      ctx.strokeStyle = '#ef4444';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(rightHand.x * scaleX, rightHand.y * scaleY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }
    
    // 왼다리
    if (leftFoot) {
      ctx.beginPath();
      ctx.moveTo(bodyX * scaleX, hipY * scaleY);
      ctx.lineTo(leftFoot.x * scaleX, leftFoot.y * scaleY);
      ctx.strokeStyle = '#3b82f6';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(leftFoot.x * scaleX, leftFoot.y * scaleY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    }
    
    // 오른다리
    if (rightFoot) {
      ctx.beginPath();
      ctx.moveTo(bodyX * scaleX, hipY * scaleY);
      ctx.lineTo(rightFoot.x * scaleX, rightFoot.y * scaleY);
      ctx.strokeStyle = '#3b82f6';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(rightFoot.x * scaleX, rightFoot.y * scaleY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    }
  };

  return (
    <div className="flex-shrink-0">
      <div className={`
        rounded-lg overflow-hidden border-2
        ${isStart ? 'border-green-400' : isTop ? 'border-red-400' : 'border-gray-300'}
      `}>
        <canvas
          ref={canvasRef}
          width={cardWidth}
          height={cardHeight}
          className="block"
        />
      </div>
      <div className={`
        text-center text-xs font-medium mt-1 px-2 py-1 rounded
        ${isStart ? 'bg-green-100 text-green-700' : 
          isTop ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
      `}>
        {isStart ? '🚀 시작' : isTop ? '🏁 탑' : `무브 ${moveIndex}`}
      </div>
    </div>
  );
};
