import { BetaRequest, BetaResponse } from '../types';

const API_BASE_URL = '/api';

export class ApiService {
  static async analyzeBeta(request: BetaRequest): Promise<BetaResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/beta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as BetaResponse;
    } catch (error) {
      console.error('API call failed:', error);
      throw new Error('베타 분석에 실패했습니다. 다시 시도해주세요.');
    }
  }
}