// Đọc HTML ghi chú (TinyMCE) ra cấu trúc trung gian độc lập định dạng đầu
// ra — dùng chung cho xuất Word (xuatWordPhieu1/2.ts, dựng Paragraph/TextRun
// của docx) và xuất PDF (pdf/xuatPdfPhieu1/2.ts, dựng content pdfmake), để
// 2 bản luôn dịch ghi chú giống hệt nhau. Chỉ giữ định dạng cơ bản (đậm/
// nghiêng/gạch chân/xuống dòng/danh sách). KHÔNG dịch ảnh (<img>) tại chỗ —
// ảnh được gom riêng (layDanhSachAnhTrongHtml) và chèn ở khối "Hình ảnh minh
// chứng" cuối văn bản. Bảng lồng trong ghi chú (hiếm gặp) bị bỏ qua cho đơn
// giản.

export interface DoanChuGhiChu {
    text: string;
    dam?: boolean;
    nghieng?: boolean;
    gachChan?: boolean;
    xuongDong?: boolean; // <br> — text rỗng, chỉ ngắt dòng
}

export interface DoanVanGhiChu {
    runs: DoanChuGhiChu[];
    laMuc?: boolean; // 1 mục <li> của danh sách — hiển thị "• " + thụt lề
}

type KieuChu = Pick<DoanChuGhiChu, "dam" | "nghieng" | "gachChan">;

const layRunsTuNode = (node: Node, ke: KieuChu): DoanChuGhiChu[] => {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? "";
        return text ? [{ text, ...ke }] : [];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === "img") return []; // bỏ qua ảnh
    if (tag === "br") return [{ text: "", xuongDong: true }];

    const keMoi: KieuChu = {
        dam: ke.dam || tag === "strong" || tag === "b",
        nghieng: ke.nghieng || tag === "em" || tag === "i",
        gachChan: ke.gachChan || tag === "u",
    };
    return Array.from(el.childNodes).flatMap(con => layRunsTuNode(con, keMoi));
};

const THE_KHOI = ["p", "div", "h1", "h2", "h3", "h4", "li", "blockquote"];

// Ghi chú rỗng/không có chữ -> mảng rỗng; nơi dựng đầu ra tự quyết định hiển
// thị gì khi rỗng (ô trống, "Chưa có ý kiến"...).
export const docHtmlGhiChu = (html?: string): DoanVanGhiChu[] => {
    if (!html || !html.trim()) return [];

    const doc = new DOMParser().parseFromString(html, "text/html");
    const ketQua: DoanVanGhiChu[] = [];

    Array.from(doc.body.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) ketQua.push({ runs: [{ text }] });
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();

        if (tag === "img" || tag === "table") return;
        if (tag === "ul" || tag === "ol") {
            Array.from(el.children).forEach(li => {
                ketQua.push({ runs: Array.from(li.childNodes).flatMap(con => layRunsTuNode(con, {})), laMuc: true });
            });
            return;
        }

        const runs = THE_KHOI.includes(tag)
            ? Array.from(el.childNodes).flatMap(con => layRunsTuNode(con, {}))
            : layRunsTuNode(el, {});
        if (runs.length > 0) ketQua.push({ runs });
    });

    return ketQua;
};

// Lấy DANH SÁCH src ảnh trong 1 đoạn HTML ghi chú, ĐÚNG THỨ TỰ xuất hiện —
// dùng để gom toàn bộ ảnh minh chứng của phiếu (nhiều ô ghi chú khác nhau)
// theo đúng thứ tự đọc trên phiếu trước khi tải + chèn vào cuối file.
export const layDanhSachAnhTrongHtml = (html?: string): string[] => {
    if (!html || !html.trim()) return [];
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("img"))
        .map(img => img.getAttribute("src"))
        .filter((src): src is string => !!src);
};
