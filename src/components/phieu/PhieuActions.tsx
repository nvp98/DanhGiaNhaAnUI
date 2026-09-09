import { Button, Popconfirm } from "antd";
import React from "react";
import { FaSyncAlt, FaTrash } from "react-icons/fa";

// Id của khung chứa nút trong thanh action cố định — PhieuSignatures portal
// nút Ký/Từ chối của bước đang chờ ký vào đây, để luôn nằm chung 1 thanh với
// Lưu/Gửi ký/Xóa thay vì nằm riêng trong khối chữ ký (xem CotChuKy).
export const PHIEU_ACTIONS_PORTAL_ID = "phieu-actions-fixed-bar";

export interface PhieuActionsProps {
    coTheSua: boolean;
    laTaoMoi: boolean;
    trangThai?: string;
    dangLuu?: boolean;
    dangGuiKy?: boolean;
    // Nút "Làm mới" DUY NHẤT cho cả phiếu (Phiếu 3/4) — thay cho việc lặp lại
    // 1 nút "Tính lại" riêng ở mỗi bảng tự động tính (Bảng 1, Bảng 2...) vốn
    // gây confuse vì tất cả các nút đó thật ra chỉ gọi chung 1 API tính lại
    // toàn phiếu. Chỉ truyền onLamMoi khi phiếu có bảng tự động tính từ
    // Phiếu 1/2 (Phiếu 3/4); ẩn cùng lúc với Lưu/Gửi ký sau khi đã gửi ký
    // (coTheSua = false).
    dangLamMoi?: boolean;
    onLuu?: () => void;
    onLamMoi?: () => void;
    onGuiKy?: () => void;
    onXoa?: () => void;
    extraButtons?: React.ReactNode;
}

export const PhieuActions: React.FC<PhieuActionsProps> = ({
    coTheSua,
    laTaoMoi,
    trangThai,
    dangLuu,
    dangGuiKy,
    dangLamMoi,
    onLuu,
    onLamMoi,
    onGuiKy,
    onXoa,
    extraButtons,
}) => {
    return (
        <>
            {/* Spacer — giữ chỗ trong luồng bình thường vì thanh nút bên dưới
                giờ "fixed" (thoát luồng), nếu không nội dung cuối trang (VD
                khối chữ ký) sẽ bị thanh nút đè lên. */}
            <div className="h-24 no-print" aria-hidden />

            {/* left dùng CSS var --v2-sidebar-width (LayoutV2Component set) để
                né đúng mép sidebar hiện tại (thu gọn/mở rộng), mặc định 0px
                cho các ngữ cảnh không có sidebar (VD in phiếu). */}
            <div className="fixed bottom-0 right-0 left-[var(--v2-sidebar-width,0px)] z-40 bg-white border-t border-zinc-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] transition-[left] duration-200 no-print">
                <div className="flex flex-wrap gap-3 px-4 sm:px-8 py-3">
                    {coTheSua && onLuu && (
                        <Button
                            type="primary"
                            size="large"
                            loading={dangLuu}
                            onClick={onLuu}
                        >
                            {laTaoMoi ? "Lập phiếu" : "Lưu thay đổi"}
                        </Button>
                    )}

                    {!laTaoMoi && coTheSua && onLamMoi && (
                        <Button
                            size="large"
                            icon={<FaSyncAlt />}
                            loading={dangLamMoi}
                            onClick={onLamMoi}
                        >
                            Làm mới
                        </Button>
                    )}

                    {!laTaoMoi && trangThai === "NHAP" && (
                        <>
                            {onGuiKy && (
                                <Button size="large" loading={dangGuiKy} onClick={onGuiKy}>
                                    Gửi ký
                                </Button>
                            )}

                            {onXoa && (
                                <Popconfirm
                                    title="Xóa phiếu"
                                    description="Bạn có chắc muốn xóa phiếu này?"
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    onConfirm={onXoa}
                                >
                                    <Button danger size="large" icon={<FaTrash />}>
                                        Xóa phiếu
                                    </Button>
                                </Popconfirm>
                            )}
                        </>
                    )}

                    {!laTaoMoi && trangThai === "TU_CHOI" && onGuiKy && (
                        <Button size="large" loading={dangGuiKy} onClick={onGuiKy}>
                            Gửi ký lại
                        </Button>
                    )}

                    {extraButtons}
                </div>
            </div>
        </>
    );
};

export default PhieuActions;
