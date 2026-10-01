// pdfmake 0.3 không kèm file khai báo kiểu TypeScript (@types/pdfmake chỉ có
// cho 0.2, API khác) — khai báo tối thiểu phần đang dùng ở utils/pdf/pdfChung.ts.
declare module "pdfmake" {
    interface PdfMakeFontFamily {
        normal: string;
        bold: string;
        italics: string;
        bolditalics: string;
    }

    interface PdfMakeOutputDocument {
        download(filename?: string): Promise<void>;
        getBlob(): Promise<Blob>;
    }

    interface PdfMake {
        createPdf(docDefinition: object): PdfMakeOutputDocument;
        setFonts(fonts: Record<string, PdfMakeFontFamily>): void;
        setUrlAccessPolicy(callback: (url: string) => boolean): void;
    }

    const pdfMake: PdfMake;
    export default pdfMake;
}
