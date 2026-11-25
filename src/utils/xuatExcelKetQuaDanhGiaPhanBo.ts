import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import KetQuaDanhGiaPhanBoModel from "../models/KetQuaDanhGiaPhanBoModel";

// Xuất Excel bảng "Rà soát phân bổ đánh giá theo suất ăn" — lấy đúng dữ liệu
// đang hiển thị trên bảng (đã lọc theo khoảng ngày/bữa ăn/địa điểm/trạng thái
// đang chọn trên KetQuaDanhGiaPhanBoPageV2.tsx), không gọi lại API riêng.
// Dùng header PHẲNG (không gộp nhóm như bảng trên màn hình) cho đơn giản và
// chắc ăn khi mở bằng Excel/LibreOffice.

export interface ThamSoXuatExcelPhanBo {
    tuNgay: string; // đã format "DD/MM/YYYY"
    denNgay: string;
    tenBuaAnLoc: string; // "Tất cả bữa ăn" hoặc tên bữa cụ thể
    tenDiaDiemLoc: string; // "Tất cả địa điểm" hoặc danh sách tên, nối bằng ", "
    tenTrangThaiLoc: string; // "Tất cả trạng thái" | "Đã co giãn" | "Giữ nguyên"
}

const VIEN_O: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
};

const COT = [
    { header: "Ngày", key: "ngay", width: 14 },
    { header: "Bữa ăn", key: "tenBuaAn", width: 12 },
    { header: "Địa điểm", key: "diaDiem", width: 32 },
    { header: "Suất ăn thực tế", key: "comThucTe", width: 14 },
    { header: "Gốc - 1 (Rất không hài lòng)", key: "diem1Goc", width: 14 },
    { header: "Gốc - 2 (Không hài lòng)", key: "diem2Goc", width: 14 },
    { header: "Gốc - 3 (Bình thường)", key: "diem3Goc", width: 14 },
    { header: "Gốc - 4 (Hài lòng)", key: "diem4Goc", width: 14 },
    { header: "Gốc - 5 (Rất hài lòng)", key: "diem5Goc", width: 14 },
    { header: "Gốc - Tổng", key: "tongGoc", width: 12 },
    { header: "Phân bổ - 1 (Rất không hài lòng)", key: "diem1", width: 14 },
    { header: "Phân bổ - 2 (Không hài lòng)", key: "diem2", width: 14 },
    { header: "Phân bổ - 3 (Bình thường)", key: "diem3", width: 14 },
    { header: "Phân bổ - 4 (Hài lòng)", key: "diem4", width: 14 },
    { header: "Phân bổ - 5 (Rất hài lòng)", key: "diem5", width: 14 },
    { header: "Phân bổ - Tổng", key: "tong", width: 12 },
    { header: "Trạng thái", key: "trangThai", width: 14 },
    { header: "Thời gian tính", key: "thoiGianTinh", width: 20 },
];

export const xuatExcelKetQuaDanhGiaPhanBo = async (
    danhSach: KetQuaDanhGiaPhanBoModel[],
    tenDiaDiem: (id: number) => string,
    thamSo: ThamSoXuatExcelPhanBo
): Promise<void> => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Phân bổ");
    const soCot = COT.length;

    sheet.mergeCells(1, 1, 1, soCot);
    sheet.getCell(1, 1).value = "RÀ SOÁT PHÂN BỔ ĐÁNH GIÁ THEO SUẤT ĂN";
    sheet.getCell(1, 1).font = { bold: true, size: 14 };
    sheet.getCell(1, 1).alignment = { horizontal: "center" };

    sheet.mergeCells(2, 1, 2, soCot);
    sheet.getCell(2, 1).value =
        `Từ ngày ${thamSo.tuNgay} đến ${thamSo.denNgay} — Bữa ăn: ${thamSo.tenBuaAnLoc} — Địa điểm: ${thamSo.tenDiaDiemLoc} — Trạng thái: ${thamSo.tenTrangThaiLoc}`;
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
            item.tenBuaAn,
            tenDiaDiem(item.diaDiemNhaAnId),
            item.comThucTe ?? "",
            item.diem1Goc,
            item.diem2Goc,
            item.diem3Goc,
            item.diem4Goc,
            item.diem5Goc,
            item.tongGoc,
            item.diem1,
            item.diem2,
            item.diem3,
            item.diem4,
            item.diem5,
            item.tong,
            item.tong !== item.tongGoc ? "Đã co giãn" : "Giữ nguyên",
            dayjs(item.thoiGianTinh).format("DD/MM/YYYY HH:mm"),
        ]);
        dong.eachCell((cell) => { cell.border = VIEN_O; });
    });

    sheet.pageSetup.paperSize = 9;
    sheet.pageSetup.orientation = "landscape";
    sheet.pageSetup.fitToPage = true;
    sheet.pageSetup.fitToWidth = 1;
    sheet.pageSetup.fitToHeight = 0;

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `PhanBoDanhGia_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
};

export default xuatExcelKetQuaDanhGiaPhanBo;
