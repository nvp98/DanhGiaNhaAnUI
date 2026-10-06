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
import { saveAs } from "file-saver";
import logoPdf from "../assets/images/LogoPDF.png";
import phieuHeaderInfo from "../config/phieuHeaderInfo.json";
import {
    ANH_MINH_CHUNG_CAO_TOI_DA,
    ANH_MINH_CHUNG_CAP_CAO_TOI_DA,
    ANH_MINH_CHUNG_CAP_RONG_TOI_DA,
    ANH_MINH_CHUNG_RONG_TOI_DA,
    type AnhDaTai,
    coGianAnh,
    layAnhChuKy,
    layAnhMinhChung,
} from "./anhWord";
import { docHtmlGhiChu, layDanhSachAnhTrongHtml } from "./ghiChuHtml";

// Xuất file .docx khớp đúng layout Phieu1FormPage.tsx (phiếu kiểm tra công
// tác VSATTP — Phiếu 1). Chạy hoàn toàn ở client (thư viện "docx"), không cần
// đổi backend. Ghi chú từng dòng/Kết luận là HTML do TinyMCE sinh ra — dịch
// sang Paragraph/TextRun giữ định dạng cơ bản (đậm/nghiêng/gạch chân/danh
// sách); ảnh <img> trong ghi chú KHÔNG dịch tại chỗ mà được gom lại và chèn
// dưới dạng ImageRun, tối đa 2 ảnh/hàng, xuống cuối văn bản (xem
// khoiAnhMinhChung bên dưới) — khác với xuatWordPhieu3.ts/4.ts vẫn bỏ qua
// hẳn ảnh trong ghi chú. Chữ ký đã duyệt cũng nhúng ảnh chữ ký thật
// (duongDanChuKy) nếu có, xem layAnhChuKy.

const FONT = "Times New Roman";
const CO_CHU = 26; // 13pt (đơn vị docx = half-point)
const CO_CHU_TIEU_DE = 30; // 14pt
// Cỡ chữ NỘI DUNG trong các ô bảng (header, nội dung tiêu chí, ghi chú) — nhỏ
// hơn CO_CHU để ghi chú không to hơn nội dung tiêu chí.
const CO_CHU_BANG = 24; // 12pt

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
    opts: { dam?: boolean; nghieng?: boolean; canGiua?: boolean; co?: number; canhTruoc?: number; canhSau?: number; sangTrangMoi?: boolean } = {}
) =>
    new Paragraph({
        alignment: opts.canGiua ? AlignmentType.CENTER : undefined,
        pageBreakBefore: opts.sangTrangMoi,
        spacing: { before: opts.canhTruoc ?? 0, after: opts.canhSau ?? 80 },
        children: [oChu(text, opts)],
    });

const oOBang = (
    noiDung: string | Paragraph[],
    opts: { dam?: boolean; canTrai?: boolean; columnSpan?: number; rowSpan?: number; width?: number } = {}
) =>
    new TableCell({
        columnSpan: opts.columnSpan,
        rowSpan: opts.rowSpan,
        width: opts.width !== undefined ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children:
            typeof noiDung === "string"
                ? [
                      new Paragraph({
                          alignment: opts.canTrai ? AlignmentType.LEFT : AlignmentType.CENTER,
                          children: [oChu(noiDung, { dam: opts.dam, co: CO_CHU_BANG })],
                      }),
                  ]
                : noiDung,
    });

// ============================================================
// DỊCH HTML (TinyMCE) -> Paragraph[] — đọc HTML qua docHtmlGhiChu (dùng
// chung với xuất PDF, xem ghiChuHtml.ts) rồi dựng Paragraph/TextRun.
// ============================================================

// Ghi chú rỗng -> 1 đoạn trống (ô bảng bắt buộc có ít nhất 1 Paragraph), không hiện gì.
// Mặc định dùng CO_CHU_BANG để khớp cỡ chữ nội dung tiêu chí trong bảng.
const dichHtmlSangDoan = (html?: string, co: number = CO_CHU_BANG): Paragraph[] => {
    const doanVan = docHtmlGhiChu(html);
    if (doanVan.length === 0) return [new Paragraph({})];

    return doanVan.map(
        doan =>
            new Paragraph({
                children: [
                    ...(doan.laMuc ? [oChu("• ", { co })] : []),
                    ...doan.runs.map(r => (r.xuongDong ? new TextRun({ text: "", break: 1, size: co }) : oChu(r.text, { ...r, co }))),
                ],
                spacing: { after: doan.laMuc ? 40 : 60 },
                indent: doan.laMuc ? { left: 360 } : undefined,
            })
    );
};

// ============================================================
// THAM SỐ ĐẦU VÀO — lấy thẳng từ state đang hiển thị trên Phieu1FormPage.tsx
// (không gọi lại API) để đảm bảo xuất đúng những gì người dùng đang thấy.
// ============================================================

export interface XuatWordPhieu1ChuKy {
    tenBuoc?: string;
    trangThai: string; // CHO_KY, DA_DUYET, TU_CHOI
    ghiChu?: string;
    ngayKy?: string;
    // Họ tên người đã ký + đường dẫn ảnh chữ ký ĐANG SỬ DỤNG của họ tại thời
    // điểm ký (nếu có) — cùng dữ liệu ChuKyPhieuModel dùng để render khối chữ
    // ký trên màn hình, xem PhieuSignatures.tsx. Nhà thầu không quản lý ảnh
    // chữ ký trong hệ thống nên duongDanChuKy luôn rỗng với họ -> vẫn fallback
    // về tick √ như nội bộ chưa từng upload ảnh.
    nguoiKyHoTen?: string;
    duongDanChuKy?: string;
}

export interface XuatWordPhieu1Dong {
    tt: string; // đã format sẵn ("1.1", "2", ...) — xem Phieu1FormPage.tsx
    noiDung: string;
    ketQua?: string; // DAT | KHONG_DAT
    ghiChuHtml?: string;
}

export interface XuatWordPhieu1Nhom {
    soNhom: number;
    tenNhom: string;
    dong: XuatWordPhieu1Dong[];
}

export interface XuatWordPhieu1Params {
    soHieu?: string;
    ngayLap?: string; // NgayTao của phiếu — hiện "Quảng Ngãi, ngày ... tháng ... năm ..." trên chuKyTable
    tenBepAn: string;
    tenNhaThau: string;
    ngayKiemTra: string; // đã format "DD/MM/YYYY"
    nhomVaDong: XuatWordPhieu1Nhom[];
    dongKhongNhom: XuatWordPhieu1Dong[];
    ketLuan: {
        soDat: number;
        tongSo: number;
        tyLe: number | null;
        ketLuan: string | null; // DAT | KHONG_DAT | null
        diem: number | null;
        ghiChuHtml: string;
    };
    chuKy: XuatWordPhieu1ChuKy[];
}

const trangThaiChuKyHienThi = (trangThai: string, ghiChu?: string): string => {
    switch (trangThai) {
        case "TU_CHOI": return `Từ chối${ghiChu ? ": " + ghiChu : ""}`;
        default: return "";
    }
};

// Cùng màu xanh với icon √ (FaCheckCircle) hiện trên màn hình khi đã ký —
// xem .chu-ky-icon-wrap trong _phieu-base.scss.
const MAU_XANH_DA_KY = "16A34A";

// ============================================================
// ẢNH (chữ ký thật + ảnh minh chứng dán trong ghi chú) — tải + thu nhỏ
// trước khi build Document (docx cần biết width/height cụ thể lúc tạo
// ImageRun), xem anhWord.ts.
// ============================================================

// Chiều rộng vùng in A4 (11906 twip) trừ lề mặc định 1440 twip mỗi bên —
// chia đôi cho 2 cột bảng ảnh; khai báo columnWidths để ô gộp (columnSpan: 2)
// của ảnh lẻ vẫn đúng lưới kể cả khi bảng chỉ có 1 hàng đó (phiếu có 1 ảnh).
const RONG_COT_ANH_MINH_CHUNG = Math.floor((11906 - 1440 * 2) / 2);

// 1 ô ảnh minh chứng: ảnh + chú thích "Hình i" bên dưới. Căn đáy để chú
// thích 2 ảnh cùng hàng (khác chiều cao) vẫn thẳng hàng nhau.
const oAnhMinhChung = (anh: AnhDaTai, soThuTu: number, columnSpan?: number) =>
    new TableCell({
        columnSpan,
        width: { size: columnSpan ? 100 : 50, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.BOTTOM,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [new ImageRun({ type: anh.type, data: anh.data, transformation: { width: anh.rong, height: anh.cao } })],
            }),
            oDoan(`Hình ${soThuTu}`, { canGiua: true, nghieng: true, canhSau: 200 }),
        ],
    });

// Xếp ảnh minh chứng thành bảng không viền, tối đa 2 ảnh/hàng theo đúng thứ
// tự: số ảnh chẵn -> toàn bộ đi cặp; số ảnh lẻ -> ảnh CUỐI nằm riêng 1 hàng
// (gộp 2 cột), to hơn ảnh đi cặp. VD 3 ảnh: [1][2] / [ 3 ].
const taoBangAnhMinhChung = (dsAnh: AnhDaTai[]): Table => {
    const hang: TableRow[] = [];
    for (let i = 0; i < dsAnh.length; i += 2) {
        const anhTrai = dsAnh[i];
        const anhPhai = dsAnh[i + 1];
        hang.push(
            new TableRow({
                cantSplit: true, // không cắt ngang ảnh qua 2 trang
                children: anhPhai
                    ? [
                          oAnhMinhChung(coGianAnh(anhTrai, ANH_MINH_CHUNG_CAP_CAO_TOI_DA, ANH_MINH_CHUNG_CAP_RONG_TOI_DA), i + 1),
                          oAnhMinhChung(coGianAnh(anhPhai, ANH_MINH_CHUNG_CAP_CAO_TOI_DA, ANH_MINH_CHUNG_CAP_RONG_TOI_DA), i + 2),
                      ]
                    : [oAnhMinhChung(coGianAnh(anhTrai, ANH_MINH_CHUNG_CAO_TOI_DA, ANH_MINH_CHUNG_RONG_TOI_DA), i + 1, 2)],
            })
        );
    }
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [RONG_COT_ANH_MINH_CHUNG, RONG_COT_ANH_MINH_CHUNG],
        borders: TableBorders.NONE,
        rows: hang,
    });
};

// "Quảng Ngãi, ngày ... tháng ... năm ..." trên chuKyTable — lấy theo ngày
// lập phiếu (NgayTao), không phải ngày xuất Word.
// const ngayLapHienThi = (ngayLap?: string): string => {
//     const d = ngayLap ? dayjs(ngayLap) : dayjs();
//     return `Quảng Ngãi, ngày ${d.format("DD")} tháng ${d.format("MM")} năm ${d.format("YYYY")}`;
// };

// Ảnh logo gốc 756x309px — giữ đúng tỉ lệ khi thu nhỏ cho khớp
// .phieu-header-logo (xem PhieuHeader.tsx / _phieu-base.scss).
const LOGO_CAO = 70;
const LOGO_RONG = Math.round(LOGO_CAO * (756 / 309));

// Thông tin biểu mẫu (số biểu mẫu/ngày hiệu lực/lần sửa đổi) của Phiếu 1 —
// lấy từ config/phieuHeaderInfo.json, cùng nguồn với PhieuHeader.tsx trên
// màn hình, để khớp cứng theo đúng layout PhieuHeader khi xuất Word.
const THONG_TIN_BIEU_MAU_PHIEU1 = (phieuHeaderInfo as Record<string, {
    soBieuMau: string;
    ngayHieuLuc: string;
    lanSuaDoi: string;
}>).PHIEU1;

// Dựng file .docx + tên file gốc (không đuôi).
const taoBlobDocxPhieu1 = async (params: XuatWordPhieu1Params): Promise<{ blob: Blob; tenGoc: string }> => {
    const {
        soHieu, tenBepAn, tenNhaThau, ngayKiemTra,
        nhomVaDong, dongKhongNhom, ketLuan, chuKy,
    } = params;

    //  Bảng checklist "1. Thực trạng đánh giá" 
    const dongChecklist = (dong: XuatWordPhieu1Dong) =>
        new TableRow({
            children: [
                oOBang(dong.tt, { width: 6 }),
                oOBang(dong.noiDung, { canTrai: true, width: 44 }),
                oOBang(dong.ketQua === "DAT" ? "✓" : "", { width: 12 }),
                oOBang(dong.ketQua === "KHONG_DAT" ? "✓" : "", { width: 12 }),
                oOBang(dichHtmlSangDoan(dong.ghiChuHtml), { canTrai: true, width: 26 }),
            ],
        });

    const checklistRows: TableRow[] = [
        // Dòng tiêu đề cột — tableHeader: true để Word tự lặp lại ở đầu mỗi
        // trang nếu bảng bị ngắt trang giữa chừng.
        new TableRow({
            tableHeader: true,
            children: [
                oOBang("TT", { dam: true, width: 6 }),
                oOBang("Nội dung đánh giá", { dam: true, width: 44 }),
                oOBang("Đạt", { dam: true, width: 12 }),
                oOBang("Không đạt", { dam: true, width: 12 }),
                oOBang("Ghi chú", { dam: true, width: 26 }),
            ],
        }),
    ];
    nhomVaDong.forEach(({ soNhom, tenNhom, dong }) => {
        checklistRows.push(
            new TableRow({
                children: [oOBang(`${soNhom}. ${tenNhom}`, { dam: true, canTrai: true, columnSpan: 5 })],
            })
        );
        dong.forEach(d => checklistRows.push(dongChecklist(d)));
    });
    if (dongKhongNhom.length > 0) {
        checklistRows.push(
            new TableRow({
                children: [oOBang("Các nội dung khác", { dam: true, canTrai: true, columnSpan: 5 })],
            })
        );
        dongKhongNhom.forEach(d => checklistRows.push(dongChecklist(d)));
    }

    // -- Bảng "2. Kết luận" 
    const phanTramHienThi = (v: number | null) =>
        v === null ? "" : v.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const diemHienThi = (v: number | null) =>
        v === null ? "" : v.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const ketLuanHienThi = (v: string | null) => (v === "DAT" ? "Đạt" : v === "KHONG_DAT" ? "Không đạt" : "");

    const ketLuanRows: TableRow[] = [
        new TableRow({
            tableHeader: true,
            children: [
                oOBang("TT", { dam: true }),
                oOBang("Số lượng tiêu chí đạt", { dam: true }),
                oOBang("Tổng số lượng tiêu chí đánh giá", { dam: true }),
                oOBang("Tỷ lệ % tiêu chí đạt", { dam: true }),
                oOBang("Kết luận", { dam: true }),
                oOBang("Điểm đánh giá", { dam: true }),
                oOBang("Ghi chú", { dam: true }),
            ],
        }),
        new TableRow({
            children: [
                oOBang("1"),
                oOBang(String(ketLuan.soDat)),
                oOBang(String(ketLuan.tongSo)),
                oOBang(phanTramHienThi(ketLuan.tyLe)),
                oOBang(ketLuanHienThi(ketLuan.ketLuan)),
                oOBang(diemHienThi(ketLuan.diem)),
                oOBang(dichHtmlSangDoan(ketLuan.ghiChuHtml), { canTrai: true }),
            ],
        }),
    ];

    //  Chữ ký  số cột ĐỘNG theo luồng ký thật đang cấu hình (Admin có
    // thể đặt tên bước/số bước khác nhau cho Phiếu 1, không hard-code như
    // Phiếu 3/4 — xem PhieuSignatures.tsx render động cùng dữ liệu này).
    const soBuoc = Math.max(chuKy.length, 1);
    const rongCot = Math.round(100 / soBuoc);

    // Ảnh minh chứng dán trong các ô ghi chú (checklist + kết luận): gom src
    // ĐÚNG THỨ TỰ xuất hiện trên phiếu — từng nhóm/dòng checklist (theo đúng
    // thứ tự nhomVaDong -> dongKhongNhom, y hệt thứ tự bảng "1. Thực trạng
    // đánh giá" ở trên), rồi tới ghi chú Kết luận — sau đó xếp tối đa 2
    // ảnh/hàng xuống cuối văn bản, đúng thứ tự đã gom (xem taoBangAnhMinhChung).
    const anhMinhChungSrc: string[] = [
        ...nhomVaDong.flatMap(({ dong }) => dong.flatMap(d => layDanhSachAnhTrongHtml(d.ghiChuHtml))),
        ...dongKhongNhom.flatMap(d => layDanhSachAnhTrongHtml(d.ghiChuHtml)),
        ...layDanhSachAnhTrongHtml(ketLuan.ghiChuHtml),
    ];

    // Tải trước TOÀN BỘ ảnh (chữ ký thật của từng bước ĐÃ DUYỆT, ảnh minh
    // chứng, logo) SONG SONG — phải xong trước khi build bảng vì docx cần
    // width/height cụ thể lúc tạo ImageRun.
    const [anhChuKyDanhSach, anhMinhChungKetQua, logoBuffer] = await Promise.all([
        Promise.all(chuKy.map(b => layAnhChuKy(b.duongDanChuKy))),
        Promise.all(anhMinhChungSrc.map(layAnhMinhChung)),
        fetch(logoPdf).then(r => r.arrayBuffer()),
    ]);
    const anhMinhChungDaTai = anhMinhChungKetQua.filter((anh): anh is AnhDaTai => anh !== null);

    // Đã ký: ưu tiên ảnh chữ ký thật (đang sử dụng tại thời điểm ký), fallback
    // tick xanh (✓) khi không có ảnh (nhà thầu, hoặc nội bộ chưa từng upload)
    // — khớp đúng logic hiển thị của PhieuSignatures.tsx. Kèm tên người ký
    // bên dưới, giống màn hình.
    const trangThaiChuKyDoan = (buoc?: XuatWordPhieu1ChuKy, anh?: AnhDaTai | null): Paragraph[] => {
        if (buoc?.trangThai === "DA_DUYET") {
            const dongAnh = anh
                ? new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 40 },
                      children: [new ImageRun({ type: anh.type, data: anh.data, transformation: { width: anh.rong, height: anh.cao } })],
                  })
                : new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 40 },
                      children: [new TextRun({ text: "✓", font: FONT, size: 40, bold: true, color: MAU_XANH_DA_KY })],
                  });
            return [dongAnh, oDoan(buoc.nguoiKyHoTen || "(đã ký)", { canGiua: true })];
        }
        return [oDoan(trangThaiChuKyHienThi(buoc?.trangThai ?? "", buoc?.ghiChu), { canGiua: true })];
    };

    const chuKyTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: TableBorders.NONE,
        rows: [
            new TableRow({
                children: chuKy.map(() =>
                    new TableCell({
                        width: { size: rongCot, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({})],
                    })
                ),
            }),
            new TableRow({
                children: (chuKy.length > 0 ? chuKy : [{ tenBuoc: "", trangThai: "CHO_KY" } as XuatWordPhieu1ChuKy]).map((buoc, i) =>
                    new TableCell({
                        width: { size: rongCot, type: WidthType.PERCENTAGE },
                        children: [
                            oDoan(buoc.tenBuoc || "", { dam: true, canGiua: true, canhSau: 40 }),
                            ...trangThaiChuKyDoan(buoc, anhChuKyDanhSach[i]),
                        ],
                    })
                ),
            }),
        ],
    });

    // Khối ảnh luôn bắt đầu ở trang mới, tách hẳn khỏi phần biểu mẫu phía trên.
    const khoiAnhMinhChung: (Paragraph | Table)[] =
        anhMinhChungDaTai.length > 0
            ? [
                  oDoan("Hình ảnh minh chứng", { dam: true, canhSau: 100, sangTrangMoi: true }),
                  taoBangAnhMinhChung(anhMinhChungDaTai),
              ]
            : [];

    //  Header (logo + thông tin biểu mẫu)
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
                                children: [oChu(THONG_TIN_BIEU_MAU_PHIEU1?.soBieuMau ?? "", { co: 22, dam: true })],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [oChu(`Ngày hiệu lực: `, { nghieng: true, co: 22, dam: true }), oChu(`${THONG_TIN_BIEU_MAU_PHIEU1?.ngayHieuLuc ?? ""}`, { co: 22, dam: true })],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [oChu(`Lần sửa đổi: `, { nghieng: true, co: 22, dam: true }), oChu(`${THONG_TIN_BIEU_MAU_PHIEU1?.lanSuaDoi ?? ""}`, { co: 22, dam: true })],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    // Số trang góc dưới-phải mỗi trang.
    const footer = new Footer({
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    oChu(""),
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
                    oDoan("PHIẾU KIỂM TRA CÔNG TÁC VSATTP", { dam: true, canGiua: true, co: CO_CHU_TIEU_DE, canhSau: 0 }),
                    oDoan(`TẠI BẾP ĂN ${tenBepAn?.toLocaleUpperCase("vi-VN") ||"........................"}`, { dam: true, canGiua: true, co: CO_CHU_TIEU_DE, canhSau: 200 }),

                    oDoan(`Nhà thầu: ${tenNhaThau || "........................"}`, { dam: true, canGiua: true }),
                    oDoan(`Ngày kiểm tra: ${ngayKiemTra}`, { canhSau: 200, dam: true, canGiua: true }),

                    oDoan("1. Thực trạng đánh giá", { dam: true, canhSau: 100 }),
                    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: VIEN_BANG, rows: checklistRows }),

                    oDoan("2. Kết luận", { dam: true, canhTruoc: 200, canhSau: 100 }),
                    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: VIEN_BANG, rows: ketLuanRows }),

                    oDoan("Quy ước:", { dam: true, canhTruoc: 200, canhSau: 40 }),
                    new Paragraph({
                        spacing: { after: 40 },
                        children: [
                            oChu("- Trường hợp tỷ lệ % tiêu chí đạt < "),
                            oChu("50%", { dam: true }),
                            oChu(", kết luận kết quả đánh giá "),
                            oChu("KHÔNG ĐẠT", { dam: true }),
                            oChu(". Điểm đánh giá = "),
                            oChu("0", { dam: true }),
                            oChu(" điểm."),
                        ],
                    }),
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            oChu("- Trường hợp tỷ lệ % tiêu chí đạt ≥ "),
                            oChu("50%", { dam: true }),
                            oChu(", kết luận kết quả đánh giá "),
                            oChu("ĐẠT", { dam: true }),
                            oChu(". Điểm đánh giá = Tỷ lệ % tiêu chí đạt *5."),
                        ],
                    }),

                    chuKyTable,

                    ...khoiAnhMinhChung,
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
    const tenGoc = `Phieu1_${ngayKiemTra.replace(/\//g, "")}_${(soHieu || "").replace(/[\\/:*?"<>|]/g, "-") || "chua-luu"}`;
    return { blob, tenGoc };
};

export const xuatWordPhieu1 = async (params: XuatWordPhieu1Params): Promise<void> => {
    const { blob, tenGoc } = await taoBlobDocxPhieu1(params);
    saveAs(blob, `${tenGoc}.docx`);
};

export default xuatWordPhieu1;
