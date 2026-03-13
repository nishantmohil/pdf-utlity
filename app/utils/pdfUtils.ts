import { PDFDocument } from 'pdf-lib';

export async function generateFilteredPdf(
    originalPdfBytes: ArrayBuffer,
    selectedPages: Set<number>, // 1-based page numbers
    topicName: string,
    worksheetNum: string
): Promise<void> {
    // Load the original document
    const originalDoc = await PDFDocument.load(originalPdfBytes);
    // Create a new empty document
    const newDoc = await PDFDocument.create();

    // Convert 1-based page numbers to 0-based indices and sort them
    const pagesToCopyIndices = Array.from(selectedPages)
        .map(pageNum => pageNum - 1)
        .sort((a, b) => a - b);

    if (pagesToCopyIndices.length === 0) {
        throw new Error("No pages selected");
    }

    // Copy the specific pages from the original document
    const copiedPages = await newDoc.copyPages(originalDoc, pagesToCopyIndices);

    // Add the copied pages into the new document
    copiedPages.forEach(page => {
        newDoc.addPage(page);
    });

    // Save the new document to bytes
    const modifiedPdfBytes = await newDoc.save();

    // Trigger browser download
    const pdfBuffer = new Uint8Array(modifiedPdfBytes).buffer as ArrayBuffer;
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;

    // Format the filename
    const safeTopicName = topicName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Topic';
    const safeWorksheetNum = worksheetNum.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'WS001';

    anchor.download = `${safeTopicName}_${safeWorksheetNum}.pdf`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}
