'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Camera,
  Upload,
  ArrowLeft,
  CheckCircle,
  Plus,
  Trash2,
  FileText,
  Loader2,
  ScanLine,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';

interface ScannedImage {
  filename: string;
  url: string;
  documentType: string;
  uploadedAt: number;
}

const DOCUMENT_TYPES = [
  'TC',
  'Aadhaar Card',
  'Date of Birth Certificate',
  'Admission Form',
  'Transfer Certificate',
  'Report Card',
  'Address Proof',
  'Photo',
  'Other',
];

export default function ScannerPage() {
  // Step tracking
  const [step, setStep] = useState<'admission' | 'capture'>('admission');

  // Form state
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);

  // Capture state
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Gallery state
  const [existingImages, setExistingImages] = useState<ScannedImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing images for admission number
  const fetchImages = useCallback(async (admNum: string) => {
    if (!admNum) return;
    setIsLoadingImages(true);
    try {
      const res = await fetch(
        `/api/scanner/images/${encodeURIComponent(admNum)}`
      );
      const data = await res.json();
      setExistingImages(data.images || []);
    } catch (err) {
      console.error('Failed to load images:', err);
    } finally {
      setIsLoadingImages(false);
    }
  }, []);

  // Handle admission number submit
  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionNumber.trim()) return;
    setStep('capture');
    fetchImages(admissionNumber.trim());
  };

  // Handle image capture
  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturedImage(file);
    setUploadSuccess(false);
    setError(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Upload captured image
  const handleUpload = async () => {
    if (!capturedImage || !admissionNumber) return;

    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('image', capturedImage);
      formData.append('admissionNumber', admissionNumber.trim());
      formData.append('documentType', documentType);

      const res = await fetch('/api/scanner/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      setUploadSuccess(true);
      setCapturedImage(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);

      // Refresh gallery
      fetchImages(admissionNumber.trim());

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Clear success message after 3s
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Open camera
  const triggerCamera = () => {
    setUploadSuccess(false);
    setError(null);
    fileInputRef.current?.click();
  };

  // Discard captured image
  const discardCapture = () => {
    setCapturedImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Go back to admission step
  const handleBack = () => {
    setStep('admission');
    setCapturedImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setExistingImages([]);
    setUploadSuccess(false);
    setError(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ─── Step 1: Admission Number Entry ────────────────────────────
  if (step === 'admission') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center p-4 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-2xl shadow-lg shadow-emerald-500/10 mb-2">
              <ScanLine className="text-emerald-400 w-10 h-10" />
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              Document <span className="text-emerald-400">Scanner</span>
            </h1>
            <p className="text-emerald-200/60 text-sm">
              Capture and store student documents by admission number
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAdmissionSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-emerald-300/80 uppercase tracking-wider">
                Admission Number
              </label>
              <input
                type="text"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                placeholder="Enter student admission number"
                autoFocus
                className="w-full px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-lg font-medium placeholder:text-white/30 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={!admissionNumber.trim()}
              className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 font-semibold text-lg transition-all duration-300 shadow-xl
                ${
                  admissionNumber.trim()
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30 hover:shadow-emerald-400/40 transform hover:-translate-y-0.5'
                    : 'bg-white/10 text-white/30 cursor-not-allowed shadow-none'
                }
              `}
            >
              <Camera className="w-6 h-6" />
              <span>Start Scanning</span>
            </button>
          </form>

          {/* Navigation links */}
          <div className="flex items-center justify-center space-x-4">
            <a
              href="/"
              className="text-emerald-400/60 hover:text-emerald-400 text-sm transition-colors inline-flex items-center space-x-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Worksheet Generator</span>
            </a>
            <span className="text-emerald-400/20">|</span>
            <a
              href="/scanner/view"
              className="text-emerald-400/60 hover:text-emerald-400 text-sm transition-colors"
            >
              📂 View Documents
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 2: Document Capture & Gallery ────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-emerald-400 font-bold text-sm tracking-wider uppercase">
              Admission #{admissionNumber}
            </p>
            <p className="text-white/40 text-xs">
              {existingImages.length} document{existingImages.length !== 1 ? 's' : ''} scanned
            </p>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageCapture}
        className="hidden"
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 space-y-5">
        {/* Document Type Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-emerald-300/60 uppercase tracking-wider">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition-all appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2334d399' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 16px center',
            }}
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type} className="bg-slate-800 text-white">
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Capture Area */}
        {!capturedImage ? (
          <button
            onClick={triggerCamera}
            className="w-full py-16 rounded-2xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all duration-300 flex flex-col items-center justify-center space-y-3 group"
          >
            <div className="p-4 rounded-2xl bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <Camera className="w-10 h-10 text-emerald-400" />
            </div>
            <span className="text-emerald-300/80 font-semibold text-lg">
              Tap to Capture Document
            </span>
            <span className="text-emerald-300/40 text-sm">
              Use your camera to scan a document
            </span>
          </button>
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Captured document"
                  className="w-full max-h-[50vh] object-contain bg-black/50"
                />
              )}
              <div className="absolute top-3 right-3">
                <button
                  onClick={discardCapture}
                  className="p-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 font-semibold text-lg transition-all duration-300 shadow-xl
                ${
                  isUploading
                    ? 'bg-white/10 text-white/50 cursor-not-allowed shadow-none'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30 hover:shadow-emerald-400/40 transform hover:-translate-y-0.5'
                }
              `}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Success Message */}
        {uploadSuccess && (
          <div className="flex items-center space-x-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl px-4 py-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Document uploaded successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl px-4 py-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">{error}</span>
          </div>
        )}

        {/* Capture Another Button (when no image is being previewed) */}
        {!capturedImage && existingImages.length > 0 && (
          <button
            onClick={triggerCamera}
            className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium flex items-center justify-center space-x-2 transition-all"
          >
            <Plus className="w-5 h-5 text-emerald-400" />
            <span>Capture Another Document</span>
          </button>
        )}

        {/* Gallery */}
        <div className="space-y-3 pb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-emerald-300/60 uppercase tracking-wider flex items-center space-x-2">
              <ImageIcon className="w-4 h-4" />
              <span>Scanned Documents</span>
            </h3>
            {isLoadingImages && (
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            )}
          </div>

          {existingImages.length === 0 && !isLoadingImages ? (
            <div className="text-center py-12 rounded-xl bg-white/5 border border-white/10">
              <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No documents scanned yet</p>
              <p className="text-white/20 text-xs mt-1">
                Tap the capture button above to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {existingImages.map((img) => (
                <div
                  key={img.filename}
                  className="rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-black/30">
                    <img
                      src={img.url}
                      alt={img.documentType}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="text-white/80 text-xs font-medium truncate">
                      {img.documentType || 'Document'}
                    </p>
                    <p className="text-white/30 text-[10px] mt-0.5">
                      {img.uploadedAt
                        ? new Date(img.uploadedAt).toLocaleString()
                        : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
