import type { ComparativeCostItem } from '../types';

interface GenerateDesignParams {
  base64ImageData: string;
  mimeType: string;
  base64ReferenceImageData?: string;
  referenceMimeType?: string;
}

interface AdjustDesignParams {
  base64ImageData: string;
  mimeType: string;
  adjustmentPrompt: string;
  base64AdjustmentImageData?: string;
  adjustmentMimeType?: string;
}

async function callApi<T>(action: string, payload: object): Promise<T> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.result as T;
  } catch (error) {
     console.error(`Error calling API for action "${action}":`, error);
     const errorMessage = error instanceof Error ? error.message : "An unknown network error occurred.";
     throw new Error(`Failed to ${action.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${errorMessage}`);
  }
}

export const generateDesign = (params: GenerateDesignParams): Promise<string> => {
  return callApi<string>('generateDesign', params);
};

export const adjustDesign = (params: AdjustDesignParams): Promise<string> => {
  return callApi<string>('adjustDesign', params);
};

export const estimateCost = (base64ImageData: string, mimeType: string): Promise<ComparativeCostItem[]> => {
  return callApi<ComparativeCostItem[]>('estimateCost', { base64ImageData, mimeType });
};
