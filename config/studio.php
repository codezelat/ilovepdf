<?php

return [
    'base_title' => 'ILovePDF Studio',
    'image' => '/icons/icon-512.png',
    'pages' => [
        'home' => [
            'path' => '/',
            'title' => 'Free Online PDF Tools & Private PDF Editor - ILovePDF Studio',
            'description' => 'Merge, split, rotate, watermark, number, organize, convert images, and render PDF pages locally in your browser with ILovePDF Studio.',
        ],
        'tools' => [
            'path' => '/tools',
            'title' => 'All PDF Tools for Browser-Based Editing - ILovePDF Studio',
            'description' => 'Browse private browser PDF tools for merging, splitting, rotating, watermarking, numbering, organizing, rendering, and converting files.',
        ],
        'features' => [
            'path' => '/features',
            'title' => 'Private Browser PDF Features & Local Processing - ILovePDF Studio',
            'description' => 'Learn how ILovePDF Studio keeps current PDF workflows local in your browser with no document upload endpoint for supported tools.',
        ],
        'privacy' => [
            'path' => '/privacy',
            'title' => 'Privacy Policy for Browser PDF Tools - ILovePDF Studio',
            'description' => 'Read how ILovePDF Studio handles browser-local files, essential cookies, service information, and privacy choices.',
            'robots' => 'index, follow, max-image-preview:large',
        ],
        'terms' => [
            'path' => '/terms',
            'title' => 'Terms of Use for Browser PDF Tools - ILovePDF Studio',
            'description' => 'Read the terms for using ILovePDF Studio and its browser-local PDF tools.',
            'robots' => 'index, follow, max-image-preview:large',
        ],
    ],
    'tools' => [
        'merge' => [
            'path' => '/merge-pdf',
            'name' => 'Merge PDF',
            'title' => 'Merge PDF Online Privately - ILovePDF Studio',
            'description' => 'Combine two or more PDF files into one document directly in your browser with no document upload for this tool.',
        ],
        'compress' => [
            'path' => '/compress-pdf',
            'name' => 'Compress PDF',
            'title' => 'Compress PDF Online Privately - ILovePDF Studio',
            'description' => 'Reduce PDF file size privately in your browser with qpdf-powered optimization, lossless cleanup, and safe stronger compression modes.',
        ],
        'split' => [
            'path' => '/split-pdf',
            'name' => 'Split PDF',
            'title' => 'Split PDF Online Into Pages - ILovePDF Studio',
            'description' => 'Split a PDF into individual page files and download them as a ZIP using browser-local processing.',
        ],
        'extract' => [
            'path' => '/extract-pdf-pages',
            'name' => 'Extract PDF Pages',
            'title' => 'Extract PDF Pages Online - ILovePDF Studio',
            'description' => 'Create a new PDF from selected page ranges such as 1, 3-5, or last directly in your browser.',
        ],
        'delete-pages' => [
            'path' => '/delete-pdf-pages',
            'name' => 'Delete PDF Pages',
            'title' => 'Delete Pages from PDF Online - ILovePDF Studio',
            'description' => 'Remove unwanted pages from a PDF and rebuild the document locally in your browser.',
        ],
        'organize' => [
            'path' => '/organize-pdf',
            'name' => 'Organize PDF',
            'title' => 'Organize PDF Pages Online - ILovePDF Studio',
            'description' => 'Reorder PDF pages with a custom page sequence and download the organized document.',
        ],
        'rotate' => [
            'path' => '/rotate-pdf',
            'name' => 'Rotate PDF',
            'title' => 'Rotate PDF Online - ILovePDF Studio',
            'description' => 'Rotate all or selected PDF pages by 90, 180, or 270 degrees using local browser processing.',
        ],
        'page-numbers' => [
            'path' => '/add-page-numbers',
            'name' => 'Add Page Numbers',
            'title' => 'Add Page Numbers to PDF Online - ILovePDF Studio',
            'description' => 'Add clean page numbers to PDF footers using browser-local PDF editing.',
        ],
        'watermark' => [
            'path' => '/watermark-pdf',
            'name' => 'Watermark PDF',
            'title' => 'Watermark PDF Online - ILovePDF Studio',
            'description' => 'Apply a diagonal text watermark to selected PDF pages directly in your browser.',
        ],
        'images-to-pdf' => [
            'path' => '/images-to-pdf',
            'name' => 'JPG and PNG to PDF',
            'title' => 'Convert JPG and PNG to PDF Online - ILovePDF Studio',
            'description' => 'Build a PDF from JPG and PNG images locally in your browser.',
        ],
        'pdf-to-images' => [
            'path' => '/pdf-to-images',
            'name' => 'PDF to JPG or PNG',
            'title' => 'Convert PDF to JPG or PNG Online - ILovePDF Studio',
            'description' => 'Render PDF pages as JPG or PNG images and download them as a ZIP.',
        ],
        'metadata' => [
            'path' => '/edit-pdf-metadata',
            'name' => 'Edit PDF Metadata',
            'title' => 'Edit PDF Metadata Online - ILovePDF Studio',
            'description' => 'Update PDF title, author, and subject metadata without uploading the document.',
        ],
        'flatten' => [
            'path' => '/flatten-pdf',
            'name' => 'Flatten PDF',
            'title' => 'Flatten PDF Forms Online - ILovePDF Studio',
            'description' => 'Flatten supported PDF form fields into static page content in the browser.',
        ],
    ],
];
