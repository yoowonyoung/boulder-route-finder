import React from 'react';
import { BetaResponse } from '../types';

interface BetaSummaryProps {
  betaData: BetaResponse;
}

export const BetaSummary: React.FC<BetaSummaryProps> = ({ betaData }) => {
  const { summary, moves } = betaData;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        🧗‍♀️ 베타 분석 결과
      </h2>
      
      <div className="space-y-3">
        {/* 난이도 & 무브 수 */}
        <div className="flex gap-2">
          <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-600 mb-1">예상 난이도</div>
            <div className="font-bold text-blue-800">{summary.difficulty}</div>
          </div>
          <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-green-600 mb-1">총 무브</div>
            <div className="font-bold text-green-800">{summary.totalMoves}개</div>
          </div>
        </div>

        {/* 핵심 포인트 */}
        {summary.keyPoints.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-xs text-yellow-600 mb-2">💡 핵심 포인트</div>
            <ul className="space-y-1 text-sm">
              {summary.keyPoints.map((point, index) => (
                <li key={index} className="text-yellow-800 flex items-start gap-1">
                  <span className="text-yellow-500">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 무브별 상세 정보 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-2">📋 무브별 가이드</div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {moves.map((move, index) => (
              <div 
                key={index} 
                className={`text-sm p-2 rounded ${
                  move.isCrux 
                    ? 'bg-red-100 border border-red-200' 
                    : 'bg-white border border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* 홀드 번호/아이콘 */}
                  <span className={`
                    inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold
                    ${move.icon === '🚀' ? 'bg-green-500' : 
                      move.icon === '🏁' ? 'bg-red-500' : 'bg-blue-500'}
                  `}>
                    {move.icon || move.label}
                  </span>
                  
                  {/* 팁 */}
                  <div className="flex-1">
                    {move.shortTip && (
                      <span className={`font-medium ${move.isCrux ? 'text-red-700' : 'text-gray-700'}`}>
                        {move.shortTip}
                      </span>
                    )}
                    {move.isCrux && <span className="ml-1 text-red-500">⚠️</span>}
                  </div>
                </div>
                
                {/* 상세 팁 */}
                {move.detailTip && (
                  <div className="text-xs text-gray-500 mt-1 ml-8">
                    {move.detailTip}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 추가 정보 */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          ℹ️ AI 기반 추천이며, 실제 등반 시 개인차가 있을 수 있습니다.
        </p>
      </div>
    </div>
  );
};
