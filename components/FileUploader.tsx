import React from 'react';

const FileUploader: React.FC<{
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
  id: string;
  title: string;
  description: string;
  className?: string;
}> = ({ onFileSelect, previewUrl, id, title, description, className = 'h-64' }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <label htmlFor={id} className="relative cursor-pointer bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors duration-200 flex flex-col justify-center items-center h-full p-4 text-center">
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />
        ) : (
          <div className="flex flex-col items-center">
            <svg className="w-12 h-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="mt-2 block text-sm font-medium text-gray-600">{title}</span>
            <span className="text-xs text-gray-500">{description}</span>
          </div>
        )}
        <input id={id} name={id} type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default FileUploader;
