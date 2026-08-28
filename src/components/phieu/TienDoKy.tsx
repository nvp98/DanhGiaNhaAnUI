import { Button, Card, Input, Modal, Space, Tag } from "antd";
import React, { useState } from "react";
import { FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import { useDispatch } from "react-redux";
import {
    useKyPhieuMutation,
    useTienDoKyQuery,
    useTuChoiPhieuMutation,
} from "../../services/chuKyPhieuApi";
import { setNotify } from "../../store/notifycationSlide";

const iconTrangThaiBuoc = (trangThai: string) => {
    if (trangThai === "DA_DUYET") return <FaCheckCircle className="text-green-500" />;
    if (trangThai === "TU_CHOI") return <FaTimesCircle className="text-red-500" />;
    return <FaClock className="text-amber-500" />;
};

export interface TienDoKyProps {
    loaiDoiTuong: string;
    doiTuongId: number;
    onDaDongBo?: () => void;
}

export const TienDoKy: React.FC<TienDoKyProps> = ({
    loaiDoiTuong,
    doiTuongId,
    onDaDongBo,
}) => {
    const dispatch = useDispatch();

    const {
        data: tienDo = [],
        isFetching,
    } = useTienDoKyQuery({
        loaiDoiTuong,
        doiTuongId,
    });

    const [kyPhieu, { isLoading: dangKy }] = useKyPhieuMutation();
    const [tuChoiPhieu, { isLoading: dangTuChoi }] = useTuChoiPhieuMutation();

    const [moModalTuChoi, setMoModalTuChoi] = useState<number | null>(null);
    const [lyDoTuChoi, setLyDoTuChoi] = useState("");

    const xuLyKy = async (buocId: number) => {
        try {
            await kyPhieu({
                id: buocId,
                loaiDoiTuong,
                doiTuongId,
                body: {},
            }).unwrap();

            dispatch(
                setNotify({
                    typeNotify: "success",
                    titleNotify: "Đã ký",
                    messageNotify: "",
                })
            );

            onDaDongBo?.();
        } catch (error: any) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: error?.data?.message || "Ký thất bại",
                    messageNotify: "",
                })
            );
        }
    };

    const xuLyTuChoi = async () => {
        if (moModalTuChoi === null) return;

        try {
            await tuChoiPhieu({
                id: moModalTuChoi,
                loaiDoiTuong,
                doiTuongId,
                body: {
                    ghiChu: lyDoTuChoi,
                },
            }).unwrap();

            dispatch(
                setNotify({
                    typeNotify: "success",
                    titleNotify: "Đã từ chối ký",
                    messageNotify: "",
                })
            );

            setMoModalTuChoi(null);
            setLyDoTuChoi("");

            onDaDongBo?.();
        } catch (error: any) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: error?.data?.message || "Từ chối thất bại",
                    messageNotify: "",
                })
            );
        }
    };

    return (
        <Card
            title="Tiến độ ký"
            loading={isFetching}
            className="mt-4 rounded-xl"
            bordered
        >
            <Space direction="vertical" size={10} className="w-full">
                {tienDo.map(buoc => (
                    <div
                        key={buoc.id}
                        className="flex justify-between items-center gap-3 bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3"
                    >
                        <div className="flex items-start gap-3">
                            <div className="text-lg mt-0.5">
                                {iconTrangThaiBuoc(buoc.trangThai)}
                            </div>
                            <div>
                                <div className="font-medium text-zinc-700">
                                    Bước {buoc.buocThuTu}: {buoc.tenBuoc}
                                </div>

                                {buoc.ghiChu && (
                                    <div className="text-gray-500 text-sm">
                                        Ghi chú: {buoc.ghiChu}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Tag
                                color={
                                    buoc.trangThai === "DA_DUYET"
                                        ? "success"
                                        : buoc.trangThai === "TU_CHOI"
                                        ? "error"
                                        : "processing"
                                }
                            >
                                {buoc.trangThai === "DA_DUYET"
                                    ? "Đã duyệt"
                                    : buoc.trangThai === "TU_CHOI"
                                    ? "Từ chối"
                                    : "Chờ ký"}
                            </Tag>

                            {buoc.trangThai === "CHO_KY" && (
                                <>
                                    <Button
                                        size="small"
                                        type="primary"
                                        loading={dangKy}
                                        onClick={() => xuLyKy(buoc.id)}
                                    >
                                        Ký
                                    </Button>

                                    <Button
                                        size="small"
                                        danger
                                        onClick={() => setMoModalTuChoi(buoc.id)}
                                    >
                                        Từ chối
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {tienDo.length === 0 && (
                    <div className="text-gray-400">
                        Chưa khởi tạo luồng ký cho loại phiếu này.
                    </div>
                )}
            </Space>

            <Modal
                title="Lý do từ chối"
                open={moModalTuChoi !== null}
                onCancel={() => setMoModalTuChoi(null)}
                onOk={xuLyTuChoi}
                okButtonProps={{
                    loading: dangTuChoi,
                    disabled: !lyDoTuChoi.trim(),
                }}
                okText="Từ chối"
                cancelText="Hủy"
            >
                <Input.TextArea
                    rows={3}
                    placeholder="Nhập lý do từ chối..."
                    value={lyDoTuChoi}
                    onChange={e => setLyDoTuChoi(e.target.value)}
                />
            </Modal>
        </Card>
    );
};

export default TienDoKy;
