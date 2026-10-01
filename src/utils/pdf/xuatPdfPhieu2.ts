import phieuHeaderInfo from "../../config/phieuHeaderInfo.json";
import { layAnhChuKy, layAnhMinhChung } from "../anhWord";
import { layDanhSachAnhTrongHtml } from "../ghiChuHtml";
import type { XuatWordPhieu2Params } from "../xuatWordPhieu2";
import {
    type AnhPdf,
    bangChuKy,
    chanTrang,
    dauTick,
    dauTrangPhieu,
    doan,
    FONT,
    ghiChuSangPdf,
    khoiAnhMinhChung,
    layoutCoVien,
    layoutKhongVien,
    type NoiDungPdf,
    rongCotPdf,
    sangAnhPdf,
    type ThongTinBieuMau,
    taiLogoDataUrl,
    taiXuongPdf,
    tenFileXuat,
    twipSangPt,
    VIEN_BANG,
} from "./pdfChung";

// Xuất PDF Phiếu 2 (phiếu đánh giá chất lượng dịch vụ suất ăn) — bám đúng
// bố cục bản Word (xuatWordPhieu2.ts), cùng tham số đầu vào
// XuatWordPhieu2Params. Sửa bố cục 1 bên thì nhớ sửa bên còn lại cho khớp.

// Cỡ chữ (pt) — bản Word: CO_CHU 20 / CO_CHU_TIEU_DE 24 / CO_CHU_GHI_CHU 18
// / CO_CHU_BANG 16 half-point.
const CO_CHU = 10;
const CO_CHU_TIEU_DE = 12;
const CO_CHU_GHI_CHU = 9;
const CO_CHU_BANG = 8;

// A4 dọc, lề hẹp 720 twip ("Narrow" của Word) — vùng in tính bằng twip để
// dùng lại đúng công thức chia cột của bản Word, đổi sang pt lúc khai báo.
const RONG_TRANG_A4 = 11906;
const LE_TRANG = 720;
const RONG_VUNG_IN = RONG_TRANG_A4 - LE_TRANG * 2;

// Lề trái/phải ô bảng đánh giá = margins 60 twip của bản Word.
const LE_O = twipSangPt(60);

const LOGO_CAO_PX = 60;

const THONG_TIN_BIEU_MAU_PHIEU2 = (phieuHeaderInfo as Record<string, ThongTinBieuMau>).PHIEU2;

const oBang = (
    noiDung: string | NoiDungPdf[],
    opts: { dam?: boolean; canTrai?: boolean; colSpan?: number; rowSpan?: number } = {}
): NoiDungPdf => ({
    ...(typeof noiDung === "string"
        ? { text: noiDung, bold: opts.dam, alignment: opts.canTrai ? "left" : "center" }
        : { stack: noiDung }),
    colSpan: opts.colSpan,
    rowSpan: opts.rowSpan,
    verticalAlignment: "middle",
});

export const xuatPdfPhieu2 = async (params: XuatWordPhieu2Params): Promise<void> => {
    const { soHieu, tenNhaThau, ngayKiemTra, thoiGianKiemTraText, viTriKiemTra, danhSachTieuChi, yKienHtml, chuKy } = params;

    // Ảnh minh chứng — gom đúng thứ tự như bản Word: ghi chú từng tiêu chí ->
    // Ý kiến nhà thầu.
    const anhMinhChungSrc: string[] = [
        ...danhSachTieuChi.flatMap(tc => layDanhSachAnhTrongHtml(tc.ghiChuHtml)),
        ...layDanhSachAnhTrongHtml(yKienHtml),
    ];

    // Tải song song toàn bộ ảnh (chữ ký, minh chứng, logo).
    const [anhChuKy, anhMinhChung, logoDataUrl] = await Promise.all([
        Promise.all(chuKy.map(async b => sangAnhPdf(await layAnhChuKy(b.duongDanChuKy)))),
        Promise.all(anhMinhChungSrc.map(async src => sangAnhPdf(await layAnhMinhChung(src)))),
        taiLogoDataUrl(),
    ]);

    // ---- Bảng đánh giá (cột = tiêu chí × Đạt/K-Đạt) — độ rộng cột (twip)
    // tính y hệt bản Word, xem giải thích ở xuatWordPhieu2.ts.
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
    ].map(rong => rongCotPdf(twipSangPt(rong), LE_O, VIEN_BANG));
    const soCotTieuChi = danhSachTieuChi.length * 2;

    const soTieuChiDat = danhSachTieuChi.filter(tc => tc.dat).length;
    const soTieuChiKhongDat = danhSachTieuChi.filter(tc => tc.khongDat).length;
    const soTieuChiDaDanhGia = soTieuChiDat + soTieuChiKhongDat;

    const oTieuChiTrong: NoiDungPdf[] = Array.from({ length: Math.max(soCotTieuChi - 1, 0) }, () => ({}));

    const bangRows: NoiDungPdf[][] = [
        [
            oBang("Thời gian kiểm tra", { dam: true, rowSpan: 2 }),
            oBang("Vị trí kiểm tra", { dam: true, rowSpan: 2 }),
            ...danhSachTieuChi.flatMap(tc => [oBang(tc.tenTieuChi, { dam: true, colSpan: 2 }), {}]),
        ],
        [
            {},
            {},
            ...danhSachTieuChi.flatMap(() => [oBang("Đạt", { dam: true }), oBang("K-Đạt", { dam: true })]),
        ],
        [
            oBang(thoiGianKiemTraText || "", { canTrai: true }),
            oBang(viTriKiemTra || "", { canTrai: true }),
            ...danhSachTieuChi.flatMap(tc => [
                tc.dat
                    ? oBang([
                          dauTick(7),
                          ...(tc.diem !== undefined && tc.diem !== null
                              ? [{
                                    text: `${tc.diem.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}đ`,
                                    alignment: "center",
                                }]
                              : []),
                      ])
                    : oBang(""),
                tc.khongDat ? oBang([dauTick(7), ...ghiChuSangPdf(tc.ghiChuHtml, { co: CO_CHU_BANG })]) : oBang(""),
            ]),
        ],
        // Dòng "Kết quả" tổng hợp cuối bảng — gộp toàn bộ cột tiêu chí thành 1 ô.
        [
            oBang("Kết quả", { dam: true }),
            oBang(""),
            ...(soCotTieuChi > 0
                ? [
                      oBang(
                          [
                              {
                                  text: [
                                      "Đạt: ",
                                      { text: `${soTieuChiDat}/${soTieuChiDaDanhGia}`, bold: true },
                                      "     Không đạt: ",
                                      { text: `${soTieuChiKhongDat}/${soTieuChiDaDanhGia}`, bold: true },
                                  ],
                              },
                          ],
                          { colSpan: soCotTieuChi }
                      ),
                      ...oTieuChiTrong,
                  ]
                : []),
        ],
    ];

    // ---- Số / Nhà thầu / Ngày kiểm tra ---- bảng không viền 3 cột như bản
    // Word: "Số" ngay trên "Ngày kiểm tra" ở cột giữa, "Nhà thầu" sát lề trái.
    const RONG_COT_BIEN = Math.round(RONG_VUNG_IN * 0.35);
    const RONG_COT_GIUA = RONG_VUNG_IN - RONG_COT_BIEN * 2;
    const oThongTin = (noiDung?: NoiDungPdf): NoiDungPdf => ({
        ...((noiDung ?? { text: "" }) as object),
        verticalAlignment: "bottom",
    });
    const thongTinChung: NoiDungPdf = {
        table: {
            widths: [RONG_COT_BIEN, RONG_COT_GIUA, RONG_COT_BIEN].map(twipSangPt),
            body: [
                [oThongTin(), oThongTin(doan(`Số: ${soHieu || "........................"}`, { dam: true, canGiua: true, sau: 2 })), oThongTin()],
                [
                    oThongTin(doan(`Nhà thầu: ${tenNhaThau || "........................"}`, { dam: true, sau: 0 })),
                    oThongTin(doan(`Ngày kiểm tra: ${ngayKiemTra}`, { dam: true, canGiua: true, sau: 0 })),
                    oThongTin(),
                ],
            ],
        },
        layout: layoutKhongVien(0),
    };

    const lePt = twipSangPt(LE_TRANG);
    const docDefinition = {
        pageSize: "A4",
        pageMargins: [lePt, lePt, lePt, lePt],
        defaultStyle: { font: FONT, fontSize: CO_CHU },
        footer: chanTrang(CO_CHU, lePt),
        content: [
            dauTrangPhieu(logoDataUrl, LOGO_CAO_PX, THONG_TIN_BIEU_MAU_PHIEU2, CO_CHU, twipSangPt(RONG_VUNG_IN)),
            doan("PHIẾU ĐÁNH GIÁ CHẤT LƯỢNG DỊCH VỤ SUẤT ĂN", { dam: true, canGiua: true, co: CO_CHU_TIEU_DE, truoc: 10, sau: 5 }),
            thongTinChung,
            doan(" ", { sau: 5 }),

            {
                table: { widths: cotBangDanhGia, headerRows: 2, body: bangRows },
                layout: layoutCoVien(LE_O),
                fontSize: CO_CHU_BANG,
            },

            doan("Ý kiến / phản hồi của nhà thầu", { dam: true, truoc: 10, sau: 5 }),
            ...ghiChuSangPdf(yKienHtml, { rongKhi: "Chưa có ý kiến" }),

            doan(" ", { truoc: 10, sau: 0 }),
            bangChuKy(chuKy, anhChuKy, CO_CHU, 16),

            doan("Ghi chú:", { dam: true, nghieng: true, co: CO_CHU_GHI_CHU, truoc: 10, sau: 2 }),
            doan("- Kết quả ĐẠT, đánh dấu tick.", { nghieng: true, co: CO_CHU_GHI_CHU }),
            doan("- Đối với kết quả KHÔNG ĐẠT, người đánh giá ghi rõ lý do và hình kèm ảnh minh chứng theo nếu có.", {
                nghieng: true,
                co: CO_CHU_GHI_CHU,
            }),

            ...khoiAnhMinhChung(
                anhMinhChung.filter((anh): anh is AnhPdf => anh !== null),
                CO_CHU
            ),
        ],
    };

    await taiXuongPdf(docDefinition, `${tenFileXuat("Phieu2", ngayKiemTra, soHieu)}.pdf`);
};

export default xuatPdfPhieu2;
