import { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { MarkingCanvas } from './components/MarkingCanvas';
import { BetaOverlay } from './components/BetaOverlay';
import { BetaSummary } from './components/BetaSummary';
import { MoveSequence } from './components/MoveSequence';
import { ApiService } from './services/api';
import { AppState, HoldInput } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>({
    selectedImage: null,
    imageUrl: null,
    imageSize: null,
    holds: [],
    betaData: null,
    isLoading: false,
    error: null,
  });

  // 이미지 선택 처리
  const handleImageSelect = useCallback((file: File | null, imageUrl: string | null) => {
    if (file === null || imageUrl === null) {
      // 이미지 제거
      setAppState(prev => ({
        ...prev,
        selectedImage: null,
        imageUrl: null,
        imageSize: null,
        holds: [],
        betaData: null,
        error: null,
      }));
      return;
    }

    setAppState(prev => ({
      ...prev,
      selectedImage: file,
      imageUrl,
      holds: [],
      betaData: null,
      error: null,
    }));
  }, []);

  // 이미지 로드 처리
  const handleImageLoad = useCallback((width: number, height: number) => {
    setAppState(prev => ({
      ...prev,
      imageSize: { width, height },
    }));
  }, []);

  // 홀드 변경 처리
  const handleHoldsChange = useCallback((holds: HoldInput[]) => {
    setAppState(prev => ({
      ...prev,
      holds,
      betaData: null, // 홀드가 변경되면 이전 베타 데이터 초기화
      error: null,
    }));
  }, []);

  // 베타 분석 요청
  const handleAnalyzeBeta = useCallback(async () => {
    if (!appState.imageSize || appState.holds.length === 0) {
      setAppState(prev => ({
        ...prev,
        error: '홀드를 최소 1개 이상 마킹해주세요.',
      }));
      return;
    }

    setAppState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const betaData = await ApiService.analyzeBeta({
        holds: appState.holds,
        imageWidth: appState.imageSize.width,
        imageHeight: appState.imageSize.height,
      });

      setAppState(prev => ({
        ...prev,
        betaData,
        isLoading: false,
      }));
    } catch (error) {
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '베타 분석 중 오류가 발생했습니다.',
        isLoading: false,
      }));
    }
  }, [appState.holds, appState.imageSize]);

  // 새로 시작
  const handleReset = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      holds: [],
      betaData: null,
      error: null,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🧗‍♀️ Boulder Route Finder
          </h1>
          <p className="text-gray-600 text-lg">
            볼더링 문제의 홀드를 마킹하고 AI 베타 분석을 받아보세요
          </p>
        </header>

        {/* 메인 콘텐츠 */}
        <div className="space-y-8">
          {/* 1단계: 이미지 업로드 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              1단계: 볼더링 문제 이미지 업로드
            </h2>
            <ImageUploader
              onImageSelect={handleImageSelect}
              selectedImage={appState.selectedImage}
              imageUrl={appState.imageUrl}
            />
          </section>

          {/* 2단계: 홀드 마킹 */}
          {appState.imageUrl && (
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                2단계: 홀드 마킹
              </h2>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-gray-600 mb-4">
                  이미지를 클릭하여 홀드 위치를 순서대로 마킹하세요. 
                  첫 번째 홀드는 시작점, 마지막 홀드는 탑이 됩니다.
                </p>
                
                {!appState.betaData ? (
                  <MarkingCanvas
                    imageUrl={appState.imageUrl}
                    holds={appState.holds}
                    onHoldsChange={handleHoldsChange}
                    onImageLoad={handleImageLoad}
                  />
                ) : (
                  // 베타 분석 후에는 오버레이 표시
                  <BetaOverlay
                    imageUrl={appState.imageUrl}
                    betaData={appState.betaData}
                    imageSize={appState.imageSize!}
                  />
                )}
              </div>
            </section>
          )}

          {/* 3단계: 베타 분석 */}
          {appState.imageUrl && !appState.betaData && (
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                3단계: 베타 분석
              </h2>
              <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                {appState.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-800">{appState.error}</p>
                  </div>
                )}
                
                <button
                  onClick={handleAnalyzeBeta}
                  disabled={appState.holds.length === 0 || appState.isLoading}
                  className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {appState.isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      분석 중...
                    </span>
                  ) : (
                    '🤖 AI 베타 분석 시작'
                  )}
                </button>
                
                <p className="text-sm text-gray-500 mt-2">
                  홀드 {appState.holds.length}개가 마킹되었습니다.
                </p>
              </div>
            </section>
          )}

          {/* 4단계: 결과 */}
          {appState.betaData && (
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                  4단계: 베타 분석 결과
                </h2>
                <button
                  onClick={handleReset}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  🔄 다시 마킹하기
                </button>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <BetaSummary betaData={appState.betaData} />
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    📋 무브별 상세 정보
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {appState.betaData.moves.map((move, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-3 ${
                          move.isCrux
                            ? 'border-yellow-300 bg-yellow-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {move.icon} {move.label}번 홀드
                          </span>
                          {move.isCrux && (
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                              크럭스
                            </span>
                          )}
                        </div>
                        {move.shortTip && (
                          <p className="text-sm text-gray-700 ml-6">
                            💡 {move.shortTip}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 무브별 포즈 가이드 */}
              {appState.imageUrl && appState.imageSize && (
                <div className="mt-8">
                  <MoveSequence
                    imageUrl={appState.imageUrl}
                    holds={appState.holds}
                    imageSize={appState.imageSize}
                  />
                </div>
              )}
            </section>
          )}
        </div>

        {/* 푸터 */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>
            Boulder Route Finder v1.0 | AI 기반 볼더링 베타 분석 도구
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;