import {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    ImageRun,
    Packer,
    PageNumber,
    Paragraph,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
} from "docx";
import dayjs from "dayjs";
import { saveAs } from "file-saver";
import logoPdf from "../assets/images/LogoPDF.png";
import phieuHeaderInfo from "../config/phieuHeaderInfo.json";
import { Phieu3Bang1DongModel } from "../models/Phieu3ResponseModel";

// Xuất file .docx khớp đúng layout Phieu3FormPage.tsx (báo cáo chất lượng
// dịch vụ suất ăn theo tháng — Phiếu 3). Chạy hoàn toàn ở client (thư viện
// "docx"), không cần đổi backend. Đoạn "Ý kiến của BP.QLTT" là HTML do
// TinyMCE sinh ra — được dịch sang các Paragraph/TextRun của Word, giữ định
// dạng cơ bản (đậm/nghiêng/gạch chân/danh sách); ẢNH DÁN VÀO GHI CHÚ BỊ BỎ
// QUA theo yêu cầu (không nhúng ảnh vào file Word).

const FONT = "Times New Roman";
const CO_CHU = 26; // 13pt (đơn vị docx = half-point)
const CO_CHU_TIEU_DE = 30; // 14pt

const VIEN_O = { style: BorderStyle.SINGLE, size: 4, color: "000000" } as const;
const VIEN_BANG = {
    top: VIEN_O,
    bottom: VIEN_O,
    left: VIEN_O,
    right: VIEN_O,
    insideHorizontal: VIEN_O,
    insideVertical: VIEN_O,
};

const oChu = (text: string, opts: { dam?: boolean; nghieng?: boolean; gachChan?: boolean; co?: number } = {}) =>
    new TextRun({
        text,
        font: FONT,
        bold: opts.dam,
        italics: opts.nghieng,
        underline: opts.gachChan ? {} : undefined,
        size: opts.co ?? CO_CHU,
    });

const oDoan = (
    text: string,
    opts: { dam?: boolean; nghieng?: boolean; canGiua?: boolean; co?: number; canhTruoc?: number; canhSau?: number } = {}
) =>
    new Paragraph({
        alignment: opts.canGiua ? AlignmentType.CENTER : undefined,
        spacing: { before: opts.canhTruoc ?? 0, after: opts.canhSau ?? 80 },
        children: [oChu(text, opts)],
    });

const oOBang = (
    text: string,
    opts: { dam?: boolean; canTrai?: boolean; columnSpan?: number; rowSpan?: number } = {}
) =>
    new TableCell({
        columnSpan: opts.columnSpan,
        rowSpan: opts.rowSpan,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [
            new Paragraph({
                alignment: opts.canTrai ? AlignmentType.LEFT : AlignmentType.CENTER,
                children: [oChu(text, { dam: opts.dam, co: 24 })],
            }),
        ],
    });

const soHienThi = (v?: number): string => (v === undefined || v === null ? "--" : v.toLocaleString("vi-VN"));
const phanTramHienThi = (v?: number): string =>
    v === undefined || v === null ? "--" : `${v.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const diem1SoLeHienThi = (v?: number): string =>
    v === undefined || v === null ? "--" : v.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// ============================================================
// DỊCH HTML (TinyMCE) -> Paragraph[] — giữ đậm/nghiêng/gạch chân/danh sách,
// BỎ QUA ảnh (<img>) theo yêu cầu.
// ============================================================

interface KieuChu {
    dam?: boolean;
    nghieng?: boolean;
    gachChan?: boolean;
}

const layTextRunsTuNode = (node: Node, ke: KieuChu): TextRun[] => {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? "";
        return text ? [oChu(text, ke)] : [];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === "img") return []; // bỏ qua ảnh
    if (tag === "br") return [new TextRun({ text: "", break: 1 })];

    const keMoi: KieuChu = {
        dam: ke.dam || tag === "strong" || tag === "b",
        nghieng: ke.nghieng || tag === "em" || tag === "i",
        gachChan: ke.gachChan || tag === "u",
    };
    return Array.from(el.childNodes).flatMap(con => layTextRunsTuNode(con, keMoi));
};

const dichHtmlSangDoan = (html: string): Paragraph[] => {
    if (!html || !html.trim()) return [new Paragraph({ children: [oChu("")] })];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const ketQua: Paragraph[] = [];

    const xuLyKhoi = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) ketQua.push(new Paragraph({ children: [oChu(text)], spacing: { after: 60 } }));
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();

        if (tag === "img") return; // bỏ qua ảnh
        if (tag === "ul" || tag === "ol") {
            Array.from(el.children).forEach(li => {
                const runs = Array.from(li.childNodes).flatMap(con => layTextRunsTuNode(con, {}));
                ketQua.push(
                    new Paragraph({
                        children: [oChu("• "), ...runs],
                        spacing: { after: 40 },
                        indent: { left: 360 },
                    })
                );
            });
            return;
        }
        if (["p", "div", "h1", "h2", "h3", "h4", "li", "blockquote"].includes(tag)) {
            const runs = Array.from(el.childNodes).flatMap(con => layTextRunsTuNode(con, {}));
            if (runs.length > 0) {
                ketQua.push(new Paragraph({ children: runs, spacing: { after: 60 } }));
            }
            return;
        }
        if (tag === "table") return; // bảng lồng trong ghi chú — hiếm gặp, bỏ qua cho đơn giản

        // Thẻ inline lạc giữa các khối (VD text/strong nằm trực tiếp trong body)
        const runs = layTextRunsTuNode(el, {});
        if (runs.length > 0) ketQua.push(new Paragraph({ children: runs, spacing: { after: 60 } }));
    };

    Array.from(doc.body.childNodes).forEach(xuLyKhoi);

    return ketQua.length > 0 ? ketQua : [new Paragraph({ children: [oChu("Chưa có ý kiến")] })];
};

// ============================================================
// THAM SỐ ĐẦU VÀO — lấy thẳng từ state đang hiển thị trên Phieu3FormPage.tsx
// (không gọi lại API) để đảm bảo xuất đúng những gì người dùng đang thấy.
// ============================================================

export interface XuatWordPhieu3ChuKy {
    tenBuoc?: string;
    trangThai: string; // CHO_KY, DA_DUYET, TU_CHOI
    ghiChu?: string;
    ngayKy?: string;
}

export interface XuatWordPhieu3Params {
    soHieu?: string;
    ngayLap?: string; // NgayTao của phiếu — hiện "Quảng Ngãi, ngày ... tháng ... năm ..." trên chuKyTable
    tenNhaThau: string;
    thang: number;
    nam: number;
    dsSoHieuPhieu2: string[];
    canCuPhieu1: { tenPhongBan: string; danhSachSoHieu: string[] }[];
    bang1: Phieu3Bang1DongModel[];
    bang2: { tenPhongBan: string; giaTriTheoTieuChi: (number | undefined)[] }[];
    bang2CotTieuChi: string[]; // nhãn đầy đủ 6 tiêu chí, đúng thứ tự
    yKienHtml: string;
    chuKy: XuatWordPhieu3ChuKy[];
}

const trangThaiChuKyHienThi = (trangThai: string, ghiChu?: string): string => {
    switch (trangThai) {
        case "DA_DUYET": return "Đã ký";
        case "TU_CHOI": return `Từ chối${ghiChu ? ": " + ghiChu : ""}`;
        default: return "";
    }
};

// "Quảng Ngãi, ngày ... tháng ... năm ..." trên chuKyTable — lấy theo ngày
// lập phiếu (NgayTao), không phải ngày xuất Word.
const ngayLapHienThi = (ngayLap?: string): string => {
    const d = ngayLap ? dayjs(ngayLap) : dayjs();
    return `Quảng Ngãi, ngày ${d.format("DD")} tháng ${d.format("MM")} năm ${d.format("YYYY")}`;
};

// Ảnh logo gốc 756x309px — giữ đúng tỉ lệ khi thu nhỏ cho khớp
// .phieu-header-logo (xem PhieuHeader.tsx / _phieu-base.scss).
const LOGO_CAO = 70;
const LOGO_RONG = Math.round(LOGO_CAO * (756 / 309));

// Thông tin biểu mẫu (số biểu mẫu/ngày hiệu lực/lần sửa đổi) của Phiếu 3 —
// lấy từ config/phieuHeaderInfo.json, cùng nguồn với PhieuHeader.tsx trên
// màn hình, để khớp cứng theo đúng layout PhieuHeader khi xuất Word.
const THONG_TIN_BIEU_MAU_PHIEU3 = (phieuHeaderInfo as Record<string, {
    soBieuMau: string;
    ngayHieuLuc: string;
    lanSuaDoi: string;
}>).PHIEU3;

const BANG1_COT_DIEM_LABEL = [
    "1-Rất không hài lòng",
    "2-Không hài lòng",
    "3-Bình thường",
    "4-Hài lòng",
    "5-Rất hài lòng",
];

export const xuatWordPhieu3 = async (params: XuatWordPhieu3Params): Promise<void> => {
    const {
        soHieu, ngayLap, tenNhaThau, thang, nam, dsSoHieuPhieu2, canCuPhieu1,
        bang1, bang2, bang2CotTieuChi, yKienHtml, chuKy,
    } = params;

    const dongLuot = bang1.find(d => d.maDong === "LUOT_CBNV_THAM_GIA");
    const dongSuatAn = bang1.find(d => d.maDong === "TONG_SUAT_AN");
    const dongTyLe = bang1.find(d => d.maDong === "TY_LE_PHAN_TRAM");
    const cacMuc: ("diem1" | "diem2" | "diem3" | "diem4" | "diem5")[] =
        ["diem1", "diem2", "diem3", "diem4", "diem5"];

    // ---- Bảng 1 ----
    // 2 dòng đầu (rowSpan header) đánh dấu tableHeader: true — Word tự lặp
    // lại đúng 2 dòng này ở đầu mỗi trang nếu bảng bị ngắt trang giữa chừng.
    const bang1Rows: TableRow[] = [
        new TableRow({
            tableHeader: true,
            children: [
                oOBang("Nội dung", { dam: true, rowSpan: 2 }),
                oOBang("Tiêu chí đánh giá", { dam: true, columnSpan: 5 }),
                oOBang("Tổng", { dam: true, rowSpan: 2 }),
            ],
        }),
        new TableRow({
            tableHeader: true,
            children: BANG1_COT_DIEM_LABEL.map(label => oOBang(label, { dam: true })),
        }),
        new TableRow({
            children: [
                oOBang("Số lượt CBNV tham gia đánh giá", { canTrai: true }),
                ...cacMuc.map(muc => oOBang(soHienThi(dongLuot?.[muc]))),
                oOBang(soHienThi(dongLuot?.tong)),
            ],
        }),
        new TableRow({
            children: [
                oOBang("Tổng số lượng suất ăn tại chỗ tại các vị trí đánh giá", { canTrai: true, columnSpan: 6 }),
                oOBang(soHienThi(dongSuatAn?.tong)),
            ],
        }),
        new TableRow({
            children: [
                oOBang("Tỷ lệ % theo tiêu chí đánh giá", { canTrai: true }),
                ...cacMuc.map(muc => oOBang(phanTramHienThi(dongTyLe?.[muc]))),
                oOBang(dongTyLe?.tong !== undefined ? phanTramHienThi(dongTyLe.tong) : "--"),
            ],
        }),
    ];

    // ---- Bảng 2 ----
    const bang2Rows: TableRow[] = [
        new TableRow({
            tableHeader: true,
            children: [
                oOBang("Bộ phận đánh giá", { dam: true, rowSpan: 2 }),
                oOBang("Điểm đánh giá theo tiêu chí (thang điểm 1-5)", { dam: true, columnSpan: bang2CotTieuChi.length }),
            ],
        }),
        new TableRow({
            tableHeader: true,
            children: bang2CotTieuChi.map(label => oOBang(label, { dam: true })),
        }),
        ...bang2.map(dong => new TableRow({
            children: [
                oOBang(dong.tenPhongBan, { canTrai: true }),
                ...dong.giaTriTheoTieuChi.map(v => oOBang(diem1SoLeHienThi(v))),
            ],
        })),
    ];

    // ---- "1. Căn cứ đánh giá" ----
    const canCuDoan: Paragraph[] = [
        oDoan("- Hợp đồng suất ăn công nghiệp số 0390.2023.HPDQ-PN-HDNT;"),
    ];
    if (dsSoHieuPhieu2.length > 0) {
        canCuDoan.push(
            oDoan(
                `- Căn cứ kết quả đánh giá thực tế từ CBNV và phòng chức năng theo các Bảng đánh giá số ${dsSoHieuPhieu2.join("; ")};`
            )
        );
    }
    canCuPhieu1.forEach(({ tenPhongBan, danhSachSoHieu }) => {
        canCuDoan.push(
            oDoan(`- Căn cứ kết quả đánh giá công tác VSATTP của ${tenPhongBan} theo các Bảng đánh giá số: ${danhSachSoHieu.join("; ")} của ${tenPhongBan}.`)
        );
    });

    // ---- Chữ ký ---- table 2 cột không viền: trái "P.ĐN", phải "Người lập"
    // (nhãn cột khớp cứng theo yêu cầu, không lấy tenBuoc động từ MauLuongKy
    // vì Admin có thể đặt tên bước khác đi).
    const buocNguoiLap = chuKy.find(b => (b.tenBuoc || "").includes("lập")) ?? chuKy[0];
    const buocPhongBan = chuKy.find(b => b !== buocNguoiLap) ?? chuKy[1];
    // Phần mềm không còn luồng ký nội bộ (ký diễn ra bên ngoài trên bản in),
    // nên "chuKy" thường rỗng — mặc định hiện placeholder "(Ký, ghi rõ họ
    // tên)" (nhánh default của trangThaiChuKyHienThi) thay vì để trống.
    const trangThaiChuKyDoan = (buoc?: XuatWordPhieu3ChuKy) =>
        oDoan(trangThaiChuKyHienThi(buoc?.trangThai ?? "", buoc?.ghiChu), { canGiua: true });

    const chuKyTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: TableBorders.NONE,
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({})],
                    }),
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [oDoan(ngayLapHienThi(ngayLap), { nghieng: true, canGiua: true })],
                    }),
                ],
            }),
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                            oDoan("P.ĐN", { dam: true, canGiua: true, canhSau: 40 }),
                            trangThaiChuKyDoan(buocPhongBan),
                        ],
                    }),
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                            oDoan("Người lập", { dam: true, canGiua: true, canhSau: 40 }),
                            trangThaiChuKyDoan(buocNguoiLap),
                        ],
                    }),
                ],
            }),
        ],
    });

    // ---- Header (logo + thông tin biểu mẫu) — table 2 cột không viền, mỗi
    // cột 1 nội dung (logo | thông tin biểu mẫu), canh giữa theo chiều dọc
    // để không bị lệch trên/dưới giữa 2 cột. "Số:" tách riêng bên dưới table.
    const logoBuffer = await fetch(logoPdf).then(r => r.arrayBuffer());
    const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: TableBorders.NONE,
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 60, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        type: "png",
                                        data: logoBuffer,
                                        transformation: { width: LOGO_RONG, height: LOGO_CAO },
                                    }),
                                ],
                            }),
                        ],
                    }),
                    new TableCell({
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [oChu(THONG_TIN_BIEU_MAU_PHIEU3?.soBieuMau ?? "", { co: 22,  dam: true })],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [oChu(`Ngày hiệu lực: ${THONG_TIN_BIEU_MAU_PHIEU3?.ngayHieuLuc ?? ""}`, { nghieng: true, co: 22,  dam: true })],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [oChu(`Lần sửa đổi: ${THONG_TIN_BIEU_MAU_PHIEU3?.lanSuaDoi ?? ""}`, { nghieng: true, co: 22, dam: true })],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    // Số trang góc dưới-phải mỗi trang — field PageNumber.CURRENT/TOTAL_PAGES
    // của docx tự cập nhật theo phân trang thật khi mở file (không phải số
    // trang HTML lúc xem trên web).
    const footer = new Footer({
        children: [
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                    oChu("Trang "),
                    new TextRun({ font: FONT, size: CO_CHU, children: [PageNumber.CURRENT] }),
                    oChu("/"),
                    new TextRun({ font: FONT, size: CO_CHU, children: [PageNumber.TOTAL_PAGES] }),
                ],
            }),
        ],
    });

    const doc = new Document({
        sections: [
            {
                properties: {},
                footers: { default: footer },
                children: [
                    headerTable,
                    oDoan(`Số: ${soHieu || "........................"}`, { co: 22, canhTruoc: 100, canhSau: 100 }),
                    oDoan("BÁO CÁO CHẤT LƯỢNG DỊCH VỤ SUẤT ĂN", { dam: true, canGiua: true, co: CO_CHU_TIEU_DE, canhSau: 200 }),

                    oDoan(`Nhà thầu: ${tenNhaThau || "........................"}`, {dam: true, canGiua: true}),
                    oDoan(`Tháng ${String(thang).padStart(2, "0")}/${nam}`, { canhSau: 200, dam: true, canGiua: true }),

                    oDoan("1. Căn cứ đánh giá", { dam: true, canhSau: 100 }),
                    ...canCuDoan,

                    oDoan("2. Đánh giá chất lượng dịch vụ theo phương án phân bổ số lượng suất ăn", { dam: true, canhTruoc: 200, canhSau: 100 }),

                    oDoan("2.1. Đánh giá trong tháng từ CBNV", { dam: true, canhSau: 80 }),
                    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: VIEN_BANG, rows: bang1Rows }),

                    oDoan("2.2. Đánh giá trong tháng từ phòng ban liên quan", { dam: true, canhTruoc: 200, canhSau: 80 }),
                    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: VIEN_BANG, rows: bang2Rows }),

                    oDoan("3. Ý kiến của BP.QLTT", { dam: true, canhTruoc: 200, canhSau: 100 }),
                    ...dichHtmlSangDoan(yKienHtml),

                    oDoan("", { canhTruoc: 200, canhSau: 0 }),
                    chuKyTable,
                ],
            },
        ],
        styles: {
            default: {
                document: { run: { font: FONT, size: CO_CHU } },
            },
        },
    });

    const blob = await Packer.toBlob(doc);
    const tenFile = `BaoCao_Phieu3_${String(thang).padStart(2, "0")}${nam}_${(soHieu || "").replace(/[\\/:*?"<>|]/g, "-") || "chua-luu"}.docx`;
    saveAs(blob, tenFile);
};

export default xuatWordPhieu3;
