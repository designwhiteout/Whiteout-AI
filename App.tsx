import React, { useState, useCallback, useMemo } from 'react';
import { generateDesign, adjustDesign } from './services/geminiService';

import Header from './components/Header';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorAlert from './components/ErrorAlert';
import FileUploader from './components/FileUploader';
import CostEstimatorPage from './components/CostEstimatorPage';

const Results: React.FC<{ original: string | null, generated: string | null }> = ({ original, generated }) => {
  if (!original || !generated) return null;

  const handleDownload = () => {
    if (!generated) return;
    const link = document.createElement('a');
    link.href = generated;
    link.download = 'whiteout-ai-render.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full mt-10">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Your Design Transformation</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Original</h3>
          <div className="w-full h-[450px] bg-white p-2 rounded-lg shadow-md flex items-center justify-center">
            <img src={original} alt="Original design" className="max-w-full max-h-full object-contain rounded-md" />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">AI Rendered</h3>
            <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>
          <div className="w-full h-[450px] bg-white p-2 rounded-lg shadow-md flex items-center justify-center">
            <img src={generated} alt="AI generated design" className="max-w-full max-h-full object-contain rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

const DesignStudio: React.FC = () => {
  const [baseImage, setBaseImage] = useState<File | null>(null);
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [adjustmentPrompt, setAdjustmentPrompt] = useState<string>('');
  const [adjustmentImage, setAdjustmentImage] = useState<File | null>(null);
  const [adjustmentImageUrl, setAdjustmentImageUrl] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleBaseImageSelect = useCallback((file: File) => {
    setBaseImage(file);
    setGeneratedImageUrl(null);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setBaseImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleReferenceImageSelect = useCallback((file: File) => {
    setReferenceImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setReferenceImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleClearReferenceImage = useCallback(() => {
    setReferenceImage(null);
    setReferenceImageUrl(null);
  }, []);

  const handleAdjustmentImageSelect = useCallback((file: File) => {
    setAdjustmentImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setAdjustmentImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleClearAdjustmentImage = useCallback(() => {
    setAdjustmentImage(null);
    setAdjustmentImageUrl(null);
  }, []);

  const handleGenerateClick = useCallback(async () => {
    if (!baseImage || !baseImageUrl) {
      setError("Please upload a base design image first.");
      return;
    }
    setLoadingMessage('Our AI is re-imagining your space...');
    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const base64BaseData = baseImageUrl.split(',')[1];
      const base64ReferenceData = referenceImageUrl?.split(',')[1];

      const resultUrl = await generateDesign({
        base64ImageData: base64BaseData,
        mimeType: baseImage.type,
        base64ReferenceImageData: base64ReferenceData,
        referenceMimeType: referenceImage?.type,
      });
      setGeneratedImageUrl(resultUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [baseImage, baseImageUrl, referenceImage, referenceImageUrl]);

  const handleAdjustClick = useCallback(async () => {
    if (!generatedImageUrl) {
        setError("There is no generated image to adjust.");
        return;
    }
    if (!adjustmentPrompt.trim()) {
        setError("Please enter an adjustment instruction.");
        return;
    }
    setLoadingMessage('Applying your adjustments...');
    setIsLoading(true);
    setError(null);

    try {
        const parts = generatedImageUrl.split(',');
        if (parts.length !== 2) {
          throw new Error("Invalid generated image data URL.");
        }
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (!mimeMatch || !mimeMatch[1]) {
          throw new Error("Could not determine mime type from data URL.");
        }
        const mimeType = mimeMatch[1];
        const base64Data = parts[1];
        const base64AdjustmentData = adjustmentImageUrl?.split(',')[1];

        const resultUrl = await adjustDesign({
            base64ImageData: base64Data,
            mimeType: mimeType,
            adjustmentPrompt,
            base64AdjustmentImageData: base64AdjustmentData,
            adjustmentMimeType: adjustmentImage?.type,
        });

        setGeneratedImageUrl(resultUrl);
        setAdjustmentPrompt('');
        handleClearAdjustmentImage();
    } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred during adjustment.");
    } finally {
        setIsLoading(false);
    }
  }, [generatedImageUrl, adjustmentPrompt, adjustmentImage, adjustmentImageUrl, handleClearAdjustmentImage]);
  
  const isGenerateButtonDisabled = useMemo(() => isLoading || !baseImage, [isLoading, baseImage]);
  const isAdjustButtonDisabled = useMemo(() => isLoading || !adjustmentPrompt.trim() || !generatedImageUrl, [isLoading, adjustmentPrompt, generatedImageUrl]);

  return (
    <>
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">1. Upload Room Design</h3>
              <p className="text-sm text-gray-500 mt-1">Provide the base image of your room.</p>
              <div className="mt-4">
                <FileUploader onFileSelect={handleBaseImageSelect} previewUrl={baseImageUrl} id="base-image-upload" title="Upload Base Design" description="PNG, JPG, WEBP up to 10MB" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">2. Upload Style Reference (Optional)</h3>
                  {referenceImageUrl && (
                      <button onClick={handleClearReferenceImage} className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                          Clear
                      </button>
                  )}
              </div>
              <p className="text-sm text-gray-500 mt-1">Provide an image for style inspiration.</p>
              <div className="mt-4">
                <FileUploader onFileSelect={handleReferenceImageSelect} previewUrl={referenceImageUrl} id="ref-image-upload" title="Upload Reference Image" description="PNG, JPG, WEBP up to 10MB" />
              </div>
            </div>
          </div>
          
          {error && <div className="pt-4"><ErrorAlert message={error} /></div>}

          <div className="text-center pt-8">
            <button
              type="button"
              onClick={handleGenerateClick}
              disabled={isGenerateButtonDisabled}
              className="mt-4 w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading && loadingMessage.startsWith('Our AI') ? 'Generating...' : 'Render My Design'}
            </button>
          </div>
        </div>
      </div>
      
      {generatedImageUrl && (
          <div className="animate-fade-in">
              <Results original={baseImageUrl} generated={generatedImageUrl} />
              
              <div className="mt-10 bg-white p-8 rounded-xl shadow-lg">
                  <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Fine-Tune Your Design</h2>
                  <div className="space-y-6 max-w-2xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                          <div>
                              <label htmlFor="adjustment-prompt" className="block text-sm font-medium text-gray-700">
                                  Adjustment Instructions
                              </label>
                              <textarea
                                  id="adjustment-prompt"
                                  rows={5}
                                  className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm p-2"
                                  placeholder="e.g., 'Change the sofa to blue', 'Add a fiddle-leaf fig plant in the corner'"
                                  value={adjustmentPrompt}
                                  onChange={(e) => setAdjustmentPrompt(e.target.value)}
                              />
                               <p className="mt-2 text-xs text-gray-500">Describe the changes you'd like to see in the rendered image.</p>
                          </div>
                          <div>
                              <div className="flex justify-between items-center">
                                  <label className="block text-sm font-medium text-gray-700">Visual Support (Optional)</label>
                                   {adjustmentImageUrl && (
                                      <button onClick={handleClearAdjustmentImage} className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                                          Clear
                                      </button>
                                  )}
                              </div>
                              <div className="mt-1">
                                  <FileUploader 
                                      onFileSelect={handleAdjustmentImageSelect} 
                                      previewUrl={adjustmentImageUrl} 
                                      id="adj-image-upload" 
                                      title="Upload Support Image" 
                                      description="e.g., a photo of a specific chair"
                                      className="h-40"
                                  />
                              </div>
                          </div>
                      </div>
                      <div className="text-center pt-2">
                          <button
                              type="button"
                              onClick={handleAdjustClick}
                              disabled={isAdjustButtonDisabled}
                              className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                          >
                              {isLoading && loadingMessage.startsWith('Applying') ? 'Adjusting...' : 'Make Adjustment'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'design' | 'cost'>('design');

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header currentView={view} onViewChange={setView} />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {view === 'design' && <DesignStudio />}
        {view === 'cost' && <CostEstimatorPage />}
      </main>
    </div>
  );
};

export default App;