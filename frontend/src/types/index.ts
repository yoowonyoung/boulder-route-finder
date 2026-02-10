// 홀드 타입
export type HoldType = 'start' | 'middle' | 'top' | 'foot';

// 홀드 위치 정보
export interface HoldInput {
  x: number;
  y: number;
  order: number;
  holdType: HoldType;
}

// 무브 방향 정보
export interface Arrow {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  direction: string;
}

// 베타 분석 결과의 각 무브
export interface Move {
  holdIndex: number;
  x: number;
  y: number;
  label: string;
  icon?: string;
  arrow?: Arrow;
  shortTip?: string | null;
  detailTip?: string | null;
  isCrux: boolean;
}

// 베타 요약 정보
export interface BetaSummary {
  difficulty: string;
  keyPoints: string[];
  totalMoves: number;
}

// API 응답 타입
export interface BetaResponse {
  moves: Move[];
  summary: BetaSummary;
}

// API 요청 타입
export interface BetaRequest {
  holds: HoldInput[];
  imageWidth: number;
  imageHeight: number;
}

// 앱 상태 관리용 타입
export interface AppState {
  selectedImage: File | null;
  imageUrl: string | null;
  imageSize: { width: number; height: number } | null;
  holds: HoldInput[];
  betaData: BetaResponse | null;
  isLoading: boolean;
  error: string | null;
}