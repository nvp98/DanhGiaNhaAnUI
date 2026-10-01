import pdfMake from "pdfmake";

import tinosBold from "../../assets/fonts/Tinos-Bold.ttf";
import tinosBoldItalic from "../../assets/fonts/Tinos-BoldItalic.ttf";
import tinosItalic from "../../assets/fonts/Tinos-Italic.ttf";
import tinosRegular from "../../assets/fonts/Tinos-Regular.ttf";
import logoPdf from "../../assets/images/LogoPDF.png";
import {
    ANH_MINH_CHUNG_CAO_TOI_DA,
    ANH_MINH_CHUNG_CAP_CAO_TOI_DA,
    ANH_MINH_CHUNG_CAP_RONG_TOI_DA,
    ANH_MINH_CHUNG_RONG_TOI_DA,
    type AnhDaTai,
    coGianAnh,
} from "../anhWord";
import { docHtmlGhiChu } from "../ghiChuHtml";

// Phần dùng chung khi xuất PDF Phiếu 1/2 bằng pdfmake — dựng bố cục bám
// theo đúng bản Word (xuatWordPhieu1/2.ts): cùng tham số đầu vào, cùng cách
// gom ảnh minh chứng xuống cuối, cùng bảng chữ ký. Module này (và pdfmake)
// chỉ được import ĐỘNG khi người dùng bấm "Xuất PDF" (xem NutXuatFile), không
// nằm trong bundle trang phiếu.

// Đơn vị: pdfmake dùng pt (1/72 inch). Word dùng twip (1/20 pt), cỡ chữ
// half-point, ảnh px @96 DPI — đổi ngay tại chỗ dùng để đối chiếu bản Word.
export const twipSangPt = (twip: number) => twip / 20;
export const pxSangPt = (px: number) => px * 0.75;

// Độ rộng cột: Word tính GỒM cả lề ô, còn pdfmake cộng thêm padding 2 bên +
// nét viền NGOÀI độ rộng khai báo — không trừ ra thì bảng nhiều cột (Phiếu 2:
// 12 cột) tràn khỏi lề phải. `rongPt` là độ rộng cột kiểu Word (pt).
export const rongCotPdf = (rongPt: number, le: number, vien = 0) => Math.max(rongPt - 2 * le - vien, 1);

// Chia `tongRong` (pt) theo tỉ lệ % như WidthType.PERCENTAGE của bản Word.
export const chiaCotTheoTiLe = (tongRong: number, tiLePhanTram: number[], le: number, vien = 0) =>
    tiLePhanTram.map(p => rongCotPdf((tongRong * p) / 100, le, vien));

// Nội dung pdfmake: chuỗi hoặc object node (text/stack/table/image/svg...).
// Không khai báo kiểu chi tiết cho từng loại node — pdfmake 0.3 không có
// file kiểu, xem src/pdfmake.d.ts.
export type NoiDungPdf = string | { [key: string]: unknown };

// ============================================================
// FONT — Tinos (metric-compatible Times New Roman), xem assets/fonts/README.md.
// pdfmake trên trình duyệt chỉ tải font qua URL tuyệt đối http(s).
// ============================================================

export const FONT = "Tinos";

const urlTuyetDoi = (url: string) => new URL(url, window.location.href).href;

let daCauHinhPdfMake = false;
const layPdfMake = () => {
    if (!daCauHinhPdfMake) {
        pdfMake.setFonts({
            [FONT]: {
                normal: urlTuyetDoi(tinosRegular),
                bold: urlTuyetDoi(tinosBold),
                italics: urlTuyetDoi(tinosItalic),
                bolditalics: urlTuyetDoi(tinosBoldItalic),
            },
        });
        // Chỉ cho pdfmake tự tải URL cùng origin (font của app) — ảnh luôn
        // truyền vào dưới dạng data URL đã tải + thu nhỏ sẵn (anhWord.ts).
        pdfMake.setUrlAccessPolicy(url => url.startsWith(window.location.origin));
        daCauHinhPdfMake = true;
    }
    return pdfMake;
};

export const taiXuongPdf = (docDefinition: object, tenFile: string): Promise<void> =>
    layPdfMake().createPdf(docDefinition).download(tenFile);

// Cùng quy tắc đặt tên file với bản Word (xem taoBlobDocxPhieu1/2).
export const tenFileXuat = (tienTo: string, ngayKiemTra: string, soHieu?: string) =>
    `${tienTo}_${ngayKiemTra.replace(/\//g, "")}_${(soHieu || "").replace(/[\\/:*?"<>|]/g, "-") || "chua-luu"}`;

// ============================================================
// ẢNH — tải qua anhWord.ts (đã thu nhỏ) rồi đổi sang data URL cho pdfmake.
// ============================================================

export interface AnhPdf {
    dataUrl: string;
    rong: number; // px hiển thị, như AnhDaTai
    cao: number;
}

const blobSangDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });

export const sangAnhPdf = async (anh: AnhDaTai | null): Promise<AnhPdf | null> =>
    !anh
        ? null
        : {
              dataUrl: await blobSangDataUrl(new Blob([anh.data], { type: anh.type === "jpg" ? "image/jpeg" : "image/png" })),
              rong: anh.rong,
              cao: anh.cao,
          };

export const taiLogoDataUrl = async (): Promise<string> => blobSangDataUrl(await fetch(logoPdf).then(r => r.blob()));

// ============================================================
// KHỐI CƠ BẢN
// ============================================================

export interface TuyChonDoan {
    dam?: boolean;
    nghieng?: boolean;
    canGiua?: boolean;
    canPhai?: boolean;
    co?: number; // pt
    truoc?: number; // pt
    sau?: number; // pt — mặc định 4pt = spacing after 80 twip của oDoan bản Word
    sangTrangMoi?: boolean;
}

export const doan = (text: string | NoiDungPdf[], opts: TuyChonDoan = {}): NoiDungPdf => ({
    text,
    bold: opts.dam,
    italics: opts.nghieng,
    alignment: opts.canGiua ? "center" : opts.canPhai ? "right" : undefined,
    ...(opts.co ? { fontSize: opts.co } : {}),
    margin: [0, opts.truoc ?? 0, 0, opts.sau ?? 4],
    pageBreak: opts.sangTrangMoi ? "before" : undefined,
});

// Dấu ✓ — Tinos (như Times New Roman) không có glyph này (Word tự lấy từ
// font khác), nên vẽ bằng SVG.
export const MAU_DEN = "000000";
export const MAU_XANH_DA_KY = "16A34A"; // khớp .chu-ky-icon-wrap trong _phieu-base.scss

export const dauTick = (kichThuoc: number, mau = MAU_DEN): NoiDungPdf => ({
    svg:
        `<svg xmlns="http://www.w3.org/2000/svg" width="${kichThuoc}" height="${kichThuoc}" viewBox="0 0 24 24">` +
        `<path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#${mau}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    width: kichThuoc,
    height: kichThuoc,
    alignment: "center",
});

// Bảng có viền 0,5pt (= BorderStyle.SINGLE size 4 của bản Word). `le` =
// padding trái/phải ô (pt), khớp margins của TableCell bản Word.
export const layoutCoVien = (le: number) => ({
    hLineWidth: () => VIEN_BANG,
    vLineWidth: () => VIEN_BANG,
    hLineColor: () => "#000000",
    vLineColor: () => "#000000",
    paddingLeft: () => le,
    paddingRight: () => le,
    paddingTop: () => 2,
    paddingBottom: () => 2,
});

export const VIEN_BANG = 0.5;

// Lề ô mặc định của Word (0,08in) — dùng cho bảng không khai báo margins.
export const LE_O_MAC_DINH = 5.4;

// Bảng không viền.
export const layoutKhongVien = (le = LE_O_MAC_DINH, trenDuoi = 0) => ({
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    paddingLeft: () => le,
    paddingRight: () => le,
    paddingTop: () => trenDuoi,
    paddingBottom: () => trenDuoi,
});

// Ghi chú HTML (TinyMCE) -> các đoạn pdfmake, cùng cách đọc với bản Word
// (docHtmlGhiChu): đoạn thường cách sau 3pt, mục danh sách "• " thụt 18pt
// cách sau 2pt. Rỗng -> 1 đoạn `rongKhi`.
export const ghiChuSangPdf = (html: string | undefined, opts: { co?: number; rongKhi?: string } = {}): NoiDungPdf[] => {
    const coChu = opts.co ? { fontSize: opts.co } : {};
    const doanVan = docHtmlGhiChu(html);
    if (doanVan.length === 0) return [{ text: opts.rongKhi ?? "", ...coChu }];

    return doanVan.map(d => ({
        text: [
            ...(d.laMuc ? [{ text: "• " }] : []),
            ...d.runs.map(r =>
                r.xuongDong
                    ? { text: "\n" }
                    : { text: r.text, bold: r.dam, italics: r.nghieng, decoration: r.gachChan ? "underline" : undefined }
            ),
        ],
        ...coChu,
        margin: [d.laMuc ? 18 : 0, 0, 0, d.laMuc ? 2 : 3],
    }));
};

// "Trang x/y" giữa chân trang — Word đặt footer cách mép dưới 0,5in (36pt);
// pdfmake vẽ footer trong vùng lề dưới nên đẩy xuống tương ứng.
export const chanTrang = (co: number, leDuoi: number) => (trang: number, tongTrang: number): NoiDungPdf => ({
    text: `Trang ${trang}/${tongTrang}`,
    alignment: "center",
    fontSize: co,
    margin: [0, Math.max(leDuoi - 36 - co * 1.2, 2), 0, 0],
});

// ============================================================
// HEADER (logo + thông tin biểu mẫu) — khớp headerTable bản Word.
// ============================================================

export interface ThongTinBieuMau {
    soBieuMau: string;
    ngayHieuLuc: string;
    lanSuaDoi: string;
}

// Ảnh logo gốc 756x309px — giữ đúng tỉ lệ (xem LOGO_* bản Word).
// `rongVungIn` (pt) để chia 2 cột 60%/40% như bản Word.
export const dauTrangPhieu = (
    logoDataUrl: string,
    logoCaoPx: number,
    thongTin: ThongTinBieuMau | undefined,
    co: number,
    rongVungIn: number
): NoiDungPdf => {
    const dongPhai = (nhan: string, giaTri: string): NoiDungPdf => ({
        text: [{ text: nhan, italics: true }, { text: giaTri }],
        bold: true,
        alignment: "right",
    });
    return {
        table: {
            widths: chiaCotTheoTiLe(rongVungIn, [60, 40], LE_O_MAC_DINH),
            body: [
                [
                    {
                        image: logoDataUrl,
                        width: pxSangPt(Math.round(logoCaoPx * (756 / 309))),
                        height: pxSangPt(logoCaoPx),
                        verticalAlignment: "middle",
                    },
                    {
                        stack: [
                            { text: thongTin?.soBieuMau ?? "", bold: true, alignment: "right" },
                            dongPhai("Ngày hiệu lực: ", thongTin?.ngayHieuLuc ?? ""),
                            dongPhai("Lần sửa đổi: ", thongTin?.lanSuaDoi ?? ""),
                        ],
                        fontSize: co,
                        verticalAlignment: "middle",
                    },
                ],
            ],
        },
        layout: layoutKhongVien(),
    };
};

// ============================================================
// CHỮ KÝ — số cột động theo luồng ký, khớp chuKyTable bản Word: đã ký thì
// ưu tiên ảnh chữ ký thật, fallback tick xanh, kèm tên người ký bên dưới.
// ============================================================

export interface ChuKyPdf {
    tenBuoc?: string;
    trangThai: string; // CHO_KY, DA_DUYET, TU_CHOI
    ghiChu?: string;
    nguoiKyHoTen?: string;
}

const trangThaiChuKyHienThi = (trangThai: string, ghiChu?: string): string =>
    trangThai === "TU_CHOI" ? `Từ chối${ghiChu ? ": " + ghiChu : ""}` : "";

export const bangChuKy = (chuKy: ChuKyPdf[], anhChuKy: (AnhPdf | null)[], co: number, coTick: number): NoiDungPdf => {
    const dsBuoc: ChuKyPdf[] = chuKy.length > 0 ? chuKy : [{ tenBuoc: "", trangThai: "CHO_KY" }];

    const oChuKy = (buoc: ChuKyPdf, anh: AnhPdf | null | undefined): NoiDungPdf => {
        const stack: NoiDungPdf[] = [doan(buoc.tenBuoc || "", { dam: true, canGiua: true, sau: 2 })];
        if (buoc.trangThai === "DA_DUYET") {
            stack.push(
                anh
                    ? { image: anh.dataUrl, width: pxSangPt(anh.rong), height: pxSangPt(anh.cao), alignment: "center", margin: [0, 0, 0, 2] }
                    : { ...(dauTick(coTick, MAU_XANH_DA_KY) as object), margin: [0, 0, 0, 2] },
                doan(buoc.nguoiKyHoTen || "(đã ký)", { canGiua: true })
            );
        } else {
            stack.push(doan(trangThaiChuKyHienThi(buoc.trangThai, buoc.ghiChu), { canGiua: true }));
        }
        return { stack };
    };

    return {
        table: {
            widths: dsBuoc.map(() => "*"),
            body: [
                dsBuoc.map(() => ({ text: " " })), // dòng trống phía trên như bản Word
                dsBuoc.map((buoc, i) => oChuKy(buoc, anhChuKy[i])),
            ],
        },
        layout: layoutKhongVien(),
        fontSize: co,
    };
};

// ============================================================
// ẢNH MINH CHỨNG — trang mới, tối đa 2 ảnh/hàng; số ảnh lẻ thì ảnh CUỐI
// nằm riêng 1 hàng (gộp 2 cột), to hơn ảnh đi cặp. Khớp taoBangAnhMinhChung.
// ============================================================

export const khoiAnhMinhChung = (dsAnh: AnhPdf[], co: number): NoiDungPdf[] => {
    if (dsAnh.length === 0) return [];

    const oAnh = (anh: AnhPdf, soThuTu: number, colSpan?: number): NoiDungPdf => ({
        stack: [
            { image: anh.dataUrl, width: pxSangPt(anh.rong), height: pxSangPt(anh.cao), alignment: "center", margin: [0, 0, 0, 2] },
            doan(`Hình ${soThuTu}`, { canGiua: true, nghieng: true, co, sau: 10 }),
        ],
        colSpan,
        verticalAlignment: "bottom", // chú thích 2 ảnh cùng hàng thẳng nhau
    });

    const hang: NoiDungPdf[][] = [];
    for (let i = 0; i < dsAnh.length; i += 2) {
        const anhTrai = dsAnh[i];
        const anhPhai = dsAnh[i + 1];
        hang.push(
            anhPhai
                ? [
                      oAnh(coGianAnh(anhTrai, ANH_MINH_CHUNG_CAP_CAO_TOI_DA, ANH_MINH_CHUNG_CAP_RONG_TOI_DA), i + 1),
                      oAnh(coGianAnh(anhPhai, ANH_MINH_CHUNG_CAP_CAO_TOI_DA, ANH_MINH_CHUNG_CAP_RONG_TOI_DA), i + 2),
                  ]
                : [oAnh(coGianAnh(anhTrai, ANH_MINH_CHUNG_CAO_TOI_DA, ANH_MINH_CHUNG_RONG_TOI_DA), i + 1, 2), {}]
        );
    }

    return [
        doan("Hình ảnh minh chứng", { dam: true, co, sau: 5, sangTrangMoi: true }),
        {
            table: { widths: ["*", "*"], body: hang, dontBreakRows: true }, // không cắt ngang ảnh qua 2 trang
            layout: layoutKhongVien(4, 2),
        },
    ];
};
