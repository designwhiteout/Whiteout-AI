
import React, { useMemo, useState, useEffect } from 'react';
import { ComparativeCostItem, CostOption } from '../types';
import ErrorAlert from './ErrorAlert';

// Add declarations for CDN libraries to satisfy TypeScript
declare const html2canvas: any;
declare const jspdf: any;

const OptionCard: React.FC<{
  option: CostOption;
  isPremium: boolean;
  isSelected: boolean;
  onClick: () => void;
}> = ({ option, isPremium, isSelected, onClick }) => {
    const baseBorder = "border-4";
    const selectedBorder = isPremium ? "border-indigo-500" : "border-blue-500";
    const unselectedBorder = "border-transparent";

    const headerColor = isPremium ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-800";
    const selectedRing = isPremium ? "ring-2 ring-offset-2 ring-indigo-500" : "ring-2 ring-offset-2 ring-blue-500";
    
    return (
        <div
            onClick={onClick}
            className={`p-1 h-full flex flex-col cursor-pointer rounded-xl transition-all duration-200 ${isSelected ? selectedRing : ''}`}
        >
          <div className="h-full flex flex-col bg-gray-50 rounded-lg shadow-sm hover:shadow-md">
              <h4 className={`text-base font-bold p-3 rounded-t-lg ${headerColor} flex justify-between items-center`}>
                <span>{option.optionName}</span>
                {isSelected && (
                    <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </span>
                )}
              </h4>
              <div className="border border-t-0 rounded-b-lg p-4 bg-white flex-grow flex flex-col justify-between">
                  <div>
                      <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                      <p className="text-xs text-gray-500">
                          <span className="font-semibold">Suggested Supplier:</span> {option.suggestedSupplier}
                      </p>
                  </div>
                  <p className="text-xl font-semibold text-gray-900 text-right mt-4 font-mono">
                      ${option.estimatedCostAUD.toLocaleString('en-AU')}
                  </p>
              </div>
          </div>
        </div>
    );
};

const CostBreakdown: React.FC<{
  estimate: ComparativeCostItem[] | null;
  isLoading: boolean;
  error: string | null;
  imageUrl: string | null;
}> = ({ estimate, isLoading, error, imageUrl }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  useEffect(() => {
    if (estimate) {
      const initialSelections = estimate.reduce((acc, _, index) => {
        acc[index] = 0; // Default to standard option (index 0)
        return acc;
      }, {} as Record<number, number>);
      setSelections(initialSelections);
    }
  }, [estimate]);

  const handleSelectOption = (itemIndex: number, optionIndex: number) => {
    setSelections(prev => ({ ...prev, [itemIndex]: optionIndex }));
  };

  const totalCost = useMemo(() => {
    if (!estimate || Object.keys(selections).length === 0) return 0;
    return estimate.reduce((total, item, index) => {
      const selectedOptionIndex = selections[index] ?? 0;
      return total + (item.options[selectedOptionIndex]?.estimatedCostAUD || 0);
    }, 0);
  }, [estimate, selections]);

  const handleExportPDF = async () => {
    if (!estimate || !imageUrl || !document.getElementById('image-container-for-pdf')) {
      alert("Cannot export PDF. Missing data or elements.");
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Allow React to re-render with all highlights visible before capturing
      await new Promise(resolve => setTimeout(resolve, 100));
  
      const imageContainer = document.getElementById('image-container-for-pdf')!;
      const canvas = await html2canvas(imageContainer, { useCORS: true, scale: 2, allowTaint: true });
      const imgData = canvas.toDataURL('image/png');
  
      const { jsPDF } = jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Page 1: Image
      pdf.setFontSize(22);
      pdf.text("Design Cost Estimate", pdfWidth / 2, 20, { align: 'center' });
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * (pdfWidth - 20)) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 10, 30, pdfWidth - 20, imgHeight);

      // Page 2+: Cost Breakdown
      pdf.addPage();
      pdf.setFontSize(18);
      pdf.text("Itemized Breakdown", 15, 20);
      
      let y = 35;
      const checkPageBreak = (spaceNeeded: number) => {
        if (y + spaceNeeded > pdfHeight - 15) {
          pdf.addPage();
          y = 20;
        }
      };

      for (const [index, item] of estimate.entries()) {
        const selectedOption = item.options[selections[index]];
        
        checkPageBreak(30);
        pdf.setLineWidth(0.5);
        pdf.line(15, y - 5, pdfWidth - 15, y - 5);
        
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text(item.item, 15, y);

        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        pdf.text(`$${selectedOption.estimatedCostAUD.toLocaleString('en-AU')}`, pdfWidth - 15, y, { align: 'right' });

        y += 7;
        pdf.setFont(undefined, 'bold');
        pdf.text(selectedOption.optionName, 15, y);

        y += 6;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'italic');
        pdf.setTextColor(100);
        const descLines = pdf.splitTextToSize(selectedOption.description, pdfWidth - 30);
        pdf.text(descLines, 15, y);
        y += descLines.length * 4;
        
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(0);
        pdf.text(`Supplier: ${selectedOption.suggestedSupplier}`, 15, y + 2);
        y += 10;
      }
      
      // Final Total
      checkPageBreak(25);
      pdf.setLineWidth(1);
      pdf.line(15, y, pdfWidth - 15, y);
      y += 10;
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text("Total Estimated Cost:", 15, y);
      pdf.text(`$${totalCost.toLocaleString('en-AU')}`, pdfWidth - 15, y, { align: 'right' });

      pdf.save('WhiteoutAI_Cost_Estimate.pdf');

    } catch(err) {
      console.error("PDF Export failed:", err);
      alert("Sorry, there was an error creating the PDF.");
    } finally {
      setIsExporting(false);
    }
  };


  if (!isLoading && !error && !estimate) {
    return null;
  }

  return (
    <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Interactive Cost Comparison</h2>
      <p className="text-sm text-center text-gray-500 mb-6">Select your preferred options below. Hover over an item to highlight it in the image.</p>
      
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 text-lg">Analyzing design and preparing your comparison...</p>
        </div>
      )}

      {error && !isLoading && <div className="max-w-2xl mx-auto"><ErrorAlert message={error} /></div>}

      {estimate && imageUrl && !isLoading && (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
             <div className="sticky top-24">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center lg:text-left">Your Design</h3>
                <div id="image-container-for-pdf" className="relative w-full rounded-lg shadow-md overflow-hidden bg-gray-100">
                  <img src={imageUrl} alt="Design for cost estimation" className="w-full h-auto object-contain" />
                  {estimate.map((item, index) => {
                     const [yMin, xMin, yMax, xMax] = item.boundingBox;
                     const isVisible = isExporting || index === hoveredIndex;
                     return (
                        <div
                           key={index}
                           className={`absolute transition-all duration-200 border-2 rounded-sm ${isVisible ? 'bg-blue-500 bg-opacity-30 border-blue-500' : 'bg-transparent border-transparent'}`}
                           style={{
                              top: `${yMin * 100}%`,
                              left: `${xMin * 100}%`,
                              height: `${(yMax - yMin) * 100}%`,
                              width: `${(xMax - xMin) * 100}%`,
                           }}
                        >
                          <span className={`absolute -top-6 left-0 text-xs font-bold text-white px-2 py-0.5 rounded-full transition-opacity duration-200 ${isVisible ? 'opacity-100 bg-blue-500' : 'opacity-0'}`}>
                            {item.item}
                          </span>
                        </div>
                     );
                  })}
                </div>
             </div>

             <div className="space-y-6">
                {estimate.map((item, index) => (
                  <div 
                    key={index} 
                    className="border border-gray-200 rounded-lg shadow-sm"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <h3 className="px-6 py-4 bg-gray-50 text-lg font-bold text-gray-800">{item.item}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 p-2 gap-2">
                      <OptionCard option={item.options[0]} isPremium={false} isSelected={selections[index] === 0} onClick={() => handleSelectOption(index, 0)} />
                      <OptionCard option={item.options[1]} isPremium={true} isSelected={selections[index] === 1} onClick={() => handleSelectOption(index, 1)} />
                    </div>
                  </div>
                ))}
              </div>
          </div>
          
          <div className="mt-12 pt-8 border-t-2 border-dashed">
             <div className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="text-center sm:text-left">
                    <h3 className="text-xl font-bold text-gray-800">Total Estimated Cost</h3>
                    <p className="text-sm text-gray-500">Based on your current selections</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg shadow-inner w-full sm:w-auto">
                    <p className="text-3xl font-bold text-gray-900 text-center font-mono">${totalCost.toLocaleString('en-AU')}</p>
                </div>
             </div>
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-3 ${isExporting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 {isExporting 
                   ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" />
                   : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                 }
              </svg>
              {isExporting ? 'Exporting PDF...' : 'Export as PDF'}
            </button>
          </div>

          <p className="mt-8 text-xs text-center text-gray-500">
            Disclaimer: These are AI-generated estimates for budgeting purposes only and may not reflect actual market prices.
          </p>
        </div>
      )}
    </div>
  );
};

export default CostBreakdown;