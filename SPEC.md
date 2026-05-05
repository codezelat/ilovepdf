# ILovePDF Studio Specification

## Product Summary

Build an iLove-style PDF toolkit using Laravel, Inertia, Vue, TypeScript, Vite, and Tailwind. The product should keep the same direct, friendly tool-grid feel as the ILoveIMG reference while covering practical PDF workflows.

## Product Promise

Users can process common PDF tasks directly in the browser without uploading private documents to a server.

## Core Principles

- Keep the Laravel + Inertia + Vue stack.
- Keep user files local for implemented tools.
- Use a registry-driven tool directory.
- Make errors recoverable and specific.
- Keep the UI red/white, crisp, dense enough for tools, and mobile-safe.

## Local Tool Scope

- Merge PDF
- Split PDF
- Extract pages
- Delete pages
- Reorder pages
- Rotate pages
- Add page numbers
- Add text watermark
- Images to PDF
- PDF to images
- Edit metadata
- Flatten PDF forms

## Edge Cases

- Empty selection
- Duplicate file attempts
- Non-PDF files
- Invalid PDF magic bytes
- Oversized files
- Encrypted or malformed PDFs
- Page ranges outside document bounds
- Attempts to delete every page
- Browsers without canvas rendering
