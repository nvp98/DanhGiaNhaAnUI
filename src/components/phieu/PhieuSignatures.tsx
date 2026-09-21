import { Button, Input, Modal, Select } from "antd";
import React, { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
    useDanhSachNguoiKyKhaDungQuery,
    useDatNguoiKyDuKienMutation,
    useKyPhieuMutation,
    useTienDoKyQuery,
    useTuChoiPhieuMutation,
} from "../../services/chuKyPhieuApi";
import { ApiRootV2 } from "../../services/LinkServerV2";
import { useDanhSachMauLuongKyQuery } from "../../services/mauLuongKyApi";
import ChuKyPhieuModel from "../../models/ChuKyPhieuModel";
import { setNotify } from "../../store/notifycationSlide";
import { RootType } from "../../store/types";

export interface PhieuSignaturesProps {
    loaiDoiTuong: string;
    // undefined khi đang lập phiếu mới (chưa lưu) hoặc phiếu đang NHAP (chưa
    // "Gửi ký" nên ChuKyPhieu chưa tồn tại) -> hiển thị khối chữ ký TĨNH theo
    // cấu hình MauLuongKy, không chọn/ký được.
    doiTuongId?: number;
    className?: string;
    onDaDongBo?: () => void;
}

// 1 cột chữ ký tương tác — tương ứng đúng 1 dòng ChuKyPhieu (1 bước, hoặc 1
// trong nhiều người ký song song cùng bước). Tách component riêng để dùng
// hook useDanhSachNguoiKyKhaDungQuery đúng luật Hooks (không gọi trong .map()
// ở component cha).
const CotChuKy: React.FC<{
    buoc: ChuKyPhieuModel;
    nguoiDungHienTaiId?: number;
    onDaDongBo?: () => void;
}> = ({ buoc, nguoiDungHienTaiId, onDaDongBo }) => {
    const dispatch = useDispatch();
    const dangChoKy = buoc.trangThai === "CHO_KY";

    const { data: nguoiKhaDung = [] } = useDanhSachNguoiKyKhaDungQuery(buoc.id);
    const [kyPhieu, { isLoading: dangKy }] = useKyPhieuMutation();
    const [tuChoiPhieu, { isLoading: dangTuChoi }] = useTuChoiPhieuMutation();
    const [datNguoiKyDuKien] = useDatNguoiKyDuKienMutation();

    // nguoiKhaDung đã được server lọc đúng phạm vi của RIÊNG bước này (nhà
    // thầu của phiếu / phòng ban cấu hình / gán trực tiếp — xem
    // ChuKyPhieuService.DanhSachNguoiKyKhaDungAsync). Người đang xem KHÔNG
    // nằm trong danh sách này (VD tài khoản nhà thầu xem cột "Người đánh
    // giá" nội bộ, hoặc ngược lại) thì không được thao tác chọn/ký/từ chối ở
    // cột đó — chỉ nhìn trạng thái, tránh chọn nhầm người khác nhóm.
    const toiDuDieuKien = nguoiDungHienTaiId != null && nguoiKhaDung.some(nd => nd.id === nguoiDungHienTaiId);

    const chiMot = nguoiKhaDung.length === 1;
    const [chonId, setChonId] = useState<number | undefined>(buoc.nguoiKyDuKienId);
    const [moTuChoi, setMoTuChoi] = useState(false);
    const [lyDoTuChoi, setLyDoTuChoi] = useState("");
    const [loiLyDoTuChoi, setLoiLyDoTuChoi] = useState(false);

    // Mặc định chọn sẵn người ký, ưu tiên theo thứ tự — vẫn cho đổi sang người
    // khác (ký thay) ở cả 3 trường hợp, KHÔNG khóa cứng:
    // 1. Đã có NguoiKyDuKienId (Admin/nhóm đã chỉ định trước) -> luôn ưu tiên
    //    giá trị này.
    // 2. Chỉ có đúng 1 người đủ điều kiện -> khỏi cần chọn tay.
    // 3. Nhiều người đủ điều kiện (VD nhiều tài khoản cùng 1 nhà thầu) nhưng
    //    chưa ai chỉ định -> mặc định CHÍNH người đang đăng nhập (đỡ phải tự
    //    tìm tên mình trong dropdown khi đa số trường hợp là tự ký cho mình).
    useEffect(() => {
        if (buoc.nguoiKyDuKienId) setChonId(buoc.nguoiKyDuKienId);
        else if (chiMot) setChonId(nguoiKhaDung[0].id);
        else if (nguoiDungHienTaiId != null && nguoiKhaDung.some(nd => nd.id === nguoiDungHienTaiId))
            setChonId(nguoiDungHienTaiId);
    }, [buoc.nguoiKyDuKienId, chiMot, nguoiKhaDung, nguoiDungHienTaiId]);

    const xuLyChonNguoi = async (id: number) => {
        setChonId(id);
        try {
            await datNguoiKyDuKien({
                id: buoc.id,
                loaiDoiTuong: buoc.loaiDoiTuong,
                doiTuongId: buoc.doiTuongId,
                body: { nguoiKyDuKienId: id },
            }).unwrap();
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Chỉ định người ký thất bại", messageNotify: "" }));
        }
    };

    const xuLyKy = async () => {
        if (!chonId) return;
        try {
            await kyPhieu({
                id: buoc.id,
                loaiDoiTuong: buoc.loaiDoiTuong,
                doiTuongId: buoc.doiTuongId,
                body: { nguoiKyThayId: chonId !== nguoiDungHienTaiId ? chonId : undefined },
            }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã ký", messageNotify: "" }));
            onDaDongBo?.();
        } catch (error: any) {
            // Lỗi 409 do race condition (2 người cùng đủ điều kiện bấm Ký gần
            // như đồng thời — xem ChuKyPhieuService.LuuKhongTrungLapAsync) đã
            // có message rõ ràng từ backend, hiện y nguyên. useTienDoKyQuery
            // tự tải lại (RTK Query invalidatesTags áp dụng cả khi lỗi) để
            // cột chữ ký hiện đúng người đã ký thắng; gọi thêm onDaDongBo để
            // đồng bộ luôn trạng thái tổng của phiếu theo tiến độ ký mới nhất.
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Ký thất bại", messageNotify: "" }));
            onDaDongBo?.();
        }
    };

    const xuLyTuChoi = async () => {
        // Chặn ngay trên FE thay vì chỉ disable nút OK — disable im lặng dễ
        // khiến người dùng không hiểu vì sao không bấm được; ở đây bấm được
        // nhưng hiện rõ lỗi để họ biết cần nhập gì.
        if (!lyDoTuChoi.trim()) {
            setLoiLyDoTuChoi(true);
            return;
        }
        try {
            await tuChoiPhieu({
                id: buoc.id,
                loaiDoiTuong: buoc.loaiDoiTuong,
                doiTuongId: buoc.doiTuongId,
                body: { ghiChu: lyDoTuChoi },
            }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã từ chối ký", messageNotify: "" }));
            setMoTuChoi(false);
            setLyDoTuChoi("");
            onDaDongBo?.();
        } catch (error: any) {
            // Cùng lý do với xuLyKy — có thể do race condition (bước vừa được
            // người khác ký/từ chối xong), gọi onDaDongBo để đồng bộ lại.
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Từ chối thất bại", messageNotify: "" }));
            onDaDongBo?.();
        }
    };
console.log(buoc);
    return (
        <div className="chu-ky-block">
            <div className="chu-ky-title">{buoc.tenBuoc}</div>

            {!dangChoKy ? (
                // Đã ký / đã từ chối — hiển thị tĩnh cho cả màn hình lẫn bản in.
                // Đã ký: hiện ẢNH chữ ký (nếu người ký là nội bộ và có ảnh
                // "đang sử dụng" — xem ChuKyPhieuService.TienDoKyAsync), nhà
                // thầu không quản lý ảnh chữ ký trong hệ thống nên chỉ hiện
                // icon √ (cũng là fallback khi nội bộ chưa từng upload ảnh).
                <div className="chu-ky-space">
                    {buoc.trangThai === "DA_DUYET" ? (
                        <>
                            {buoc.duongDanChuKy ? (
                                <img
                                    src={`${ApiRootV2}${buoc.duongDanChuKy}`}
                                    alt="Chữ ký"
                                    className="chu-ky-anh"
                                />
                            ) : (
                                <div className="chu-ky-icon-wrap">
                                    <FaCheckCircle />
                                </div>
                            )}
                            <span>{buoc.nguoiKyHoTen || "(đã ký)"}</span>
                        </>
                    ) : (
                        <span>{`Từ chối${buoc.ghiChu ? ": " + buoc.ghiChu : ""}`}</span>
                    )}
                </div>
            ) : (
                <>
                    {/* Bản in giấy: vẫn để trống dòng ký tay như thiết kế cũ */}
                    <div className="chu-ky-space print-only">
                        <span>(Ký, ghi rõ họ tên)</span>
                    </div>

                    {/* Màn hình: chỉ người ĐỦ ĐIỀU KIỆN đúng cột này (cùng nhà
                        thầu/phòng ban/được gán trực tiếp) mới thấy Select +
                        nút Ký/Từ chối — người ngoài nhóm chỉ xem trạng thái,
                        không được chọn thay cho nhóm khác. */}
                    {toiDuDieuKien ? (
                        <div className="chu-ky-interactive no-print">
                            {chiMot ? (
                                <div className="chu-ky-ten-duoc-chon">{nguoiKhaDung[0].hoTen}</div>
                            ) : (
                                <Select
                                    className="w-full"
                                    placeholder="-- Chọn người ký --"
                                    value={chonId}
                                    onChange={xuLyChonNguoi}
                                    showSearch
                                    optionFilterProp="label"
                                    options={nguoiKhaDung.map(nd => ({ label: `${nd.hoTen} (${nd.tenDangNhap})`, value: nd.id }))}
                                />
                            )}

                            <div className="mt-2 flex gap-2">
                                <Button size="small" type="primary" loading={dangKy} disabled={!chonId} onClick={xuLyKy}>
                                    Ký
                                </Button>
                                <Button size="small" danger onClick={() => { setMoTuChoi(true); setLoiLyDoTuChoi(false); }}>
                                    Từ chối
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="chu-ky-space no-print">
                            <span className="text-gray-400 italic">Chờ ký</span>
                        </div>
                    )}
                </>
            )}

            <Modal
                title="Lý do từ chối"
                open={moTuChoi}
                onCancel={() => { setMoTuChoi(false); setLoiLyDoTuChoi(false); }}
                onOk={xuLyTuChoi}
                okButtonProps={{ loading: dangTuChoi }}
                okText="Từ chối"
                cancelText="Hủy"
                destroyOnClose
            >
                <Input.TextArea
                    rows={3}
                    placeholder="Nhập lý do từ chối..."
                    value={lyDoTuChoi}
                    onChange={e => { setLyDoTuChoi(e.target.value); if (e.target.value.trim()) setLoiLyDoTuChoi(false); }}
                    status={loiLyDoTuChoi ? "error" : undefined}
                />
                {loiLyDoTuChoi && (
                    <div className="text-red-500 text-sm mt-1">Vui lòng nhập lý do từ chối</div>
                )}
            </Modal>
        </div>
    );
};

export const PhieuSignatures: React.FC<PhieuSignaturesProps> = ({
    loaiDoiTuong,
    doiTuongId,
    className = "",
    onDaDongBo,
}) => {
    const nguoiDungHienTaiId = useSelector((state: RootType) => state.authV2.nguoiDung?.id);

    // refetchOnMountOrArgChange: người khác (nhà thầu/phòng ban khác) có thể
    // vừa ký/từ chối ở phiên khác — ép gọi lại mỗi lần vào trang thay vì dùng
    // cache cũ, xem giải thích ở Phieu1FormPage.tsx.
    const { data: tienDo = [] } = useTienDoKyQuery(
        { loaiDoiTuong, doiTuongId: doiTuongId ?? 0 },
        { skip: !doiTuongId, refetchOnMountOrArgChange: true }
    );
    // Dùng làm khối chữ ký TĨNH khi chưa "Gửi ký" (ChuKyPhieu chưa tồn tại) —
    // vẫn hiển thị đúng tên bước theo cấu hình Luồng ký hiện hành.
    const { data: mauLuongKy = [] } = useDanhSachMauLuongKyQuery({ loaiPhieu: loaiDoiTuong });

    const dungTinh = !doiTuongId || tienDo.length === 0;
    const cotTinh = [...mauLuongKy].sort((a, b) => a.buocThuTu - b.buocThuTu || a.id - b.id);
    const cotDong = [...tienDo].sort((a, b) => a.buocThuTu - b.buocThuTu || a.id - b.id);

    const soCot = dungTinh ? cotTinh.length : cotDong.length;
    const gridColsClass = soCot >= 3 ? "cols-3" : "cols-2";

    return (
        <div className={`phieu-chu-ky ${gridColsClass} ${className}`}>
            {dungTinh
                ? cotTinh.map(mau => (
                      <div key={mau.id} className="chu-ky-block">
                          <div className="chu-ky-title">{mau.tenBuoc}</div>
                          <div className="chu-ky-space">
                              <span>(Ký, ghi rõ họ tên)</span>
                          </div>
                      </div>
                  ))
                : cotDong.map(buoc => (
                      <CotChuKy
                          key={buoc.id}
                          buoc={buoc}
                          nguoiDungHienTaiId={nguoiDungHienTaiId}
                          onDaDongBo={onDaDongBo}
                      />
                  ))}
        </div>
    );
};

export default PhieuSignatures;
