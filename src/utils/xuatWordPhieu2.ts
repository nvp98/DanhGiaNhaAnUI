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
    TableLayoutType,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
} from "docx";
import dayjs from "dayjs";
import { saveAs } from "file-saver";
import logoPdf from "../assets/images/LogoPDF.png";
import phieuHeaderInfo from "../config/phieuHeaderInfo.json";
import { ApiRootV2 } from "../services/LinkServerV2";

// Xuất file .docx khớp đúng layout Phieu2FormPage.tsx (phiếu đánh giá chất
// lượng dịch vụ suất ăn — Phiếu 2), theo đúng cách làm của xuatWordPhieu1.ts.
// Chạy hoàn toàn ở client (thư viện "docx"), không cần đổi backend. Ghi chú
// "Không đạt"/Ý kiến nhà thầu là HTML do TinyMCE sinh ra — dịch sang
// Paragraph/TextRun giữ định dạng cơ bản (đậm/nghiêng/gạch chân/danh sách);
// ảnh <img> trong ghi chú KHÔNG dịch tại chỗ mà được gom lại và chèn dưới
// dạng ImageRun, tối đa 2 ảnh/hàng, xuống cuối văn bản (xem khoiAnhMinhChung
// bên dưới) — khác với xuatWordPhieu3.ts/4.ts vẫn bỏ qua hẳn ảnh trong ghi
// chú. Chữ ký đã duyệt cũng nhúng ảnh chữ ký thật (duongDanChuKy) nếu có,
// xem layAnhChuKy.

const FONT = "Times New Roman";
// Cỡ chữ văn bản thường/tiêu đề/ghi chú cuối phiếu được hạ xuống cho cân với
// bảng đánh giá (CO_CHU_BANG 8pt) — để 13pt/14pt như Phiếu 1 thì phần ngoài
// bảng trông to chênh lệch hẳn so với bảng.
const CO_CHU = 20; // 10pt (đơn vị docx = half-point)
const CO_CHU_TIEU_DE = 24; // 12pt
const CO_CHU_GHI_CHU = 18; // 9pt — khối "Ghi chú:" cuối phiếu
// Bảng đánh giá của Phiếu 2 có tới 12 cột (2 cột cố định + 5 tiêu chí ×
// Đạt/K-Đạt) — dùng cỡ chữ nhỏ hơn văn bản thường (CO_CHU) riêng cho NỘI
// DUNG bảng (header lẫn dòng dữ liệu) để cột không bị quá hẹp/xuống dòng xấu.
const CO_CHU_BANG = 16; // 8pt

// Khổ A4 dọc, lề hẹp (= "Narrow" của Word, 1,27cm) thay vì lề mặc định
// 2,54cm của docx — nới rộng vùng in cho bảng đánh giá nhiều cột. Đơn vị twip
// (1/1440 inch).
const RONG_TRANG_A4 = 11906;
const LE_TRANG = 720;
const RONG_VUNG_IN = RONG_TRANG_A4 - LE_TRANG * 2;

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
        // width tính bằng twip (DXA), khớp columnWidths của bảng đánh giá — xem bangRows.
        width: opts.width !== undefined ? { size: opts.width, type: WidthType.DXA } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 60, right: 60 },
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
// DỊCH HTML (TinyMCE) -> Paragraph[] — giữ đậm/nghiêng/gạch chân/danh sách.
// KHÔNG dịch ảnh (<img>) tại chỗ — ảnh được gom riêng (layDanhSachAnhTrongHtml)
// và chèn ở khối "Hình ảnh minh chứng" cuối văn bản, xem khoiAnhMinhChung.
// ============================================================

interface KieuChu {
    dam?: boolean;
    nghieng?: boolean;
    gachChan?: boolean;
}

const layTextRunsTuNode = (node: Node, ke: KieuChu, co?: number): TextRun[] => {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? "";
        return text ? [oChu(text, { ...ke, co })] : [];
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
    return Array.from(el.childNodes).flatMap(con => layTextRunsTuNode(con, keMoi, co));
};

// `co` — cỡ chữ riêng cho nội dung dịch ra (mặc định CO_CHU của văn bản
// thường) — dùng CO_CHU_BANG khi gọi cho ô "Ghi chú" trong bảng đánh giá
// (nhiều cột, xem bangRows) để khớp cỡ chữ với phần còn lại của bảng.
const dichHtmlSangDoan = (html?: string, rongKhi?: string, co?: number): Paragraph[] => {
    if (!html || !html.trim()) return [new Paragraph({ children: [oChu(rongKhi ?? "", { co })] })];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const ketQua: Paragraph[] = [];

    const xuLyKhoi = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) ketQua.push(new Paragraph({ children: [oChu(text, { co })], spacing: { after: 60 } }));
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();

        if (tag === "img") return; // bỏ qua ảnh
        if (tag === "ul" || tag === "ol") {
            Array.from(el.children).forEach(li => {
                const runs = Array.from(li.childNodes).flatMap(con => layTextRunsTuNode(con, {}, co));
                ketQua.push(
                    new Paragraph({
                        children: [oChu("• ", { co }), ...runs],
                        spacing: { after: 40 },
                        indent: { left: 360 },
                    })
                );
            });
            return;
        }
        if (["p", "div", "h1", "h2", "h3", "h4", "li", "blockquote"].includes(tag)) {
            const runs = Array.from(el.childNodes).flatMap(con => layTextRunsTuNode(con, {}, co));
            if (runs.length > 0) {
                ketQua.push(new Paragraph({ children: runs, spacing: { after: 60 } }));
            }
            return;
        }
        if (tag === "table") return; // bảng lồng trong ghi chú — hiếm gặp, bỏ qua cho đơn giản

        const runs = layTextRunsTuNode(el, {}, co);
        if (runs.length > 0) ketQua.push(new Paragraph({ children: runs, spacing: { after: 60 } }));
    };

    Array.from(doc.body.childNodes).forEach(xuLyKhoi);

    return ketQua.length > 0 ? ketQua : [new Paragraph({ children: [oChu(rongKhi ?? "", { co })] })];
};

// ============================================================
// THAM SỐ ĐẦU VÀO — lấy thẳng từ state đang hiển thị trên Phieu2FormPage.tsx
// (không gọi lại API) để đảm bảo xuất đúng những gì người dùng đang thấy.
// ============================================================

export interface XuatWordPhieu2TieuChi {
    maTieuChi: string;
    tenTieuChi: string;
    dat: boolean;
    khongDat: boolean;
    diem?: number; // chỉ có ý nghĩa với VSATTP khi Đạt (xem Phieu2FormPage.tsx)
    ghiChuHtml?: string;
}

export interface XuatWordPhieu2ChuKy {
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

export interface XuatWordPhieu2Params {
    soHieu?: string;
    ngayLap?: string; // NgayTao của phiếu — hiện "Quảng Ngãi, ngày ... tháng ... năm ..." trên chuKyTable
    tenNhaThau: string;
    ngayKiemTra: string; // đã format "DD/MM/YYYY"
    thoiGianKiemTraText: string;
    viTriKiemTra: string;
    danhSachTieuChi: XuatWordPhieu2TieuChi[];
    yKienHtml: string;
    chuKy: XuatWordPhieu2ChuKy[];
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
// ẢNH (chữ ký thật + ảnh minh chứng dán trong ghi chú) — tải + đo kích thước
// trước khi build Document (docx cần biết width/height cụ thể lúc tạo
// ImageRun, không tự co giãn như CSS). Thu nhỏ giữ tỉ lệ theo max riêng của
// từng loại (xem ANH_KY_*/ANH_MINH_CHUNG_* bên dưới nơi dùng).
// ============================================================

interface AnhDaTai {
    data: ArrayBuffer;
    type: "png" | "jpg" | "gif" | "bmp";
    rong: number;
    cao: number;
}

const loaiAnhTheoDuongDan = (duongDan: string): "png" | "jpg" | "gif" | "bmp" => {
    const duoi = duongDan.split(/[.?#]/).filter(Boolean).pop()?.toLowerCase();
    if (duoi === "jpg" || duoi === "jpeg") return "jpg";
    if (duoi === "gif") return "gif";
    if (duoi === "bmp") return "bmp";
    return "png";
};

const layKichThuocAnh = (url: string): Promise<{ w: number; h: number }> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => reject(new Error("Không đọc được kích thước ảnh"));
        img.src = url;
    });

// null khi tải lỗi (file bị xóa khỏi server, mạng chập chờn...) — nơi gọi tự
// fallback (chữ ký -> tick √, ảnh minh chứng -> bỏ qua ảnh đó) chứ không chặn
// cả việc xuất Word vì 1 ảnh lỗi.
const taiAnhTheoUrl = async (url: string, caoToiDa: number, rongToiDa: number): Promise<AnhDaTai | null> => {
    try {
        const [data, kichThuoc] = await Promise.all([
            // cache: "no-store" — tránh trường hợp trình duyệt tái dùng response
            // đã cache từ 1 lần tải ảnh trước đó qua thẻ <img> (request "no-cors",
            // không cần header CORS); fetch() ("cors") dùng lại cache đó sẽ luôn bị
            // chặn vì thiếu Access-Control-Allow-Origin dù server đã bật CORS.
            fetch(url, { cache: "no-store" }).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.arrayBuffer();
            }),
            layKichThuocAnh(url),
        ]);
        const tiLe = Math.min(caoToiDa / kichThuoc.h, rongToiDa / kichThuoc.w, 1);
        return {
            data,
            type: loaiAnhTheoDuongDan(url),
            cao: Math.round(kichThuoc.h * tiLe),
            rong: Math.round(kichThuoc.w * tiLe),
        };
    } catch (err) {
        // Lỗi thường gặp: ảnh cũ bị đóng băng domain sai trong HTML đã lưu
        // (host nội bộ/thiếu prefix reverse-proxy — xem
        // migration_fix_duong_dan_anh_ckeditor.sql), ảnh đã bị xóa khỏi
        // server, hoặc mạng chập chờn. Log ra để dev/BA tra được vì sao 1 ảnh
        // cụ thể không lên được Word thay vì biến mất trong im lặng.
        console.warn(`[xuatWordPhieu2] Không tải được ảnh, bỏ qua: ${url}`, err);
        return null;
    }
};

// Khớp .chu-ky-anh { max-height: 70px } trên màn hình, kèm chặn rộng tối đa
// để chữ ký ngang quá khổ không đè sang cột bên cạnh.
const ANH_KY_CAO_TOI_DA = 70;
const ANH_KY_RONG_TOI_DA = 150;

const layAnhChuKy = (duongDanChuKy?: string): Promise<AnhDaTai | null> =>
    !duongDanChuKy ? Promise.resolve(null) : taiAnhTheoUrl(`${ApiRootV2}${duongDanChuKy}`, ANH_KY_CAO_TOI_DA, ANH_KY_RONG_TOI_DA);

// Ảnh minh chứng dán trong ghi chú (TinyMCE) — chụp hiện trường nên có thể
// rất lớn. Xếp tối đa 2 ảnh/hàng (xem taoBangAnhMinhChung): ảnh đi cặp bị
// chặn nhỏ (~1/2 khổ trang, chặn cả chiều cao để 2 ảnh cùng hàng không lệch
// nhau quá), ảnh LẺ cuối cùng nằm riêng 1 hàng nên được to hơn. Chỉ thu nhỏ,
// KHÔNG phóng to ảnh nhỏ — xem tiLe = min(..., 1) ở coGianAnh.
const ANH_MINH_CHUNG_CAO_TOI_DA = 500;
const ANH_MINH_CHUNG_RONG_TOI_DA = 500;
const ANH_MINH_CHUNG_CAP_CAO_TOI_DA = 220;
const ANH_MINH_CHUNG_CAP_RONG_TOI_DA = 280;

// Chiều rộng vùng in (RONG_VUNG_IN) chia đôi cho 2 cột bảng ảnh; khai báo
// columnWidths để ô gộp (columnSpan: 2) của ảnh lẻ vẫn đúng lưới kể cả khi
// bảng chỉ có 1 hàng đó (phiếu có 1 ảnh).
const RONG_COT_ANH_MINH_CHUNG = Math.floor(RONG_VUNG_IN / 2);

// src trong HTML ghi chú đã là URL TUYỆT ĐỐI (ghép sẵn ApiRootV2 lúc upload —
// xem TinyMceModal.tsx/TinyMceInline.tsx), khác với duongDanChuKy (tương đối)
// ở trên nên gọi thẳng taiAnhTheoUrl, không ghép thêm ApiRootV2. Giữ kích
// thước GỐC lúc tải — chỉ biết ảnh đi cặp hay nằm riêng sau khi gom đủ danh
// sách, lúc đó mới coGianAnh theo vị trí.
const layAnhMinhChung = (url: string): Promise<AnhDaTai | null> =>
    taiAnhTheoUrl(url, Infinity, Infinity);

const coGianAnh = (anh: AnhDaTai, caoToiDa: number, rongToiDa: number): AnhDaTai => {
    const tiLe = Math.min(caoToiDa / anh.cao, rongToiDa / anh.rong, 1);
    return { ...anh, cao: Math.round(anh.cao * tiLe), rong: Math.round(anh.rong * tiLe) };
};

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

// Lấy DANH SÁCH src ảnh trong 1 đoạn HTML ghi chú, ĐÚNG THỨ TỰ xuất hiện —
// dùng để gom toàn bộ ảnh minh chứng của phiếu (nhiều ô ghi chú khác nhau)
// theo đúng thứ tự đọc trên phiếu trước khi tải + chèn vào cuối file Word.
const layDanhSachAnhTrongHtml = (html?: string): string[] => {
    if (!html || !html.trim()) return [];
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("img"))
        .map(img => img.getAttribute("src"))
        .filter((src): src is string => !!src);
};

// "Quảng Ngãi, ngày ... tháng ... năm ..." trên chuKyTable — lấy theo ngày
// lập phiếu (NgayTao), không phải ngày xuất Word.
// const ngayLapHienThi = (ngayLap?: string): string => {
//     const d = ngayLap ? dayjs(ngayLap) : dayjs();
//     return `Quảng Ngãi, ngày ${d.format("DD")} tháng ${d.format("MM")} năm ${d.format("YYYY")}`;
// };

// Ảnh logo gốc 756x309px — giữ đúng tỉ lệ khi thu nhỏ cho khớp
// .phieu-header-logo (xem PhieuHeader.tsx / _phieu-base.scss).
const LOGO_CAO = 60;
const LOGO_RONG = Math.round(LOGO_CAO * (756 / 309));

// Thông tin biểu mẫu (số biểu mẫu/ngày hiệu lực/lần sửa đổi) của Phiếu 2 —
// lấy từ config/phieuHeaderInfo.json, cùng nguồn với PhieuHeader.tsx trên
// màn hình, để khớp cứng theo đúng layout PhieuHeader khi xuất Word.
const THONG_TIN_BIEU_MAU_PHIEU2 = (phieuHeaderInfo as Record<string, {
    soBieuMau: string;
    ngayHieuLuc: string;
    lanSuaDoi: string;
}>).PHIEU2;

// Dựng file .docx + tên file gốc (không đuôi).
const taoBlobDocxPhieu2 = async (params: XuatWordPhieu2Params): Promise<{ blob: Blob; tenGoc: string }> => {
    const {
        soHieu, ngayLap, tenNhaThau, ngayKiemTra, thoiGianKiemTraText, viTriKiemTra,
        danhSachTieuChi, yKienHtml, chuKy,
    } = params;

    // ---- Bảng đánh giá (1 dòng dữ liệu duy nhất, cột = tiêu chí × Đạt/K-Đạt) ----
    // Độ rộng cố định bằng twip (không dùng %, Word hay tự co giãn lại theo
    // nội dung). Thời gian kiểm tra ít chữ nhất ("Từ 16h30 đến 19h00") nên hẹp
    // nhất; cột Đạt chỉ chứa ✓ + điểm ("10,00đ") nên chỉ cần vừa đủ; phần còn
    // lại dồn hết cho K-Đạt vì chứa ghi chú dài — tránh cảnh mỗi chữ 1 dòng.
    const RONG_THOI_GIAN = 850;
    const RONG_VI_TRI = 1300;
    const RONG_DAT = 640;
    const rongMoiTieuChi = danhSachTieuChi.length > 0
        ? Math.floor((RONG_VUNG_IN - RONG_THOI_GIAN - RONG_VI_TRI) / danhSachTieuChi.length)
        : 0;
    const rongKhongDat = rongMoiTieuChi - RONG_DAT;
    const cotBangDanhGia = [
        RONG_THOI_GIAN,
        RONG_VI_TRI,
        ...danhSachTieuChi.flatMap(() => [RONG_DAT, rongKhongDat]),
    ];

    const soTieuChiDat = danhSachTieuChi.filter(tc => tc.dat).length;
    const soTieuChiKhongDat = danhSachTieuChi.filter(tc => tc.khongDat).length;
    const soTieuChiDaDanhGia = soTieuChiDat + soTieuChiKhongDat;

    const bangRows: TableRow[] = [
        new TableRow({
            tableHeader: true,
            children: [
                oOBang("Thời gian kiểm tra", { dam: true, rowSpan: 2, width: RONG_THOI_GIAN }),
                oOBang("Vị trí kiểm tra", { dam: true, rowSpan: 2, width: RONG_VI_TRI }),
                ...danhSachTieuChi.map(tc =>
                    oOBang(tc.tenTieuChi, { dam: true, columnSpan: 2, width: rongMoiTieuChi })
                ),
            ],
        }),
        new TableRow({
            tableHeader: true,
            children: danhSachTieuChi.flatMap(() => [
                oOBang("Đạt", { dam: true, width: RONG_DAT }),
                oOBang("K-Đạt", { dam: true, width: rongKhongDat }),
            ]),
        }),
        new TableRow({
            children: [
                oOBang(thoiGianKiemTraText || "", { canTrai: true, width: RONG_THOI_GIAN }),
                oOBang(viTriKiemTra || "", { canTrai: true, width: RONG_VI_TRI }),
                ...danhSachTieuChi.flatMap(tc => [
                    oOBang(
                        tc.dat
                            ? [
                                  new Paragraph({ alignment: AlignmentType.CENTER, children: [oChu("✓", { co: CO_CHU_BANG })] }),
                                  ...(tc.diem !== undefined && tc.diem !== null
                                      ? [
                                            new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [oChu(`${tc.diem.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}đ`, { co: CO_CHU_BANG })],
                                            }),
                                        ]
                                      : []),
                              ]
                            : "",
                        { width: RONG_DAT }
                    ),
                    oOBang(tc.khongDat ? [
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [oChu("✓", { co: CO_CHU_BANG })] }),
                        ...dichHtmlSangDoan(tc.ghiChuHtml, "", CO_CHU_BANG),
                    ] : "", { width: rongKhongDat }),
                ]),
            ],
        }),
        // Dòng "Kết quả" tổng hợp cuối bảng — khớp .dong-ket-qua trên
        // Phieu2FormPage.tsx: nhãn đậm ở cột Thời gian, bỏ trống cột Vị trí,
        // gộp toàn bộ cột tiêu chí thành 1 ô.
        new TableRow({
            cantSplit: true,
            children: [
                oOBang("Kết quả", { dam: true, width: RONG_THOI_GIAN }),
                oOBang("", { width: RONG_VI_TRI }),
                oOBang(
                    [
                        new Paragraph({
                            children: [
                                oChu("Đạt: ", { co: CO_CHU_BANG }),
                                oChu(`${soTieuChiDat}/${soTieuChiDaDanhGia}`, { dam: true, co: CO_CHU_BANG }),
                                oChu("     Không đạt: ", { co: CO_CHU_BANG }),
                                oChu(`${soTieuChiKhongDat}/${soTieuChiDaDanhGia}`, { dam: true, co: CO_CHU_BANG }),
                            ],
                        }),
                    ],
                    { columnSpan: Math.max(danhSachTieuChi.length * 2, 1), width: rongMoiTieuChi * danhSachTieuChi.length }
                ),
            ],
        }),
    ];

    // ---- Chữ ký ---- số cột ĐỘNG theo luồng ký thật đang cấu hình (Admin có
    // thể đặt tên bước/số bước khác nhau cho Phiếu 2, không hard-code —
    // giống xuatWordPhieu1.ts, xem PhieuSignatures.tsx render động cùng dữ
    // liệu này).
    const soBuoc = Math.max(chuKy.length, 1);
    const rongCot = Math.round(100 / soBuoc);

    // Tải trước ảnh chữ ký thật của từng bước ĐÃ DUYỆT (nếu có) — phải xong
    // trước khi build bảng vì docx cần width/height cụ thể lúc tạo ImageRun.
    const anhChuKyDanhSach = await Promise.all(chuKy.map(b => layAnhChuKy(b.duongDanChuKy)));

    // Đã ký: ưu tiên ảnh chữ ký thật (đang sử dụng tại thời điểm ký), fallback
    // tick xanh (✓) khi không có ảnh (nhà thầu, hoặc nội bộ chưa từng upload)
    // — khớp đúng logic hiển thị của PhieuSignatures.tsx. Kèm tên người ký
    // bên dưới, giống màn hình.
    const trangThaiChuKyDoan = (buoc?: XuatWordPhieu2ChuKy, anh?: AnhDaTai | null): Paragraph[] => {
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
                      children: [new TextRun({ text: "✓", font: FONT, size: 32, bold: true, color: MAU_XANH_DA_KY })],
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
                children: chuKy.map((_, i) =>
                    new TableCell({
                        width: { size: rongCot, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({})],
                    })
                ),
            }),
            new TableRow({
                children: (chuKy.length > 0 ? chuKy : [{ tenBuoc: "", trangThai: "CHO_KY" } as XuatWordPhieu2ChuKy]).map((buoc, i) =>
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

    // ---- Ảnh minh chứng dán trong ghi chú "Không đạt" + Ý kiến nhà thầu ----
    // Gom src ĐÚNG THỨ TỰ xuất hiện trên phiếu: theo từng tiêu chí trong bảng
    // đánh giá (đúng thứ tự danhSachTieuChi ở trên), rồi tới Ý kiến/phản hồi
    // của nhà thầu (xuất hiện SAU bảng, TRƯỚC chữ ký) — sau đó xếp tối đa 2
    // ảnh/hàng xuống cuối văn bản, đúng thứ tự đã gom (xem taoBangAnhMinhChung).
    const anhMinhChungSrc: string[] = [
        ...danhSachTieuChi.flatMap(tc => layDanhSachAnhTrongHtml(tc.ghiChuHtml)),
        ...layDanhSachAnhTrongHtml(yKienHtml),
    ];
    const anhMinhChungDaTai = (await Promise.all(anhMinhChungSrc.map(layAnhMinhChung)))
        .filter((anh): anh is AnhDaTai => anh !== null);

    // Khối ảnh luôn bắt đầu ở trang mới, tách hẳn khỏi phần biểu mẫu phía trên.
    const khoiAnhMinhChung: (Paragraph | Table)[] =
        anhMinhChungDaTai.length > 0
            ? [
                  oDoan("Hình ảnh minh chứng", { dam: true, canhSau: 100, sangTrangMoi: true }),
                  taoBangAnhMinhChung(anhMinhChungDaTai),
              ]
            : [];

    // ---- Header (logo + thông tin biểu mẫu) ----
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
                                children: [oChu(THONG_TIN_BIEU_MAU_PHIEU2?.soBieuMau ?? "", { dam: true })],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [oChu(`Ngày hiệu lực: `, {nghieng: true, dam: true }), oChu(`${THONG_TIN_BIEU_MAU_PHIEU2?.ngayHieuLuc ?? ""}`, { dam: true })],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [oChu(`Lần sửa đổi: `, {nghieng: true,dam: true }), oChu(`${THONG_TIN_BIEU_MAU_PHIEU2?.lanSuaDoi ?? ""}`, {dam: true })],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    // ---- Số / Nhà thầu / Ngày kiểm tra ---- bảng không viền 3 cột: "Số" ngay
    // trên "Ngày kiểm tra" ở cột giữa (căn giữa trang), "Nhà thầu" sát lề trái
    // cùng dòng với "Ngày kiểm tra". Dùng bảng thay vì tab stop để tên nhà thầu
    // dài tự xuống dòng trong cột trái, không đè sang "Ngày kiểm tra".
    const RONG_COT_BIEN = Math.round(RONG_VUNG_IN * 0.35);
    const RONG_COT_GIUA = RONG_VUNG_IN - RONG_COT_BIEN * 2;
    const oThongTin = (rong: number, doan?: Paragraph) =>
        new TableCell({
            width: { size: rong, type: WidthType.DXA },
            verticalAlign: VerticalAlign.BOTTOM,
            margins: { left: 0, right: 0 }, // "Nhà thầu" sát đúng lề trái trang
            children: [doan ?? new Paragraph({})],
        });
    const thongTinChungTable = new Table({
        width: { size: RONG_VUNG_IN, type: WidthType.DXA },
        columnWidths: [RONG_COT_BIEN, RONG_COT_GIUA, RONG_COT_BIEN],
        layout: TableLayoutType.FIXED,
        borders: TableBorders.NONE,
        rows: [
            new TableRow({
                children: [
                    oThongTin(RONG_COT_BIEN),
                    oThongTin(RONG_COT_GIUA, oDoan(`Số: ${soHieu || "........................"}`, {dam: true, canGiua: true, canhSau: 40 })),
                    oThongTin(RONG_COT_BIEN),
                ],
            }),
            new TableRow({
                children: [
                    oThongTin(RONG_COT_BIEN, oDoan(`Nhà thầu: ${tenNhaThau || "........................"}`, { dam: true, canhSau: 0 })),
                    oThongTin(RONG_COT_GIUA, oDoan(`Ngày kiểm tra: ${ngayKiemTra}`, { dam: true, canGiua: true, canhSau: 0 })),
                    // oThongTin(RONG_COT_BIEN),
                ],
            }),
        ],
    });

    // Số trang góc dưới-phải mỗi trang.
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
                properties: {
                    page: { margin: { top: LE_TRANG, right: LE_TRANG, bottom: LE_TRANG, left: LE_TRANG } },
                },
                footers: { default: footer },
                children: [
                    headerTable,
                    oDoan("PHIẾU ĐÁNH GIÁ CHẤT LƯỢNG DỊCH VỤ SUẤT ĂN", { dam: true, canGiua: true, co: CO_CHU_TIEU_DE, canhTruoc: 200, canhSau: 100 }),
                    thongTinChungTable,
                    oDoan("", { canhSau: 100 }),

                    new Table({
                        width: { size: RONG_VUNG_IN, type: WidthType.DXA },
                        columnWidths: cotBangDanhGia,
                        layout: TableLayoutType.FIXED, // giữ đúng độ rộng cột đã tính, không cho Word tự co theo nội dung
                        borders: VIEN_BANG,
                        rows: bangRows,
                    }),

                    oDoan("Ý kiến / phản hồi của nhà thầu", { dam: true, canhTruoc: 200, canhSau: 100 }),
                    ...dichHtmlSangDoan(yKienHtml, "Chưa có ý kiến"),

                    oDoan("", { canhTruoc: 200, canhSau: 0 }),
                    chuKyTable,

                    oDoan("Ghi chú:", { dam: true, nghieng: true, co: CO_CHU_GHI_CHU, canhTruoc: 200, canhSau: 40 }),
                    oDoan("- Kết quả ĐẠT, đánh dấu tick.", { nghieng: true, co: CO_CHU_GHI_CHU }),
                    oDoan("- Đối với kết quả KHÔNG ĐẠT, người đánh giá ghi rõ lý do và hình kèm ảnh minh chứng theo nếu có.", { nghieng: true, co: CO_CHU_GHI_CHU }),

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
    const tenGoc = `Phieu2_${ngayKiemTra.replace(/\//g, "")}_${(soHieu || "").replace(/[\\/:*?"<>|]/g, "-") || "chua-luu"}`;
    return { blob, tenGoc };
};

export const xuatWordPhieu2 = async (params: XuatWordPhieu2Params): Promise<void> => {
    const { blob, tenGoc } = await taoBlobDocxPhieu2(params);
    saveAs(blob, `${tenGoc}.docx`);
};

export default xuatWordPhieu2;
