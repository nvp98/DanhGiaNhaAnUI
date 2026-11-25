import dayjs from "dayjs";

// Định dạng giờ:phút:giây + ngày/tháng/năm dùng chung cho các cột thời gian
// cần hiện cả giờ (ngày kiểm tra, ngày các bên xác nhận/ký) ở trang danh
// sách Phiếu 1/Phiếu 2 — xem Phieu1DanhSachPage.tsx/Phieu2DanhSachPage.tsx.
export const dinhDangNgayGio = (value?: string | null): string =>
    value ? dayjs(value).format("HH:mm:ss DD/MM/YYYY") : "--";
