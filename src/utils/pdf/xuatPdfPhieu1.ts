import phieuHeaderInfo from "../../config/phieuHeaderInfo.json";
import { layAnhChuKy, layAnhMinhChung } from "../anhWord";
import { layDanhSachAnhTrongHtml } from "../ghiChuHtml";
import type { XuatWordPhieu1Dong, XuatWordPhieu1Params } from "../xuatWordPhieu1";
import {
    type AnhPdf,
    bangChuKy,
    chanTrang,
    chiaCotTheoTiLe,
    dauTick,
    dauTrangPhieu,
    doan,
    FONT,
    ghiChuSangPdf,
    khoiAnhMinhChung,
    layoutCoVien,
    type NoiDungPdf,
    sangAnhPdf,
    type ThongTinBieuMau,
    taiLogoDataUrl,
    taiXuongPdf,
    tenFileXuat,
    twipSangPt,
    VIEN_BANG,
} from "./pdfChung";

// Xuất PDF Phiếu 1 (phiếu kiểm tra công tác VSATTP) — bám đúng bố cục bản
// Word (xuatWordPhieu1.ts), cùng tham số đầu vào XuatWordPhieu1Params. Sửa
// bố cục 1 bên thì nhớ sửa bên còn lại cho khớp.

// Cỡ chữ (pt) — bản Word: CO_CHU 26 / CO_CHU_TIEU_DE 30 half-point, chữ
// trong ô bảng 24 half-point.
const CO_CHU = 13;
const CO_CHU_TIEU_DE = 15;
const CO_CHU_BANG = 12;

// Lề mặc định của docx (1440 twip = 1 inch) mỗi bên, A4 rộng 11906 twip.
const LE_TRANG = twipSangPt(1440);
const RONG_VUNG_IN = twipSangPt(11906 - 1440 * 2);

// Lề trái/phải ô bảng có viền = margins 80 twip của bản Word.
const LE_O = twipSangPt(80);

const LOGO_CAO_PX = 70;

const THONG_TIN_BIEU_MAU_PHIEU1 = (phieuHeaderInfo as Record<string, ThongTinBieuMau>).PHIEU1;

const phanTramHienThi = (v: number | null) =>
    v === null ? "" : v.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ketLuanHienThi = (v: string | null) => (v === "DAT" ? "Đạt" : v === "KHONG_DAT" ? "Không đạt" : "");

// Ô bảng có viền: chữ thường căn giữa (canTrai -> căn trái), căn giữa dọc
// như VerticalAlign.CENTER của bản Word.
const oBang = (noiDung: string | NoiDungPdf[], opts: { dam?: boolean; canTrai?: boolean; colSpan?: number } = {}): NoiDungPdf => ({
    ...(typeof noiDung === "string"
        ? { text: noiDung, bold: opts.dam, alignment: opts.canTrai ? "left" : "center", fontSize: CO_CHU_BANG }
        : { stack: noiDung }),
    colSpan: opts.colSpan,
    verticalAlignment: "middle",
});

const oTick = (co: boolean): NoiDungPdf => (co ? oBang([dauTick(9)]) : oBang(""));

export const xuatPdfPhieu1 = async (params: XuatWordPhieu1Params): Promise<void> => {
    const { soHieu, tenBepAn, tenNhaThau, ngayKiemTra, nhomVaDong, dongKhongNhom, ketLuan, chuKy } = params;

    // Ảnh minh chứng — gom đúng thứ tự như bản Word: checklist theo nhóm ->
    // dòng không nhóm -> ghi chú Kết luận.
    const anhMinhChungSrc: string[] = [
        ...nhomVaDong.flatMap(({ dong }) => dong.flatMap(d => layDanhSachAnhTrongHtml(d.ghiChuHtml))),
        ...dongKhongNhom.flatMap(d => layDanhSachAnhTrongHtml(d.ghiChuHtml)),
        ...layDanhSachAnhTrongHtml(ketLuan.ghiChuHtml),
    ];

    // Tải song song toàn bộ ảnh (chữ ký, minh chứng, logo).
    const [anhChuKy, anhMinhChung, logoDataUrl] = await Promise.all([
        Promise.all(chuKy.map(async b => sangAnhPdf(await layAnhChuKy(b.duongDanChuKy)))),
        Promise.all(anhMinhChungSrc.map(async src => sangAnhPdf(await layAnhMinhChung(src)))),
        taiLogoDataUrl(),
    ]);

    // ---- Bảng "1. Thực trạng đánh giá" ----
    const dongChecklist = (dong: XuatWordPhieu1Dong): NoiDungPdf[] => [
        oBang(dong.tt),
        oBang(dong.noiDung, { canTrai: true }),
        oTick(dong.ketQua === "DAT"),
        oTick(dong.ketQua === "KHONG_DAT"),
        oBang(ghiChuSangPdf(dong.ghiChuHtml)),
    ];
    const dongNhom = (ten: string): NoiDungPdf[] => [oBang(ten, { dam: true, canTrai: true, colSpan: 5 }), {}, {}, {}, {}];

    const checklistRows: NoiDungPdf[][] = [
        [
            oBang("TT", { dam: true }),
            oBang("Nội dung đánh giá", { dam: true }),
            oBang("Đạt", { dam: true }),
            oBang("Không đạt", { dam: true }),
            oBang("Ghi chú", { dam: true }),
        ],
    ];
    nhomVaDong.forEach(({ soNhom, tenNhom, dong }) => {
        checklistRows.push(dongNhom(`${soNhom}. ${tenNhom}`));
        dong.forEach(d => checklistRows.push(dongChecklist(d)));
    });
    if (dongKhongNhom.length > 0) {
        checklistRows.push(dongNhom("Các nội dung khác"));
        dongKhongNhom.forEach(d => checklistRows.push(dongChecklist(d)));
    }

    // ---- Bảng "2. Kết luận" ----
    const ketLuanRows: NoiDungPdf[][] = [
        [
            oBang("TT", { dam: true }),
            oBang("Số lượng tiêu chí đạt", { dam: true }),
            oBang("Tổng số lượng tiêu chí đánh giá", { dam: true }),
            oBang("Tỷ lệ % tiêu chí đạt", { dam: true }),
            oBang("Kết luận", { dam: true }),
            oBang("Điểm đánh giá", { dam: true }),
            oBang("Ghi chú", { dam: true }),
        ],
        [
            oBang("1"),
            oBang(String(ketLuan.soDat)),
            oBang(String(ketLuan.tongSo)),
            oBang(phanTramHienThi(ketLuan.tyLe)),
            oBang(ketLuanHienThi(ketLuan.ketLuan)),
            oBang(phanTramHienThi(ketLuan.diem)),
            oBang(ghiChuSangPdf(ketLuan.ghiChuHtml)),
        ],
    ];

    const docDefinition = {
        pageSize: "A4",
        pageMargins: [LE_TRANG, LE_TRANG, LE_TRANG, LE_TRANG],
        defaultStyle: { font: FONT, fontSize: CO_CHU },
        footer: chanTrang(CO_CHU, LE_TRANG),
        content: [
            dauTrangPhieu(logoDataUrl, LOGO_CAO_PX, THONG_TIN_BIEU_MAU_PHIEU1, 11, RONG_VUNG_IN),
            doan(`Số: ${soHieu || "........................"}`, { co: 11, truoc: 5, sau: 5 }),
            doan("PHIẾU KIỂM TRA CÔNG TÁC VSATTP", { dam: true, canGiua: true, co: CO_CHU_TIEU_DE, sau: 0 }),
            doan(`TẠI BẾP ĂN ${tenBepAn?.toLocaleUpperCase("vi-VN") || "........................"}`, {
                dam: true,
                canGiua: true,
                co: CO_CHU_TIEU_DE,
                sau: 10,
            }),

            doan(`Nhà thầu: ${tenNhaThau || "........................"}`, { dam: true, canGiua: true }),
            doan(`Ngày kiểm tra: ${ngayKiemTra}`, { dam: true, canGiua: true, sau: 10 }),

            doan("1. Thực trạng đánh giá", { dam: true, sau: 5 }),
            {
                table: {
                    widths: chiaCotTheoTiLe(RONG_VUNG_IN, [6, 44, 12, 12, 26], LE_O, VIEN_BANG),
                    headerRows: 1,
                    body: checklistRows,
                },
                layout: layoutCoVien(LE_O),
            },

            doan("2. Kết luận", { dam: true, truoc: 10, sau: 5 }),
            {
                table: { widths: ketLuanRows[0].map(() => "*"), headerRows: 1, body: ketLuanRows },
                layout: layoutCoVien(LE_O),
            },

            doan("Quy ước:", { dam: true, truoc: 10, sau: 2 }),
            doan(
                [
                    "- Trường hợp tỷ lệ % tiêu chí đạt < ",
                    { text: "50%", bold: true },
                    ", kết luận kết quả đánh giá ",
                    { text: "KHÔNG ĐẠT", bold: true },
                    ". Điểm đánh giá = ",
                    { text: "0", bold: true },
                    " điểm.",
                ],
                { sau: 2 }
            ),
            doan(
                [
                    "- Trường hợp tỷ lệ % tiêu chí đạt ≥ ",
                    { text: "50%", bold: true },
                    ", kết luận kết quả đánh giá ",
                    { text: "ĐẠT", bold: true },
                    ". Điểm đánh giá = Tỷ lệ % tiêu chí đạt *5.",
                ],
                { sau: 10 }
            ),

            bangChuKy(chuKy, anhChuKy, CO_CHU, 20),

            ...khoiAnhMinhChung(
                anhMinhChung.filter((anh): anh is AnhPdf => anh !== null),
                CO_CHU
            ),
        ],
    };

    await taiXuongPdf(docDefinition, `${tenFileXuat("Phieu1", ngayKiemTra, soHieu)}.pdf`);
};

export default xuatPdfPhieu1;
