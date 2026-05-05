import {
    Combine,
    Download,
    Droplet,
    FileImage,
    FilePenLine,
    FileText,
    Hash,
    RotateCw,
    Scissors,
    Trash2,
    Workflow,
} from 'lucide-vue-next';
import type { Component } from 'vue';

export type ToolCategory = 'Organize' | 'Convert' | 'Edit';

export type ToolId =
    | 'merge'
    | 'split'
    | 'extract'
    | 'delete-pages'
    | 'reorder'
    | 'rotate'
    | 'page-numbers'
    | 'watermark'
    | 'images-to-pdf'
    | 'pdf-to-images'
    | 'metadata'
    | 'flatten';

export type ToolDefinition = {
    id: ToolId;
    name: string;
    route: string;
    category: ToolCategory;
    icon: Component;
    short: string;
    description: string;
    accepts: string;
    multiple: boolean;
    popular?: boolean;
    options: Array<'pageRange' | 'rotation' | 'order' | 'watermark' | 'pageNumbers' | 'imageOutput' | 'metadata'>;
};

export const tools: ToolDefinition[] = [
    {
        id: 'merge',
        name: 'Merge PDF',
        route: '/merge-pdf',
        category: 'Organize',
        icon: Combine,
        short: 'Combine PDFs in order.',
        description: 'Upload two or more PDF files and combine their pages into one clean document.',
        accepts: '.pdf,application/pdf',
        multiple: true,
        popular: true,
        options: [],
    },
    {
        id: 'split',
        name: 'Split PDF',
        route: '/split-pdf',
        category: 'Organize',
        icon: Scissors,
        short: 'Export every page separately.',
        description: 'Split one PDF into individual page PDFs and download them as a ZIP.',
        accepts: '.pdf,application/pdf',
        multiple: false,
        popular: true,
        options: [],
    },
    {
        id: 'extract',
        name: 'Extract Pages',
        route: '/extract-pdf-pages',
        category: 'Organize',
        icon: Download,
        short: 'Keep only selected pages.',
        description: 'Create a new PDF from page ranges such as 1, 3-5, last.',
        accepts: '.pdf,application/pdf',
        multiple: false,
        options: ['pageRange'],
    },
    {
        id: 'delete-pages',
        name: 'Delete Pages',
        route: '/delete-pdf-pages',
        category: 'Organize',
        icon: Trash2,
        short: 'Remove selected pages.',
        description: 'Drop unwanted pages and rebuild the PDF locally.',
        accepts: '.pdf,application/pdf',
        multiple: false,
        options: ['pageRange'],
    },
    {
        id: 'reorder',
        name: 'Organize PDF',
        route: '/organize-pdf',
        category: 'Organize',
        icon: Workflow,
        short: 'Reorder page sequence.',
        description: 'Type a target page order like 3,1,2,4 or include ranges.',
        accepts: '.pdf,application/pdf',
        multiple: false,
        popular: true,
        options: ['order'],
    },
    {
        id: 'rotate',
        name: 'Rotate PDF',
        route: '/rotate-pdf',
        category: 'Edit',
        icon: RotateCw,
        short: 'Rotate all or selected pages.',
        description: 'Rotate selected PDF pages by 90, 180, or 270 degrees.',
        accepts: '.pdf,application/pdf',
        multiple: false,
        popular: true,
        options: ['pageRange', 'rotation'],
    },
    {
        id: 'page-numbers',
        name: 'Add Page Numbers',
        route: '/add-page-numbers',
        category: 'Edit',
        icon: Hash,
        short: 'Number pages with clean footer text.',
        description: 'Add consistent page numbers using PDF standard fonts.',
        accepts: '.pdf,application/pdf',
        multiple: false,
        options: ['pageNumbers'],
    },
    {
        id: 'watermark',
        name: 'Watermark PDF',
        route: '/watermark-pdf',
        category: 'Edit',
        icon: Droplet,
        short: 'Stamp text across pages.',
        description: 'Apply a diagonal text watermark to selected pages.',
        accepts: '.pdf,application/pdf',
        multiple: false,
        popular: true,
        options: ['pageRange', 'watermark'],
    },
    {
        id: 'images-to-pdf',
        name: 'JPG/PNG to PDF',
        route: '/images-to-pdf',
        category: 'Convert',
        icon: FileImage,
        short: 'Turn images into a PDF.',
        description: 'Build one PDF from JPG and PNG images with page fitting.',
        accepts: '.jpg,.jpeg,.png,image/jpeg,image/png',
        multiple: true,
        popular: true,
        options: [],
    },
    {
        id: 'pdf-to-images',
        name: 'PDF to JPG/PNG',
        route: '/pdf-to-images',
        category: 'Convert',
        icon: FileImage,
        short: 'Render pages as images.',
        description: 'Use PDF.js to render pages and download image files as a ZIP.',
        accepts: '.pdf,application/pdf',
        multiple: false,
        popular: true,
        options: ['pageRange', 'imageOutput'],
    },
    {
        id: 'metadata',
        name: 'Edit Metadata',
        route: '/edit-pdf-metadata',
        category: 'Edit',
        icon: FilePenLine,
        short: 'Set title, author, and subject.',
        description: 'Update document metadata without uploading the file.',
        accepts: '.pdf,application/pdf',
        multiple: false,
        options: ['metadata'],
    },
    {
        id: 'flatten',
        name: 'Flatten PDF',
        route: '/flatten-pdf',
        category: 'Edit',
        icon: FileText,
        short: 'Flatten form fields.',
        description: 'Convert fillable fields into static page content when the form is supported.',
        accepts: '.pdf,application/pdf',
        multiple: false,
        options: [],
    },
];

export const categories = [...new Set(tools.map((tool) => tool.category))] as ToolCategory[];
