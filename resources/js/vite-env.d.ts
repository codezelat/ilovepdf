/// <reference types="vite/client" />

declare module '/vendor/qpdf/qpdf.mjs' {
    const createQpdf: unknown;
    export default createQpdf;
}
