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
import { BangCoDinhConfig } from "../components/phieu";
import { PHIEU4_BANG1_CONFIG, PHIEU4_BANG2_CONFIG } from "../config/phieu4BangConfig";
import { Phieu4BangModel, Phieu4DongModel } from "../models/Phieu4ResponseModel";

// Xuất file .docx khớp đúng layout Phieu4FormPage.tsx (bảng tổng hợp đánh
// giá & phân bổ suất ăn — Phiếu 4), theo đúng cách làm của xuatWordPhieu3.ts.
// Chạy hoàn toàn ở client (thư viện "docx"), không cần đổi backend. Bảng 1/2
// dùng CHUNG cấu hình BangCoDinhConfig (PHIEU4_BANG1_CONFIG/PHIEU4_BANG2_CONFIG,
// từ config/phieu4BangConfig.ts) để không lệch cấu trúc dòng so với màn hình.

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

const oChu = (text: string, opts: { dam?: boolean; nghieng?: boolean; co?: number } = {}) =>
    new TextRun({
        text,
        font: FONT,
        bold: opts.dam,
        italics: opts.nghieng,
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

const oO = (
    text: string,
    opts: { dam?: boolean; canTrai?: boolean; rong?: number; columnSpan?: number } = {}
) =>
    new TableCell({
        width: opts.rong !== undefined ? { size: opts.rong, type: WidthType.PERCENTAGE } : undefined,
        columnSpan: opts.columnSpan,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [
            new Paragraph({
                alignment: opts.canTrai ? AlignmentType.LEFT : AlignmentType.CENTER,
                children: [oChu(text, { dam: opts.dam, co: 22 })],
            }),
        ],
    });

const ngayHienThi = (d?: string): string => (d ? dayjs(d).format("DD/MM/YYYY") : "........................");

const hienThiGiaTri = (v?: number | null): string =>
    v === undefined || v === null ? "--" : v.toLocaleString("vi-VN");

const giaTriODoiTuong = (dong: Phieu4DongModel, nhaThauId: number): number | undefined | null =>
    dong.giaTri.find(g => g.nhaThauId === nhaThauId)?.giaTri;

// ============================================================
// BẢNG "CỐ ĐỊNH" (Bảng 1/2) — port trực tiếp logic render của
// BangCoDinhTable.tsx sang docx (cùng 1 config, KHÔNG lặp lại/chép tay cấu
// trúc dòng ở đây, tránh lệch so với màn hình).
// ============================================================

const taoBangCoDinh = (
    config: BangCoDinhConfig,
    bang: Phieu4BangModel,
    cotNhaThau: { nhaThauId: number; ten: string }[]
): Table => {
    const soCotNhaThau = cotNhaThau.length;
    const RONG_STT = 6;
    const RONG_NOI_DUNG = 30;
    const RONG_DVT = 8;
    const rongNhaThau = soCotNhaThau > 0 ? Math.round((100 - RONG_STT - RONG_NOI_DUNG - RONG_DVT) / soCotNhaThau) : 0;

    const timDong = (nhomSo: number, stt: number): Phieu4DongModel | undefined =>
        bang.dong.find(d => d.nhomSo === nhomSo && d.stt === stt);

    const rows: TableRow[] = [
        // tableHeader: true — Word tự lặp lại dòng này ở đầu mỗi trang nếu
        // bảng (Bảng 1/2, dùng chung hàm này) bị ngắt trang giữa chừng.
        new TableRow({
            tableHeader: true,
            children: [
                oO("STT", { dam: true, rong: RONG_STT }),
                oO("Nội dung", { dam: true, rong: RONG_NOI_DUNG }),
                oO("ĐVT", { dam: true, rong: RONG_DVT }),
                ...cotNhaThau.map(c => oO(c.ten, { dam: true, rong: rongNhaThau })),
            ],
        }),
    ];

    config.nhom.forEach(nhom => {
        const dongCha = nhom.dongCha ? timDong(nhom.nhomSo, nhom.dongCha.stt) : undefined;
        const dongCon = nhom.dong
            .map(dc => ({ cfg: dc, dong: timDong(dc.nhomSo, dc.stt) }))
            .filter((x): x is { cfg: typeof nhom.dong[number]; dong: Phieu4DongModel } => !!x.dong);

        // Chỉ có dòng cha, không có tiêu chí con -> 1 dòng gộp duy nhất.
        if (nhom.dongCha && dongCon.length === 0) {
            if (!dongCha) return;
            rows.push(new TableRow({
                children: [
                    oO(nhom.soLaMa, { dam: true }),
                    oO(nhom.nhanNhom, { dam: true, canTrai: true }),
                    oO(dongCha.dvt ?? ""),
                    ...cotNhaThau.map(c => oO(hienThiGiaTri(giaTriODoiTuong(dongCha, c.nhaThauId)))),
                ],
            }));
            return;
        }

        // Không có dòng cha lẫn tiêu chí con hợp lệ -> bỏ qua cả nhóm.
        if (dongCon.length === 0) return;

        if (dongCha) {
            // Dòng cha CŨNG nhập được — hiện giá trị thật thay vì nhãn/tổng suông.
            rows.push(new TableRow({
                children: [
                    oO(nhom.soLaMa, { dam: true }),
                    oO(nhom.nhanNhom, { dam: true, canTrai: true }),
                    oO(dongCha.dvt ?? ""),
                    ...cotNhaThau.map(c => oO(hienThiGiaTri(giaTriODoiTuong(dongCha, c.nhaThauId)))),
                ],
            }));
        } else if (nhom.coDongTongTrenHeader) {
            rows.push(new TableRow({
                children: [
                    oO(nhom.soLaMa, { dam: true }),
                    oO(nhom.nhanNhom, { dam: true, canTrai: true }),
                    oO(""),
                    ...cotNhaThau.map(c => {
                        let tong: number | null = null;
                        dongCon.forEach(({ dong }) => {
                            const v = giaTriODoiTuong(dong, c.nhaThauId);
                            if (v !== undefined && v !== null) tong = (tong ?? 0) + v;
                        });
                        return oO(hienThiGiaTri(tong));
                    }),
                ],
            }));
        } else {
            rows.push(new TableRow({
                children: [
                    oO(nhom.soLaMa, { dam: true }),
                    oO(nhom.nhanNhom, { dam: true, canTrai: true, columnSpan: 2 + soCotNhaThau }),
                ],
            }));
        }

        dongCon.forEach(({ cfg, dong }, idx) => {
            rows.push(new TableRow({
                children: [
                    oO(String(idx + 1)),
                    oO(cfg.label || dong.noiDung || ""),
                    oO(dong.dvt ?? ""),
                    ...cotNhaThau.map(c => oO(hienThiGiaTri(giaTriODoiTuong(dong, c.nhaThauId)))),
                ],
            }));
        });
    });

    return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: VIEN_BANG, rows });
};

// ============================================================
// THAM SỐ ĐẦU VÀO — lấy thẳng từ state đang hiển thị trên Phieu4FormPage.tsx
// (không gọi lại API) để đảm bảo xuất đúng những gì người dùng đang thấy.
// ============================================================

export interface XuatWordPhieu4ChuKy {
    tenBuoc?: string;
    buocThuTu: number;
    trangThai: string; // CHO_KY, DA_DUYET, TU_CHOI
    ghiChu?: string;
    ngayKy?: string;
}

export interface XuatWordPhieu4Params {
    soHieu?: string;
    ngayLap?: string; // NgayTao của phiếu — hiện "Quảng Ngãi, ngày ... tháng ... năm ..." trên chuKyTable
    tuNgay?: string;
    denNgay?: string;
    cotNhaThau: { nhaThauId: number; ten: string }[];
    bang1?: Phieu4BangModel;
    bang2?: Phieu4BangModel;
    chuKy: XuatWordPhieu4ChuKy[];
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

// Thông tin biểu mẫu (số biểu mẫu/ngày hiệu lực/lần sửa đổi) của Phiếu 4 —
// lấy từ config/phieuHeaderInfo.json, cùng nguồn với PhieuHeader.tsx trên
// màn hình, để khớp cứng theo đúng layout PhieuHeader khi xuất Word.
const THONG_TIN_BIEU_MAU_PHIEU4 = (phieuHeaderInfo as Record<string, {
    soBieuMau: string;
    ngayHieuLuc: string;
    lanSuaDoi: string;
}>).PHIEU4;

export const xuatWordPhieu4 = async (params: XuatWordPhieu4Params): Promise<void> => {
    const { soHieu, ngayLap, tuNgay, denNgay, cotNhaThau, bang1, bang2, chuKy } = params;

    // ---- Chữ ký ---- table 3 cột không viền: P.ĐN | P.ATMT (bước 1, ký song
    // song) | BGĐ (bước 2) — nhãn cột khớp cứng theo yêu cầu, không lấy
    // tenBuoc động từ MauLuongKy vì Admin có thể đặt tên bước khác đi (giống
    // cách làm ở xuatWordPhieu3.ts). Phần mềm không còn luồng ký nội bộ (ký
    // diễn ra bên ngoài trên bản in) nên "chuKy" thường rỗng — mặc định hiện
    // placeholder "(Ký, ghi rõ họ tên)".
    const buoc1 = chuKy.filter(b => b.buocThuTu === 1);
    const buocPdn = buoc1.find(b => !(b.tenBuoc ?? "").toUpperCase().includes("ATMT")) ?? buoc1[0];
    const buocAtmt = buoc1.find(b => (b.tenBuoc ?? "").toUpperCase().includes("ATMT")) ?? buoc1[1];
    const buocBgd = chuKy.find(b => b.buocThuTu === 2) ?? chuKy[2];

    const trangThaiChuKyDoan = (buoc?: XuatWordPhieu4ChuKy) =>
        oDoan(trangThaiChuKyHienThi(buoc?.trangThai ?? "", buoc?.ghiChu), { canGiua: true });

    const chuKyTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: TableBorders.NONE,
        rows: [
            new TableRow({
                children: [
                    new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, children: [new Paragraph({})] }),
                    new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, children: [new Paragraph({})] }),
                    new TableCell({
                        width: { size: 33, type: WidthType.PERCENTAGE },
                        children: [oDoan(ngayLapHienThi(ngayLap), { nghieng: true, canGiua: true })],
                    }),
                ],
            }),
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 34, type: WidthType.PERCENTAGE },
                        children: [
                            oDoan("P.ĐN", { dam: true, canGiua: true, canhSau: 40 }),
                            trangThaiChuKyDoan(buocPdn),
                        ],
                    }),
                    new TableCell({
                        width: { size: 33, type: WidthType.PERCENTAGE },
                        children: [
                            oDoan("P.ATMT", { dam: true, canGiua: true, canhSau: 40 }),
                            trangThaiChuKyDoan(buocAtmt),
                        ],
                    }),
                    new TableCell({
                        width: { size: 33, type: WidthType.PERCENTAGE },
                        children: [
                            oDoan("BAN GIÁM ĐỐC", { dam: true, canGiua: true, canhSau: 40 }),
                            trangThaiChuKyDoan(buocBgd),
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
                                children: [oChu(THONG_TIN_BIEU_MAU_PHIEU4?.soBieuMau ?? "", { co: 22, dam: true })],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [oChu(`Ngày hiệu lực: ${THONG_TIN_BIEU_MAU_PHIEU4?.ngayHieuLuc ?? ""}`, { nghieng: true, co: 22, dam: true })],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [oChu(`Lần sửa đổi: ${THONG_TIN_BIEU_MAU_PHIEU4?.lanSuaDoi ?? ""}`, { nghieng: true, co: 22, dam: true })],
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
                    // oDoan(`Số: ${soHieu || "........................"}`, { co: 22, canhTruoc: 100, canhSau: 100 }),
                    oDoan("BẢNG TỔNG HỢP ĐÁNH GIÁ & PHÂN BỔ SUẤT ĂN", { dam: true, canGiua: true, co: CO_CHU_TIEU_DE, canhSau: 200 }),

                    oDoan(`Khoảng thời gian: ${ngayHienThi(tuNgay)} — ${ngayHienThi(denNgay)}`, { canhSau: 200, dam: true, canGiua: true }),

                    ...(bang1
                        ? [
                            oDoan(bang1.tenBang || "Bảng 1", { dam: true, canhSau: 80 }),
                            oDoan(
                                `Theo dữ liệu đánh giá chất lượng dịch vụ suất ăn công nghiệp trên phần mềm từ ngày ${ngayHienThi(tuNgay)} đến ngày ${ngayHienThi(denNgay)}, kết quả đánh giá từ CBNV như sau:`,
                                { canhSau: 80 }
                            ),
                            taoBangCoDinh(PHIEU4_BANG1_CONFIG, bang1, cotNhaThau),
                        ]
                        : []),

                    ...(bang2
                        ? [
                            oDoan(bang2.tenBang || "Bảng 2", { dam: true, canhTruoc: 200, canhSau: 80 }),
                            oDoan(
                                `Qua kiểm tra thực tế về tình hình phục vụ của các Nhà thầu từ ngày ${ngayHienThi(tuNgay)} đến ngày ${ngayHienThi(denNgay)}, các phòng ban chức năng đánh giá chất lượng dịch vụ của Nhà thầu như sau:`,
                                { canhSau: 80 }
                            ),
                            taoBangCoDinh(PHIEU4_BANG2_CONFIG, bang2, cotNhaThau),
                        ]
                        : []),

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
    const tuNgayFmt = tuNgay ? dayjs(tuNgay).format("DDMMYYYY") : "";
    const denNgayFmt = denNgay ? dayjs(denNgay).format("DDMMYYYY") : "";
    const tenFile = `BangTongHop_Phieu4_${tuNgayFmt}-${denNgayFmt}_${(soHieu || "").replace(/[\\/:*?"<>|]/g, "-") || "chua-luu"}.docx`;
    saveAs(blob, tenFile);
};

export default xuatWordPhieu4;
