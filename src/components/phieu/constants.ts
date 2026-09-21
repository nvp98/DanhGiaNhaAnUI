export const DS_TRANG_THAI_PHIEU = [
    { value: "NHAP", label: "Nháp", color: "default" },
    { value: "CHO_KY", label: "Chờ ký", color: "processing" },
    { value: "DA_DUYET", label: "Đã duyệt", color: "success" },
    { value: "TU_CHOI", label: "Bị từ chối", color: "error" },
];

export const tenTrangThaiPhieu = (trangThai?: string) =>
    DS_TRANG_THAI_PHIEU.find(t => t.value === trangThai)?.label ?? (trangThai || "");

export const mauTrangThaiPhieu = (trangThai?: string) =>
    DS_TRANG_THAI_PHIEU.find(t => t.value === trangThai)?.color ?? "default";
