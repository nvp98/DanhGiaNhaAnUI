// Định dạng số dùng chung cho Bảng 1/2 của Phiếu 3/4 (cả màn hình lẫn xuất
// Word) — số lẻ (có phần thập phân) luôn hiện ĐÚNG 2 chữ số sau dấu phẩy,
// số chẵn (nguyên) thì hiện nguyên, KHÔNG thêm ",00" vô nghĩa. Dùng chung 1
// hàm để màn hình và file Word xuất ra luôn khớp nhau.
export const dinhDangSo = (v: number): string => {
    // Tròn 2 chữ số TRƯỚC khi xét chẵn/lẻ — tránh sai số dấu phẩy động (VD
    // tổng cộng dồn nhiều số thập phân ra 4.000000000000001) bị coi nhầm là
    // số lẻ.
    const vTron = Math.round(v * 100) / 100;
    const laSoNguyen = Number.isInteger(vTron);
    return vTron.toLocaleString("vi-VN", {
        minimumFractionDigits: laSoNguyen ? 0 : 2,
        maximumFractionDigits: 2,
    });
};

export const dinhDangPhanTram = (v: number): string => `${dinhDangSo(v)}%`;
