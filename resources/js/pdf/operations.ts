import JSZip from 'jszip';
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { ToolId } from '@/data/tools';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type ProcessingOptions = {
    pageRange: string;
    rotation: number;
    order: string;
    compressionMode: 'smart' | 'lossless' | 'balanced' | 'strong' | 'maximum';
    watermarkText: string;
    watermarkOpacity: number;
    pageNumberPrefix: string;
    imageFormat: 'png' | 'jpeg';
    title: string;
    author: string;
    subject: string;
};

export type ProcessResult = {
    name: string;
    blob: Blob;
    summary: string;
};

const pdfMime = 'application/pdf';
const maxFileSize = 200 * 1024 * 1024;
const minUsefulCompressionRatio = 0.995;

type QpdfModule = {
    FS: {
        writeFile(path: string, data: Uint8Array): void;
        readFile(path: string, options?: { encoding?: 'binary' }): Uint8Array;
        unlink(path: string): void;
    };
    callMain(args: string[]): void;
};

type QpdfFactory = (options?: { print?: (message: string) => void; printErr?: (message: string) => void }) => Promise<QpdfModule>;

type CompressionCandidate = {
    bytes: Uint8Array;
    method: string;
    preservesText: boolean;
};

let qpdfModulePromise: Promise<QpdfModule> | null = null;

export async function validateFiles(files: File[], acceptsImages = false): Promise<string[]> {
    const errors: string[] = [];
    const seen = new Set<string>();

    for (const file of files) {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (seen.has(key)) {
            errors.push(`${file.name} is already added.`);
            continue;
        }
        seen.add(key);

        if (file.size > maxFileSize) {
            errors.push(`${file.name} is larger than 200 MB.`);
            continue;
        }

        if (acceptsImages && /^image\/(jpeg|png)$/.test(file.type)) {
            continue;
        }

        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== pdfMime) {
            errors.push(`${file.name} is not a PDF.`);
            continue;
        }

        const header = new TextDecoder().decode(new Uint8Array(await file.slice(0, 5).arrayBuffer()));
        if (header !== '%PDF-') {
            errors.push(`${file.name} does not start with a valid PDF header.`);
        }
    }

    return errors;
}

export async function processPdfTool(tool: ToolId, files: File[], options: ProcessingOptions): Promise<ProcessResult[]> {
    if (files.length === 0) {
        throw new Error('Add at least one file before processing.');
    }

    switch (tool) {
        case 'merge':
            return [await mergePdfs(files)];
        case 'compress':
            return [await compressPdf(files[0], options.compressionMode)];
        case 'split':
            return [await splitPdf(files[0])];
        case 'extract':
            return [await extractPages(files[0], options.pageRange)];
        case 'delete-pages':
            return [await deletePages(files[0], options.pageRange)];
        case 'reorder':
            return [await reorderPages(files[0], options.order)];
        case 'rotate':
            return [await rotatePages(files[0], options.pageRange, options.rotation)];
        case 'page-numbers':
            return [await addPageNumbers(files[0], options.pageNumberPrefix)];
        case 'watermark':
            return [await watermarkPdf(files[0], options)];
        case 'images-to-pdf':
            return [await imagesToPdf(files)];
        case 'pdf-to-images':
            return [await pdfToImages(files[0], options)];
        case 'metadata':
            return [await editMetadata(files[0], options)];
        case 'flatten':
            return [await flattenPdf(files[0])];
        default:
            throw new Error('This PDF tool is not available.');
    }
}

async function loadPdf(file: File): Promise<PDFDocument> {
    try {
        return await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown PDF error';
        throw new Error(`${file.name} could not be opened. It may be encrypted, corrupted, or unsupported. ${message}`);
    }
}

function pdfResult(name: string, bytes: Uint8Array, summary: string): ProcessResult {
    const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return {
        name,
        blob: new Blob([data], { type: pdfMime }),
        summary,
    };
}

function pageIndexes(input: string, total: number, fallbackAll = true): number[] {
    const text = input.trim().toLowerCase();
    if (!text) {
        return fallbackAll ? Array.from({ length: total }, (_, index) => index) : [];
    }

    const indexes: number[] = [];
    for (const rawPart of text.split(',')) {
        const part = rawPart.trim();
        if (!part) continue;

        const [startRaw, endRaw] = part.split('-').map((value) => value.trim());
        const start = parsePageToken(startRaw, total);
        const end = endRaw ? parsePageToken(endRaw, total) : start;
        const low = Math.min(start, end);
        const high = Math.max(start, end);

        for (let page = low; page <= high; page += 1) {
            if (page >= 0 && page < total) indexes.push(page);
        }
    }

    return [...new Set(indexes)];
}

function parsePageToken(token: string, total: number): number {
    if (token === 'last') return total - 1;
    const page = Number.parseInt(token, 10);
    if (!Number.isFinite(page) || page < 1 || page > total) {
        throw new Error(`Page "${token}" is outside the valid range 1-${total}.`);
    }
    return page - 1;
}

function outputName(file: File, suffix: string, extension = 'pdf'): string {
    const base = file.name.replace(/\.[^.]+$/, '');
    return `${base}-${suffix}.${extension}`;
}

async function mergePdfs(files: File[]): Promise<ProcessResult> {
    if (files.length < 2) throw new Error('Merge needs at least two PDFs.');
    const output = await PDFDocument.create();
    let count = 0;

    for (const file of files) {
        const source = await loadPdf(file);
        const pages = await output.copyPages(source, source.getPageIndices());
        pages.forEach((page) => output.addPage(page));
        count += pages.length;
    }

    return pdfResult('merged.pdf', await output.save(), `Merged ${files.length} PDFs into ${count} pages.`);
}

async function compressPdf(file: File, mode: ProcessingOptions['compressionMode']): Promise<ProcessResult> {
    const sourceBytes = new Uint8Array(await file.arrayBuffer());
    const candidates: CompressionCandidate[] = [];
    const originalCandidate: CompressionCandidate = {
        bytes: sourceBytes,
        method: 'The original file was already smaller than the safe compressed outputs.',
        preservesText: true,
    };

    candidates.push(await structuralCompressionCandidate(file, sourceBytes, mode === 'balanced' || mode === 'smart'));

    if (mode === 'lossless') {
        return compressedResult(file, sourceBytes, chooseBestCandidate(sourceBytes, candidates, originalCandidate));
    }

    if (mode === 'balanced') {
        return compressedResult(file, sourceBytes, chooseBestCandidate(sourceBytes, candidates, originalCandidate));
    }

    if (mode === 'smart') {
        const firstPass = chooseBestCandidate(sourceBytes, candidates, originalCandidate);
        if (firstPass.bytes.length <= sourceBytes.length * 0.9) {
            return compressedResult(file, sourceBytes, firstPass);
        }
        candidates.push(await rasterCompressionCandidate(sourceBytes, 'strong'));
        return compressedResult(file, sourceBytes, chooseBestCandidate(sourceBytes, candidates, originalCandidate));
    }

    candidates.push(await rasterCompressionCandidate(sourceBytes, mode));

    return compressedResult(file, sourceBytes, chooseBestCandidate(sourceBytes, candidates, originalCandidate));
}

async function structuralCompressionCandidate(file: File, sourceBytes: Uint8Array, includeImageOptimization: boolean): Promise<CompressionCandidate> {
    try {
        return await qpdfCompressionCandidate(sourceBytes, includeImageOptimization);
    } catch {
        const doc = await loadPdf(file);
        return {
            bytes: await doc.save({ useObjectStreams: true }),
            method: 'Optimized PDF object streams with the built-in browser fallback.',
            preservesText: true,
        };
    }
}

async function qpdfCompressionCandidate(sourceBytes: Uint8Array, includeImageOptimization: boolean): Promise<CompressionCandidate> {
    const args = [
        '--compress-streams=y',
        '--decode-level=generalized',
        '--recompress-flate',
        '--compression-level=9',
        '--object-streams=generate',
    ];

    if (includeImageOptimization) {
        args.push('--optimize-images');
    }

    const bytes = await runQpdf(sourceBytes, args);

    return {
        bytes,
        method: includeImageOptimization
            ? 'Optimized with the browser-served qpdf engine, including safe image recompression when it reduced size.'
            : 'Optimized with the browser-served qpdf engine without changing page visuals.',
        preservesText: true,
    };
}

async function runQpdf(sourceBytes: Uint8Array, args: string[]): Promise<Uint8Array> {
    const qpdf = await loadQpdf();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const input = `/input-${id}.pdf`;
    const output = `/output-${id}.pdf`;

    qpdf.FS.writeFile(input, sourceBytes);

    try {
        qpdf.callMain([...args, input, output]);
        const result = qpdf.FS.readFile(output, { encoding: 'binary' });
        return new Uint8Array(result);
    } finally {
        try {
            qpdf.FS.unlink(input);
        } catch {
            // The in-memory filesystem may already have removed the file after a failed run.
        }
        try {
            qpdf.FS.unlink(output);
        } catch {
            // No output is expected when qpdf rejects an encrypted or malformed PDF.
        }
    }
}

async function loadQpdf(): Promise<QpdfModule> {
    const qpdfUrl = '/vendor/qpdf/qpdf.mjs';
    qpdfModulePromise ??= import(/* @vite-ignore */ qpdfUrl).then((module) =>
        (module.default as QpdfFactory)({
            print: () => undefined,
            printErr: () => undefined,
        }),
    );

    return qpdfModulePromise;
}

async function rasterCompressionCandidate(sourceBytes: Uint8Array, mode: Exclude<ProcessingOptions['compressionMode'], 'smart' | 'lossless' | 'balanced'>): Promise<CompressionCandidate> {
    const profile = compressionProfile(mode);
    const pdf = await pdfjs.getDocument({ data: sourceBytes }).promise;
    const output = await PDFDocument.create();
    const pageCount = pdf.numPages;

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = safeCanvasScale(baseViewport.width, baseViewport.height, profile.scale);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas rendering is not available in this browser.');

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;

        const image = await canvasToBytes(canvas, 'image/jpeg', profile.quality);
        const embedded = await output.embedJpg(image);
        const outputPage = output.addPage([baseViewport.width, baseViewport.height]);
        outputPage.drawImage(embedded, {
            x: 0,
            y: 0,
            width: baseViewport.width,
            height: baseViewport.height,
        });

        page.cleanup();
        canvas.width = 0;
        canvas.height = 0;
    }

    pdf.destroy();

    return {
        bytes: await output.save({ useObjectStreams: true }),
        method: `Rendered ${pageCount} pages with ${profile.label}. Pages were flattened because this mode prioritizes size.`,
        preservesText: false,
    };
}

function chooseBestCandidate(sourceBytes: Uint8Array, candidates: CompressionCandidate[], originalCandidate: CompressionCandidate): CompressionCandidate {
    const best = [...candidates].sort((a, b) => a.bytes.length - b.bytes.length)[0] ?? originalCandidate;

    if (best.bytes.length < sourceBytes.length * minUsefulCompressionRatio) {
        return best;
    }

    return originalCandidate;
}

function compressedResult(file: File, sourceBytes: Uint8Array, candidate: CompressionCandidate): ProcessResult {
    const suffix = candidate.bytes === sourceBytes ? 'original-size' : 'compressed';
    const textState = candidate.preservesText ? 'Text, vectors, links, and selectable content are preserved.' : 'Text selection and vectors may be flattened.';

    return pdfResult(
        outputName(file, suffix),
        candidate.bytes,
        compressionSummary(sourceBytes.length, candidate.bytes.length, `${candidate.method} ${textState}`),
    );
}

function compressionProfile(mode: Exclude<ProcessingOptions['compressionMode'], 'smart' | 'lossless' | 'balanced'>) {
    const profiles = {
        strong: { label: 'strong JPEG compression', quality: 0.68, scale: 1.35 },
        maximum: { label: 'maximum JPEG compression', quality: 0.5, scale: 1 },
    } satisfies Record<Exclude<ProcessingOptions['compressionMode'], 'smart' | 'lossless' | 'balanced'>, { label: string; quality: number; scale: number }>;

    return profiles[mode];
}

function safeCanvasScale(width: number, height: number, requestedScale: number) {
    const maxPixels = 16_000_000;
    const requestedPixels = width * height * requestedScale * requestedScale;
    if (requestedPixels <= maxPixels) return requestedScale;

    return Math.max(0.5, Math.sqrt(maxPixels / (width * height)));
}

async function canvasToBytes(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Uint8Array> {
    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('Failed to compress page image.'))), mime, quality);
    });

    return new Uint8Array(await blob.arrayBuffer());
}

function compressionSummary(originalSize: number, outputSize: number, prefix: string) {
    const difference = originalSize - outputSize;
    if (difference > 0) {
        const percent = Math.round((difference / originalSize) * 100);
        return `${prefix} Reduced from ${formatBytes(originalSize)} to ${formatBytes(outputSize)} (${percent}% smaller).`;
    }

    return `${prefix} Output is ${formatBytes(outputSize)}; this PDF was already compact for the selected mode.`;
}

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** unit).toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

async function splitPdf(file: File): Promise<ProcessResult> {
    const source = await loadPdf(file);
    const zip = new JSZip();
    const total = source.getPageCount();

    for (let index = 0; index < total; index += 1) {
        const doc = await PDFDocument.create();
        const [page] = await doc.copyPages(source, [index]);
        doc.addPage(page);
        zip.file(outputName(file, `page-${index + 1}`), await doc.save());
    }

    return {
        name: outputName(file, 'split-pages', 'zip'),
        blob: await zip.generateAsync({ type: 'blob' }),
        summary: `Split ${total} pages into individual PDFs.`,
    };
}

async function extractPages(file: File, range: string): Promise<ProcessResult> {
    const source = await loadPdf(file);
    const indexes = pageIndexes(range, source.getPageCount(), false);
    if (indexes.length === 0) throw new Error('Choose at least one page to extract.');
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, indexes);
    pages.forEach((page) => output.addPage(page));
    return pdfResult(outputName(file, 'extracted'), await output.save(), `Extracted ${indexes.length} pages.`);
}

async function deletePages(file: File, range: string): Promise<ProcessResult> {
    const source = await loadPdf(file);
    const remove = new Set(pageIndexes(range, source.getPageCount(), false));
    if (remove.size === 0) throw new Error('Choose at least one page to delete.');
    const keep = source.getPageIndices().filter((index) => !remove.has(index));
    if (keep.length === 0) throw new Error('You cannot delete every page from a PDF.');
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, keep);
    pages.forEach((page) => output.addPage(page));
    return pdfResult(outputName(file, 'pages-deleted'), await output.save(), `Deleted ${remove.size} pages.`);
}

async function reorderPages(file: File, order: string): Promise<ProcessResult> {
    const source = await loadPdf(file);
    const indexes = pageIndexes(order, source.getPageCount(), false);
    if (indexes.length === 0) throw new Error('Enter a page order such as 3,1,2.');
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, indexes);
    pages.forEach((page) => output.addPage(page));
    return pdfResult(outputName(file, 'organized'), await output.save(), `Created a ${indexes.length}-page organized PDF.`);
}

async function rotatePages(file: File, range: string, rotation: number): Promise<ProcessResult> {
    const doc = await loadPdf(file);
    const indexes = new Set(pageIndexes(range, doc.getPageCount()));
    doc.getPages().forEach((page, index) => {
        if (indexes.has(index)) {
            const current = page.getRotation().angle;
            page.setRotation(degrees((current + rotation) % 360));
        }
    });
    return pdfResult(outputName(file, 'rotated'), await doc.save(), `Rotated ${indexes.size} pages by ${rotation} degrees.`);
}

async function addPageNumbers(file: File, prefix: string): Promise<ProcessResult> {
    const doc = await loadPdf(file);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    pages.forEach((page, index) => {
        const { width } = page.getSize();
        const label = `${prefix || 'Page'} ${index + 1} / ${pages.length}`;
        page.drawText(label, {
            x: width / 2 - font.widthOfTextAtSize(label, 9) / 2,
            y: 22,
            size: 9,
            font,
            color: rgb(0.38, 0.38, 0.42),
        });
    });
    return pdfResult(outputName(file, 'numbered'), await doc.save(), `Added numbers to ${pages.length} pages.`);
}

async function watermarkPdf(file: File, options: ProcessingOptions): Promise<ProcessResult> {
    const doc = await loadPdf(file);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const pages = doc.getPages();
    const indexes = new Set(pageIndexes(options.pageRange, pages.length));
    const text = options.watermarkText.trim() || 'CONFIDENTIAL';

    pages.forEach((page, index) => {
        if (!indexes.has(index)) return;
        const { width, height } = page.getSize();
        page.drawText(text, {
            x: width * 0.18,
            y: height * 0.48,
            size: Math.max(32, Math.min(width, height) / 10),
            font,
            color: rgb(0.88, 0.12, 0.22),
            opacity: options.watermarkOpacity,
            rotate: degrees(35),
        });
    });

    return pdfResult(outputName(file, 'watermarked'), await doc.save(), `Watermarked ${indexes.size} pages.`);
}

async function imagesToPdf(files: File[]): Promise<ProcessResult> {
    const doc = await PDFDocument.create();
    for (const file of files) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const image = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
            ? await doc.embedPng(bytes)
            : await doc.embedJpg(bytes);
        const page = doc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    return pdfResult('images-to-pdf.pdf', await doc.save(), `Converted ${files.length} images to one PDF.`);
}

async function pdfToImages(file: File, options: ProcessingOptions): Promise<ProcessResult> {
    const source = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(source) }).promise;
    const indexes = pageIndexes(options.pageRange, pdf.numPages);
    const zip = new JSZip();
    const mime = options.imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png';

    for (const index of indexes) {
        const page = await pdf.getPage(index + 1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas rendering is not available in this browser.');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('Failed to render image.'))), mime, 0.92);
        });
        zip.file(outputName(file, `page-${index + 1}`, options.imageFormat === 'jpeg' ? 'jpg' : 'png'), blob);
    }

    pdf.destroy();
    return {
        name: outputName(file, 'pages-as-images', 'zip'),
        blob: await zip.generateAsync({ type: 'blob' }),
        summary: `Rendered ${indexes.length} pages as ${options.imageFormat.toUpperCase()} files.`,
    };
}

async function editMetadata(file: File, options: ProcessingOptions): Promise<ProcessResult> {
    const doc = await loadPdf(file);
    if (options.title.trim()) doc.setTitle(options.title.trim());
    if (options.author.trim()) doc.setAuthor(options.author.trim());
    if (options.subject.trim()) doc.setSubject(options.subject.trim());
    doc.setModificationDate(new Date());
    return pdfResult(outputName(file, 'metadata'), await doc.save(), 'Updated document metadata.');
}

async function flattenPdf(file: File): Promise<ProcessResult> {
    const doc = await loadPdf(file);
    const form = doc.getForm();
    form.flatten();
    return pdfResult(outputName(file, 'flattened'), await doc.save(), 'Flattened supported form fields.');
}

export function downloadResult(result: ProcessResult): string {
    return URL.createObjectURL(result.blob);
}
