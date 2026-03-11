'use client';

import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import PdfUploader from './components/PdfUploader';
import PdfGrid from './components/PdfGrid';
import { generateFilteredPdf } from './utils/pdfUtils';
import { Loader2, Download, ArrowLeft, BookOpen, Hash, FileCheck, Search } from 'lucide-react';

// Setup pdfjs worker directly using unpkg (reliable for client-side rendering)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  const [topicName, setTopicName] = useState('');
  const [worksheetNumber, setWorksheetNumber] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileUpload = async (uploadedFile: File) => {
    setIsProcessing(true);
    setFile(uploadedFile);
    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setSelectedPages(new Set());
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Failed to read the PDF file. Please try another one.");
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePage = (pageNumber: number) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!file || selectedPages.size === 0) return;
    setIsGenerating(true);
    try {
      const freshBuffer = await file.arrayBuffer();
      await generateFilteredPdf(freshBuffer, selectedPages, topicName, worksheetNumber);
      setSelectedPages(new Set());
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPdfDoc(null);
    setNumPages(0);
    setSelectedPages(new Set());
    setTopicName('');
    setWorksheetNumber('');
  };

  const selectAll = () => {
    const all = new Set(Array.from({ length: numPages }, (_, i) => i + 1));
    setSelectedPages(all);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  if (!file) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50 flex flex-col items-center justify-center p-6">
        <div className="max-w-3xl w-full text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 mb-4">
            <BookOpen className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Worksheet <span className="text-indigo-600">Generator</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Extract specific pages from massive PDFs to create customized, focused topic worksheets in seconds.
          </p>
        </div>

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-12">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-slate-600 font-medium animate-pulse">Processing huge PDF, please wait...</p>
          </div>
        ) : (
          <PdfUploader onFileUpload={handleFileUpload} />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-white overflow-hidden">
      {/* Sidebar relative to the screen */}
      <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-xl z-10 transition-all">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen className="text-white w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Generator</h2>
          </div>
          <button
            onClick={handleReset}
            className="text-slate-400 hover:text-red-500 transition-colors bg-white p-2 rounded-full shadow-sm hover:shadow"
            title="Start Over"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">File Info</h3>
            <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <FileCheck className="text-indigo-600 w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{numPages} pages total</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 rounded-full" />

          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Output Settings</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span>Topic Name</span>
              </label>
              <input
                type="text"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g. Algebra_Equations"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 justify-center focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                <Hash className="w-4 h-4 text-slate-400" />
                <span>Worksheet Number</span>
              </label>
              <input
                type="text"
                value={worksheetNumber}
                onChange={(e) => setWorksheetNumber(e.target.value)}
                placeholder="e.g. 01"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 font-medium">Selected Pages</span>
            <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2.5 rounded-full font-bold">
              {selectedPages.size} / {numPages}
            </span>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={selectAll}
              className="flex-1 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="flex-1 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>

          <button
            onClick={handleGenerate}
            disabled={selectedPages.size === 0 || isGenerating}
            className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 font-semibold text-white transition-all shadow-lg
              ${selectedPages.size === 0 || isGenerating
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300 transform hover:-translate-y-0.5'
              }
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Export {selectedPages.size > 0 ? selectedPages.size : ''} Pages</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 relative">
        <PdfGrid
          pdf={pdfDoc}
          numPages={numPages}
          selectedPages={selectedPages}
          onTogglePage={handleTogglePage}
        />
      </main>
    </div>
  );
}
