import { Button, DatePicker, Popconfirm, Select, Tag } from "antd";
import dayjs, { Dayjs } from "dayjs";
import React, { useState } from "react";
import { FaCheck, FaPlus, FaTimes } from "react-icons/fa";

import { DoanRequest } from "../../models/DoanModel";
import { useDanhSachBuaAnQuery } from "../../services/buaAnApi";
import { useDanhSachDiaDiemNhaAnQuery } from "../../services/diaDiemNhaAnApiV2";

export interface DoanBuilderItem extends DoanRequest {
    // Key thật (đoạn đã lưu, edit mode) hoặc key tạm (build mode, chưa lưu).
    key: number | string;
}

export interface DoanBuilderProps {
    items: DoanBuilderItem[];
    coTheSua: boolean;
    dangThem?: boolean;
    // Có thể trả Promise (API mode — cha await themDoanPhieu3/4) hoặc không
    // (build mode — cha chỉ mutate state cục bộ) — xuLyLuu bên dưới await
    // tuần tự từng dòng, cả 2 trường hợp đều hoạt động đúng.
    onThem: (doan: DoanRequest) => void | Promise<void>;
    onXoa: (key: number | string) => void;
    // Giới hạn "Từ ngày"/"Đến ngày" chỉ trong khoảng này (VD tháng/năm báo
    // cáo đang chọn ở Phiếu 3, xem Phieu3FormPage.tsx) — để trống = không
    // giới hạn (Phiếu 4 vẫn cho đoạn vượt ranh giới tháng như trước).
    ngayToiThieu?: Dayjs;
    ngayToiDa?: Dayjs;
}

interface DongNhap {
    key: string;
    tuNgay: Dayjs | null;
    tuBuaAnId?: number;
    denNgay: Dayjs | null;
    denBuaAnId?: number;
    diaDiemIds: number[];
}

const dongRong = (): DongNhap => ({
    key: `dong-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tuNgay: null,
    tuBuaAnId: undefined,
    denNgay: null,
    denBuaAnId: undefined,
    diaDiemIds: [],
});

const dongHopLe = (d: DongNhap): boolean =>
    !!d.tuNgay && !!d.denNgay && d.tuBuaAnId !== undefined && d.denBuaAnId !== undefined && d.diaDiemIds.length > 0;

// Khai báo nhiều "đoạn" thời gian — mỗi đoạn = khung (Bữa ăn, Ngày) bắt đầu
// -> (Bữa ăn, Ngày) kết thúc (CẢ 2 ĐẦU đều bao gồm bữa được chọn) + danh
// sách địa điểm ăn áp dụng trong đoạn đó. Thay thế hoàn toàn suy luận "địa
// điểm rõ ràng" cũ — cho phép nhà thầu đổi tập địa điểm phụ trách GIỮA kỳ
// báo cáo (VD nửa đầu tháng quản A,B,C; nửa sau quản D,E,F).
// Dùng chung cho Phiếu 3 (1 bộ đoạn / cả phiếu) và Phiếu 4 (1 bộ đoạn /
// từng cột nhà thầu). 2 chế độ do component cha quyết định qua onThem/onXoa:
// - Build mode (form tạo mới): cha giữ state cục bộ, chưa gọi API.
// - API mode (đang sửa phiếu đã tồn tại, coTheSua=true): cha gọi
//   themDoanPhieu3/4 - xoaDoanPhieu3/4.
//
// Form nhập kiểu "form array" — bấm "Thêm dòng" chỉ RENDER thêm 1 dòng chọn
// trống bên dưới để chuẩn bị nhiều đoạn cùng lúc, KHÔNG gọi onThem (không
// lưu/gọi API) ngay. Chỉ khi bấm "Lưu" mới lần lượt (tuần tự, giữ đúng thứ
// tự đoạn) gọi onThem cho từng dòng đã điền đủ — khác hành vi cũ (mỗi dòng
// gọi onThem/API ngay khi điền xong 1 đoạn).
export const DoanBuilder: React.FC<DoanBuilderProps> = ({ items, coTheSua, dangThem, onThem, onXoa, ngayToiThieu, ngayToiDa }) => {
    const { data: danhSachBuaAn = [] } = useDanhSachBuaAnQuery();
    // Lấy ĐẦY ĐỦ để tra tên cho đoạn đã lưu (kể cả địa điểm đã ngừng hoạt
    // động sau này — giữ lịch sử); dropdown chọn mới chỉ lấy địa điểm đang hoạt động.
    const { data: danhSachDiaDiem = [] } = useDanhSachDiaDiemNhaAnQuery();
    const diaDiemChon = danhSachDiaDiem.filter((dd) => dd.isActive);

    const [dsDong, setDsDong] = useState<DongNhap[]>([dongRong()]);
    const [dangLuu, setDangLuu] = useState(false);

    // Loại bỏ dòng "ALL" (tổng cộng, dùng cho Com_ThucTe_ALL của DuLieuCom) —
    // không phải 1 bữa ăn thật, không cho chọn làm bữa bắt đầu/kết thúc đoạn.
    const buaAnSapXep = danhSachBuaAn
        .filter((b) => b.codeBuaAn.toUpperCase() !== "ALL")
        .sort((a, b) => a.codeBuaAn.localeCompare(b.codeBuaAn));
    const tenBuaAn = (id?: number) => danhSachBuaAn.find((b) => b.id === id)?.tenBuaAn ?? "";
    const tenDiaDiem = (id: number) => danhSachDiaDiem.find((d) => d.id === id)?.diaDiem ?? `#${id}`;

    const soDongHopLe = dsDong.filter(dongHopLe).length;

    const ngayBiVoHieuHoa = (current: Dayjs) =>
        (!!ngayToiThieu && current.isBefore(ngayToiThieu, "day")) ||
        (!!ngayToiDa && current.isAfter(ngayToiDa, "day"));

    const capNhatDong = (key: string, thayDoi: Partial<DongNhap>) => {
        setDsDong((ds) => ds.map((d) => (d.key === key ? { ...d, ...thayDoi } : d)));
    };

    const themDongMoi = () => setDsDong((ds) => [...ds, dongRong()]);

    const xoaDongNhap = (key: string) => {
        setDsDong((ds) => {
            const conLai = ds.filter((d) => d.key !== key);
            return conLai.length > 0 ? conLai : [dongRong()];
        });
    };

    const xuLyLuu = async () => {
        const hopLe = dsDong.filter(dongHopLe);
        if (hopLe.length === 0) return;
        setDangLuu(true);
        try {
            for (const d of hopLe) {
                await onThem({
                    tuNgay: d.tuNgay!.format("YYYY-MM-DD"),
                    tuBuaAnId: d.tuBuaAnId!,
                    denNgay: d.denNgay!.format("YYYY-MM-DD"),
                    denBuaAnId: d.denBuaAnId!,
                    diaDiemNhaAnIds: d.diaDiemIds,
                });
            }
        } finally {
            setDangLuu(false);
        }
        setDsDong((ds) => {
            const conLai = ds.filter((d) => !dongHopLe(d));
            return conLai.length > 0 ? conLai : [dongRong()];
        });
    };

    return (
        <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
                {items.map((doan) =>
                    coTheSua ? (
                        <Popconfirm
                            key={doan.key}
                            title="Xóa đoạn thời gian này"
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => onXoa(doan.key)}
                        >
                            <Tag
                                color="blue"
                                className="cursor-pointer text-xs"
                                style={{ whiteSpace: "normal", wordBreak: "break-word", maxWidth: "100%" }}
                            >
                                {tenBuaAn(doan.tuBuaAnId)} {dayjs(doan.tuNgay).format("DD/MM/YY")}
                                {" → "}
                                {tenBuaAn(doan.denBuaAnId)} {dayjs(doan.denNgay).format("DD/MM/YY")}
                                {" · "}
                                {doan.diaDiemNhaAnIds.map((id) => tenDiaDiem(id)).join(", ")}
                                <FaTimes className="inline ml-1.5 align-[-1px]" />
                            </Tag>
                        </Popconfirm>
                    ) : (
                        <Tag
                            key={doan.key}
                            color="blue"
                            className="text-xs"
                            style={{ whiteSpace: "normal", wordBreak: "break-word", maxWidth: "100%" }}
                        >
                            {tenBuaAn(doan.tuBuaAnId)} {dayjs(doan.tuNgay).format("DD/MM/YY")}
                            {" → "}
                            {tenBuaAn(doan.denBuaAnId)} {dayjs(doan.denNgay).format("DD/MM/YY")}
                            {" · "}
                            {doan.diaDiemNhaAnIds.map((id) => tenDiaDiem(id)).join(", ")}
                        </Tag>
                    )
                )}
                {items.length === 0 && <span className="text-gray-400 text-xs">Chưa khai báo đoạn nào</span>}
            </div>

            {coTheSua && (
                <div className="flex flex-col gap-1.5">
                    {dsDong.map((d) => (
                        <div key={d.key} className="flex flex-wrap items-end gap-1">
                            <div className="w-[100px]">
                                <div className="mb-0.5 text-[11px] text-gray-500 leading-tight">Bữa bắt đầu</div>
                                <Select
                                    className="w-full"
                                    size="small"
                                    placeholder="Bữa"
                                    value={d.tuBuaAnId}
                                    onChange={(v) => capNhatDong(d.key, { tuBuaAnId: v })}
                                >
                                    {buaAnSapXep.map((b) => (
                                        <Select.Option key={b.id} value={b.id}>{b.tenBuaAn}</Select.Option>
                                    ))}
                                </Select>
                            </div>
                            <div className="w-[118px]">
                                <div className="mb-0.5 text-[11px] text-gray-500 leading-tight">Từ ngày</div>
                                <DatePicker
                                    className="w-full"
                                    size="small"
                                    format="DD/MM/YYYY"
                                    value={d.tuNgay}
                                    disabledDate={ngayBiVoHieuHoa}
                                    onChange={(v) => capNhatDong(d.key, { tuNgay: v })}
                                />
                            </div>
                            <div className="w-[100px]">
                                <div className="mb-0.5 text-[11px] text-gray-500 leading-tight">Bữa kết thúc</div>
                                <Select
                                    className="w-full"
                                    size="small"
                                    placeholder="Bữa"
                                    value={d.denBuaAnId}
                                    onChange={(v) => capNhatDong(d.key, { denBuaAnId: v })}
                                >
                                    {buaAnSapXep.map((b) => (
                                        <Select.Option key={b.id} value={b.id}>{b.tenBuaAn}</Select.Option>
                                    ))}
                                </Select>
                            </div>
                            <div className="w-[118px]">
                                <div className="mb-0.5 text-[11px] text-gray-500 leading-tight">Đến ngày</div>
                                <DatePicker
                                    className="w-full"
                                    size="small"
                                    format="DD/MM/YYYY"
                                    value={d.denNgay}
                                    disabledDate={ngayBiVoHieuHoa}
                                    onChange={(v) => capNhatDong(d.key, { denNgay: v })}
                                />
                            </div>
                            <div className="flex-1 min-w-[160px]">
                                <div className="mb-0.5 text-[11px] text-gray-500 leading-tight">Địa điểm áp dụng</div>
                                <Select
                                    className="w-full"
                                    size="small"
                                    mode="multiple"
                                    maxTagCount="responsive"
                                    placeholder="-- Địa điểm --"
                                    showSearch
                                    optionFilterProp="children"
                                    value={d.diaDiemIds}
                                    onChange={(v) => capNhatDong(d.key, { diaDiemIds: v })}
                                >
                                    {diaDiemChon.map((dd) => (
                                        <Select.Option key={dd.id} value={dd.id}>{dd.diaDiem}</Select.Option>
                                    ))}
                                </Select>
                            </div>
                            {dsDong.length > 1 && (
                                <Button
                                    size="small"
                                    icon={<FaTimes />}
                                    title="Bỏ dòng này"
                                    onClick={() => xoaDongNhap(d.key)}
                                />
                            )}
                        </div>
                    ))}

                    <div className="flex items-center gap-2 mt-0.5">
                        <Button size="small" icon={<FaPlus />} onClick={themDongMoi}>
                            Thêm dòng
                        </Button>
                        <Button
                            size="small"
                            type="primary"
                            icon={<FaCheck />}
                            loading={dangLuu || dangThem}
                            disabled={soDongHopLe === 0}
                            onClick={xuLyLuu}
                        >
                            Lưu{soDongHopLe > 0 ? ` (${soDongHopLe})` : ""}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
