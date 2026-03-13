'use client';

import React, { useEffect, useRef, useState } from 'react';
import type * as pdfjsLib from 'pdfjs-dist';
import { CheckCircle } from 'lucide-react';

interface PdfThumbnailProps {
    pdf: pdfjsLib.PDFDocumentProxy;
    pageNumber: number;
    isSelected: boolean;
    onToggle: (pageNumber: number) => void;
}

export default function PdfThumbnail({ pdf, pageNumber, isSelected, onToggle }: PdfThumbnailProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isRendered, setIsRendered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy rendering
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' } // Render slightly before scrolling into view
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible || isRendered || !pdf || !canvasRef.current) return;

        let renderTask: pdfjsLib.RenderTask | null = null;
        let isMounted = true;

        const renderPage = async () => {
            try {
                const page = await pdf.getPage(pageNumber);

                // Setup canvas
                const viewport = page.getViewport({ scale: 1.0 }); // Get original size

                // Target a consistent width for thumbnails, e.g., 200px
                const targetWidth = 200;
                const scale = targetWidth / viewport.width;
                const scaledViewport = page.getViewport({ scale });

                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext('2d');
                if (!context) return;

                canvas.width = scaledViewport.width;
                canvas.height = scaledViewport.height;

                const renderContext = {
                    canvasContext: context,
                    canvas: canvas,
                    viewport: scaledViewport,
                };

                renderTask = page.render(renderContext);
                await renderTask.promise;

                if (isMounted) {
                    setIsRendered(true);
                }
            } catch (error) {
                if ((error as any).name === 'RenderingCancelledException') {
                    // Expected when unmounting
                } else {
                    console.error(`Error rendering page ${pageNumber}:`, error);
                }
            }
        };

        renderPage();

        return () => {
            isMounted = false;
            if (renderTask) {
                renderTask.cancel();
            }
        };
    }, [isVisible, isRendered, pdf, pageNumber]);

    return (
        <div
            ref={containerRef}
            role="button"
            tabIndex={0}
            onClick={() => onToggle(pageNumber)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onToggle(pageNumber);
                }
            }}
            className={`relative group flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden ${isSelected
                    ? 'border-indigo-600 bg-indigo-50 shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
                }`}
            style={{ minHeight: '280px', minWidth: '200px' }}
        >
            <div className={`relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 ${isSelected ? 'opacity-90' : ''}`}>
                {!isRendered && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    className={`shadow-sm rounded max-w-full object-contain transition-opacity duration-300 ${isRendered ? 'opacity-100' : 'opacity-0'
                        }`}
                />

                {isSelected && (
                    <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-[1px] flex items-center justify-center transition-all duration-300">
                        <CheckCircle className="text-indigo-600 bg-white rounded-full scale-110 shadow-lg" size={36} />
                    </div>
                )}
            </div>

            <div className={`mt-2 font-medium text-sm px-3 py-1 rounded-full transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                }`}>
                Page {pageNumber}
            </div>
        </div>
    );
}
