'use client';

import React from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import PdfThumbnail from './PdfThumbnail';

interface PdfGridProps {
    pdf: pdfjsLib.PDFDocumentProxy | null;
    numPages: number;
    selectedPages: Set<number>;
    onTogglePage: (pageNumber: number) => void;
}

export default function PdfGrid({ pdf, numPages, selectedPages, onTogglePage }: PdfGridProps) {
    if (!pdf || numPages === 0) return null;

    // Create array from 1 to numPages
    const pages = Array.from({ length: numPages }, (_, i) => i + 1);

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar p-6 bg-slate-50 border-l border-slate-200">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-semibold text-slate-800 mb-6">Select Pages</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {pages.map((pageNumber) => (
                        <PdfThumbnail
                            key={pageNumber}
                            pdf={pdf}
                            pageNumber={pageNumber}
                            isSelected={selectedPages.has(pageNumber)}
                            onToggle={onTogglePage}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
