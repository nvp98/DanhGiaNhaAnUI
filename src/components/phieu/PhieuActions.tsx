import { Button, Popconfirm } from "antd";
import React from "react";
import { FaTrash } from "react-icons/fa";

export interface PhieuActionsProps {
    coTheSua: boolean;
    laTaoMoi: boolean;
    trangThai?: string;
    dangLuu?: boolean;
    dangGuiKy?: boolean;
    onLuu?: () => void;
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
    onLuu,
    onGuiKy,
    onXoa,
    extraButtons,
}) => {
    return (
        <div className="flex gap-3 mb-6 mt-5 pt-4 border-t border-zinc-100 no-print">
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
    );
};

export default PhieuActions;
