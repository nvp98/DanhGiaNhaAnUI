import { Button, Card, Input, Modal, Select, Space, Tag } from "antd";
import React, { useState } from "react";
import { FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import { useDispatch } from "react-redux";
import {
    useDanhSachNguoiKyKhaDungQuery,
    useDatNguoiKyDuKienMutation,
    useKyPhieuMutation,
    useTienDoKyQuery,
    useTuChoiPhieuMutation,
} from "../../services/chuKyPhieuApi";
import ChuKyPhieuModel from "../../models/ChuKyPhieuModel";
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

// 1 dòng của tiến độ ký — tách riêng để dùng hook useDanhSachNguoiKyKhaDungQuery
// đúng luật Hooks (không gọi hook bên trong .map() ở component cha).
interface BuocKyItemProps {
    buoc: ChuKyPhieuModel;
    dangKy: boolean;
    dangDatNguoiKyDuKien: boolean;
    onKy: (buocId: number, nguoiKyThayId?: number) => void;
    onTuChoi: (buocId: number) => void;
    onDatNguoiKyDuKien: (buocId: number, nguoiKyDuKienId: number) => void;
}

const BuocKyItem: React.FC<BuocKyItemProps> = ({
    buoc,
    dangKy,
    dangDatNguoiKyDuKien,
    onKy,
    onTuChoi,
    onDatNguoiKyDuKien,
}) => {
    const dangChoKy = buoc.trangThai === "CHO_KY";
    // Chỉ cần tải danh sách người đủ điều kiện khi bước còn đang chờ ký (để
    // hiện dropdown "ký thay"/"chỉ định người ký" và tra tên người đã chỉ định).
    const { data: nguoiKhaDung = [] } = useDanhSachNguoiKyKhaDungQuery(buoc.id, { skip: !dangChoKy });

    const [moModal, setMoModal] = useState<"KY_THAY" | "DU_KIEN" | null>(null);
    const [nguoiDuocChon, setNguoiDuocChon] = useState<number | null>(null);

    const tenNguoiDuKien = buoc.nguoiKyDuKienId
        ? nguoiKhaDung.find(nd => nd.id === buoc.nguoiKyDuKienId)?.hoTen
        : undefined;

    const moModalChon = (loai: "KY_THAY" | "DU_KIEN") => {
        setNguoiDuocChon(buoc.nguoiKyDuKienId ?? null);
        setMoModal(loai);
    };

    const xacNhanModal = () => {
        if (!nguoiDuocChon) return;
        if (moModal === "KY_THAY") onKy(buoc.id, nguoiDuocChon);
        else onDatNguoiKyDuKien(buoc.id, nguoiDuocChon);
        setMoModal(null);
    };

    return (
        <>
            <div className="flex justify-between items-center gap-3 bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3">
                <div className="flex items-start gap-3">
                    <div className="text-lg mt-0.5">{iconTrangThaiBuoc(buoc.trangThai)}</div>
                    <div>
                        <div className="font-medium text-zinc-700">
                            Bước {buoc.buocThuTu}: {buoc.tenBuoc}
                        </div>

                        {dangChoKy && buoc.nguoiKyDuKienId && (
                            <div className="text-zinc-500 text-sm">
                                Người ký dự kiến: <b>{tenNguoiDuKien || `#${buoc.nguoiKyDuKienId}`}</b> (chỉ người này ký được)
                            </div>
                        )}

                        {buoc.ghiChu && (
                            <div className="text-gray-500 text-sm">
                                Ghi chú: {buoc.ghiChu}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
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

                    {dangChoKy && (
                        <>
                            <Button size="small" type="primary" loading={dangKy} onClick={() => onKy(buoc.id)}>
                                Ký
                            </Button>

                            {/* Chỉ có ý nghĩa khi >1 người cùng đủ điều kiện ký bước này */}
                            {nguoiKhaDung.length > 1 && (
                                <>
                                    <Button size="small" onClick={() => moModalChon("KY_THAY")}>
                                        Ký thay...
                                    </Button>
                                    <Button size="small" onClick={() => moModalChon("DU_KIEN")}>
                                        Chỉ định người ký...
                                    </Button>
                                </>
                            )}

                            <Button size="small" danger onClick={() => onTuChoi(buoc.id)}>
                                Từ chối
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Modal
                title={moModal === "KY_THAY" ? "Ký thay cho" : "Chỉ định người ký"}
                open={moModal !== null}
                onCancel={() => setMoModal(null)}
                onOk={xacNhanModal}
                okButtonProps={{ disabled: !nguoiDuocChon, loading: dangKy || dangDatNguoiKyDuKien }}
                okText={moModal === "KY_THAY" ? "Ký thay" : "Chỉ định"}
                cancelText="Hủy"
                destroyOnClose
            >
                {moModal === "DU_KIEN" && (
                    <div className="text-zinc-500 text-sm mb-2">
                        Sau khi chỉ định, CHỈ người được chọn mới ký được bước này (người khác dù đủ
                        điều kiện vẫn bị chặn, trừ khi ký thay đúng người đã chỉ định).
                    </div>
                )}
                <Select
                    className="w-full"
                    placeholder="-- Chọn người --"
                    value={nguoiDuocChon ?? undefined}
                    onChange={setNguoiDuocChon}
                    showSearch
                    optionFilterProp="label"
                    options={nguoiKhaDung.map(nd => ({ label: `${nd.hoTen} (${nd.tenDangNhap})`, value: nd.id }))}
                />
            </Modal>
        </>
    );
};

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
    const [datNguoiKyDuKien, { isLoading: dangDatNguoiKyDuKien }] = useDatNguoiKyDuKienMutation();

    const [moModalTuChoi, setMoModalTuChoi] = useState<number | null>(null);
    const [lyDoTuChoi, setLyDoTuChoi] = useState("");

    const xuLyKy = async (buocId: number, nguoiKyThayId?: number) => {
        try {
            await kyPhieu({
                id: buocId,
                loaiDoiTuong,
                doiTuongId,
                body: { nguoiKyThayId },
            }).unwrap();

            dispatch(
                setNotify({
                    typeNotify: "success",
                    titleNotify: nguoiKyThayId ? "Đã ký thay" : "Đã ký",
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

    const xuLyDatNguoiKyDuKien = async (buocId: number, nguoiKyDuKienId: number) => {
        try {
            await datNguoiKyDuKien({
                id: buocId,
                loaiDoiTuong,
                doiTuongId,
                body: { nguoiKyDuKienId },
            }).unwrap();

            dispatch(
                setNotify({
                    typeNotify: "success",
                    titleNotify: "Đã chỉ định người ký",
                    messageNotify: "",
                })
            );
        } catch (error: any) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: error?.data?.message || "Chỉ định người ký thất bại",
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
                    <BuocKyItem
                        key={buoc.id}
                        buoc={buoc}
                        dangKy={dangKy}
                        dangDatNguoiKyDuKien={dangDatNguoiKyDuKien}
                        onKy={xuLyKy}
                        onTuChoi={setMoModalTuChoi}
                        onDatNguoiKyDuKien={xuLyDatNguoiKyDuKien}
                    />
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
