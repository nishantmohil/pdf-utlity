'use client';

import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText } from 'lucide-react';

interface PdfUploaderProps {
    onFileUpload: (file: File) => void;
}

export default function PdfUploader({ onFileUpload }: PdfUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                onFileUpload(file);
            } else {
                alert('Please upload a valid PDF file.');
            }
        }
    }, [onFileUpload]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            if (files[0].type === 'application/pdf') {
                onFileUpload(files[0]);
            } else {
                alert('Please upload a valid PDF file.');
            }
        }
    };

    return (
        <div
            className={`relative w-full max-w-2xl mx-auto rounded-3xl p-12 mt-10 transition-all duration-300 ease-in-out border-4 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden ${isDragging
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-400 bg-white/50 hover:bg-white/80'
                } backdrop-blur-md shadow-xl`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept="application/pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleChange}
            />

            <div className="bg-indigo-100/50 p-6 rounded-full mb-6 relative">
                <div className="absolute inset-0 animate-ping bg-indigo-100 rounded-full opacity-75"></div>
                <UploadCloud className="w-16 h-16 text-indigo-600 relative z-10" />
            </div>

            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent mb-3 text-center">
                Upload your PDF Master File
            </h3>

            <p className="text-slate-500 text-center max-w-md mb-8">
                Drag and drop your huge PDF file here, or click to browse. We process files completely locally for maximum privacy and speed!
            </p>

            <div className="flex items-center space-x-2 text-sm text-indigo-600 font-medium bg-indigo-50 px-4 py-2 rounded-full">
                <FileText size={16} />
                <span>Supports 200+ Pages PDF</span>
            </div>
        </div>
    );
}
