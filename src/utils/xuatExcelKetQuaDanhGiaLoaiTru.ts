import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import KetQuaDanhGiaLoaiTruModel from "../models/KetQuaDanhGiaLoaiTruModel";

// Xuất Excel danh sách "Đánh dấu loại trừ do lỗi thiết bị" — lấy đúng dữ liệu
// đang hiển thị trên bảng (đã lọc theo khoảng ngày/bữa ăn/địa điểm đang chọn
// trên KetQuaDanhGiaLoaiTruPageV2.tsx), không gọi lại API riêng.

export interface ThamSoXuatExcelLoaiTru {
    tuNgay: string; // đã format "DD/MM/YYYY"
    denNgay: string;
    tenBuaAnLoc: string; // "Tất cả bữa ăn" hoặc tên bữa cụ thể
    tenDiaDiemLoc: string; // "Tất cả địa điểm" hoặc danh sách tên, nối bằng ", "
}

const VIEN_O: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
};

const COT = [
    { header: "Ngày", key: "ngay", width: 14 },
    { header: "Bữa ăn", key: "tenBuaAn", width: 14 },
    { header: "Địa điểm", key: "tenDiaDiem", width: 32 },
    { header: "Lý do", key: "lyDo", width: 40 },
    { header: "Người đánh dấu", key: "nguoiTaoTen", width: 22 },
    { header: "Thời điểm đánh dấu", key: "ngayTao", width: 20 },
];

export const xuatExcelKetQuaDanhGiaLoaiTru = async (
    danhSach: KetQuaDanhGiaLoaiTruModel[],
    thamSo: ThamSoXuatExcelLoaiTru
): Promise<void> => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Loại trừ");
    const soCot = COT.length;

    sheet.mergeCells(1, 1, 1, soCot);
    sheet.getCell(1, 1).value = "DANH SÁCH ĐÁNH DẤU LOẠI TRỪ DO LỖI THIẾT BỊ";
    sheet.getCell(1, 1).font = { bold: true, size: 14 };
    sheet.getCell(1, 1).alignment = { horizontal: "center" };

    sheet.mergeCells(2, 1, 2, soCot);
    sheet.getCell(2, 1).value =
        `Từ ngày ${thamSo.tuNgay} đến ${thamSo.denNgay} — Bữa ăn: ${thamSo.tenBuaAnLoc} — Địa điểm: ${thamSo.tenDiaDiemLoc}`;
    sheet.getCell(2, 1).alignment = { horizontal: "center" };
    sheet.getCell(2, 1).font = { italic: true, size: 11 };

    sheet.addRow([]);

    const dongTieuDe = sheet.addRow(COT.map((c) => c.header));
    dongTieuDe.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };
        cell.border = VIEN_O;
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    });
    COT.forEach((c, i) => { sheet.getColumn(i + 1).width = c.width; });

    danhSach.forEach((item) => {
        const dong = sheet.addRow([
            dayjs(item.ngay).format("DD/MM/YYYY"),
            item.tenBuaAn ?? "",
            item.tenDiaDiem ?? "",
            item.lyDo ?? "",
            item.nguoiTaoTen ?? "",
            dayjs(item.ngayTao).format("DD/MM/YYYY HH:mm"),
        ]);
        dong.eachCell((cell) => { cell.border = VIEN_O; });
    });

    sheet.pageSetup.paperSize = 9;
    sheet.pageSetup.orientation = "landscape";
    sheet.pageSetup.fitToPage = true;
    sheet.pageSetup.fitToWidth = 1;
    sheet.pageSetup.fitToHeight = 0;

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `LoaiTru_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
};

export default xuatExcelKetQuaDanhGiaLoaiTru;
