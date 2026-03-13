'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Search,
  FolderOpen,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ScanLine,
  Loader2,
  Eye,
  Calendar,
} from 'lucide-react';

interface Student {
  admissionNumber: string;
  documentCount: number;
  lastUpdated: number;
}

interface ScannedImage {
  filename: string;
  url: string;
  documentType: string;
  uploadedAt: number;
}

export default function ViewerPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Detail view
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [images, setImages] = useState<ScannedImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/scanner/students');
        const data = await res.json();
        setStudents(data.students || []);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Fetch images for selected student
  const openStudent = useCallback(async (admissionNumber: string) => {
    setSelectedStudent(admissionNumber);
    setIsLoadingImages(true);
    try {
      const res = await fetch(
        `/api/scanner/images/${encodeURIComponent(admissionNumber)}`
      );
      const data = await res.json();
      setImages(data.images || []);
    } catch (err) {
      console.error('Failed to load images:', err);
    } finally {
      setIsLoadingImages(false);
    }
  }, []);

  const goBack = () => {
    setSelectedStudent(null);
    setImages([]);
  };

  // Lightbox navigation
  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
  };
  const nextImage = () => {
    if (lightboxIndex !== null && lightboxIndex < images.length - 1) setLightboxIndex(lightboxIndex + 1);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const filteredStudents = students.filter((s) =>
    s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (ts: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // ─── Lightbox Overlay ─────────────────────────────────────
  const renderLightbox = () => {
    if (lightboxIndex === null || !images[lightboxIndex]) return null;
    const img = images[lightboxIndex];

    return (
      <div
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
        onClick={closeLightbox}
      >
        {/* Close button */}
        <button
          onClick={closeLightbox}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Image counter */}
        <div className="absolute top-4 left-4 text-white/60 text-sm font-medium bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
          {lightboxIndex + 1} / {images.length}
        </div>

        {/* Prev button */}
        {lightboxIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next button */}
        {lightboxIndex < images.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Image */}
        <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
          <img
            src={img.url}
            alt={img.documentType}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
          <p className="mt-3 text-white/70 text-sm font-medium">
            {img.documentType || 'Document'}
          </p>
        </div>
      </div>
    );
  };

  // ─── Student Detail View ────────────────────────────────────
  if (selectedStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col">
        {renderLightbox()}

        {/* Header */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <button
              onClick={goBack}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-emerald-400 font-bold text-sm tracking-wider uppercase">
                Admission #{selectedStudent}
              </p>
              <p className="text-white/40 text-xs">
                {images.length} document{images.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="w-9" />
          </div>
        </header>

        {/* Gallery */}
        <main className="flex-1 max-w-5xl mx-auto w-full p-4">
          {isLoadingImages ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-white/40 text-sm">Loading documents...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-20">
              <ImageIcon className="w-12 h-12 text-white/15 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No documents found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div
                  key={img.filename}
                  onClick={() => openLightbox(index)}
                  className="group cursor-pointer rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-black/30 relative">
                    <img
                      src={img.url}
                      alt={img.documentType}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-white/80 text-xs font-medium truncate">
                      {img.documentType || 'Document'}
                    </p>
                    <p className="text-white/30 text-[10px] mt-0.5">
                      {img.uploadedAt ? formatDate(img.uploadedAt) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ─── Student List View ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-xl">
                <FolderOpen className="text-emerald-400 w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Document Viewer</h1>
                <p className="text-emerald-300/50 text-xs">
                  {students.length} student{students.length !== 1 ? 's' : ''} with documents
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by admission number..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-white placeholder:text-white/25 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 outline-none transition-all text-sm"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-white/40 text-sm">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-12 h-12 text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">
              {searchQuery ? 'No students match your search' : 'No scanned documents yet'}
            </p>
            <p className="text-white/20 text-xs mt-1">
              {!searchQuery && 'Go to the Scanner to start capturing documents'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <button
                key={student.admissionNumber}
                onClick={() => openStudent(student.admissionNumber)}
                className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-white/8 transition-all duration-200 group flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-500/15 group-hover:bg-emerald-500/25 transition-colors flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {student.admissionNumber}
                    </p>
                    <div className="flex items-center space-x-3 mt-0.5">
                      <span className="text-white/40 text-xs flex items-center space-x-1">
                        <ImageIcon className="w-3 h-3" />
                        <span>{student.documentCount} doc{student.documentCount !== 1 ? 's' : ''}</span>
                      </span>
                      {student.lastUpdated > 0 && (
                        <span className="text-white/30 text-xs flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(student.lastUpdated)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Footer nav */}
      <footer className="sticky bottom-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-center space-x-6">
          <a
            href="/"
            className="text-white/40 hover:text-white text-xs font-medium transition-colors"
          >
            Worksheet Generator
          </a>
          <span className="text-white/15">|</span>
          <a
            href="/scanner"
            className="text-white/40 hover:text-emerald-400 text-xs font-medium transition-colors flex items-center space-x-1"
          >
            <ScanLine className="w-3 h-3" />
            <span>Scanner</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
