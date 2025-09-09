
import React, { useState, useCallback } from 'react';
import { estimateCost } from '../services/geminiService';
import { ComparativeCostItem } from '../types';
import FileUploader from './FileUploader';
import CostBreakdown from './CostBreakdown';
import ErrorAlert from './ErrorAlert';

const CostEstimatorPage: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [costEstimate, setCostEstimate] = useState<ComparativeCostItem[] | null>(null);
  const [isEstimatingCost, setIsEstimatingCost] = useState<boolean>(false);
  const [costError, setCostError] = useState<string | null>(null);

  const handleImageSelect = useCallback((file: File) => {
    setImage(file);
    setCostEstimate(null);
    setCostError(null);
    const reader = new FileReader();
    reader.onloadend = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleEstimateCostClick = useCallback(async () => {
    if (!image || !imageUrl) {
      setCostError("Please upload an image to analyze.");
      return;
    }
    setIsEstimatingCost(true);
    setCostError(null);
    setCostEstimate(null);

    try {
      const parts = imageUrl.split(',');
      if (parts.length !== 2) {
        throw new Error("Invalid image data URL.");
      }
      const mimeType = image.type;
      const base64Data = parts[1];

      const result = await estimateCost(base64Data, mimeType);
      setCostEstimate(result);
    } catch (err) {
      setCostError(err instanceof Error ? err.message : "An unexpected error occurred during cost estimation.");
    } finally {
      setIsEstimatingCost(false);
    }
  }, [image, imageUrl]);

  return (
    <>
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="space-y-4 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800">AI-Powered Cost Estimator</h2>
          <p className="text-gray-600">Upload a photo of an interior design, and our AI will provide an itemized cost breakdown based on the Australian market.</p>
        </div>
        <div className="mt-8 max-w-xl mx-auto">
          <FileUploader
            onFileSelect={handleImageSelect}
            previewUrl={imageUrl}
            id="cost-estimator-upload"
            title="Upload Design Image"
            description="PNG, JPG, WEBP up to 10MB"
          />
        </div>
        
        <div className="text-center mt-8">
            <button
              type="button"
              onClick={handleEstimateCostClick}
              disabled={!image || isEstimatingCost}
              className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isEstimatingCost ? 'Estimating...' : 'Estimate Project Cost'}
            </button>
        </div>
      </div>
      
      <div className="mt-10">
        <CostBreakdown
          estimate={costEstimate}
          isLoading={isEstimatingCost}
          error={costError}
          imageUrl={imageUrl}
        />
      </div>
    </>
  );
};

export default CostEstimatorPage;
