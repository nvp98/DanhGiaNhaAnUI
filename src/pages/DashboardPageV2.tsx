import React, { useEffect, useMemo, useState } from "react";
import LayoutV2Component from "../components/LayoutV2Component";
import { useSelector } from "react-redux";
import { RootType } from "../store/types";
import { useNavigate } from "react-router-dom";
import { Button, DatePicker, Select, Spin } from "antd";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);
import { FaChartLine } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";
import { useDanhSachDiaDiemNhaAnQuery } from "../services/diaDiemNhaAnApiV2";
import { useDanhSachBuaAnQuery } from "../services/buaAnApi";
import { useLayThongKeDashboardQuery } from "../services/dashboardApiV2";
import NhaAnModel from "../models/NhaAnModel";
import BuaAnModel from "../models/BuaAnModel";
import StatCardComponent from "../components/StatCardComponent";
import PieChartDanhGiaComponent from "../components/PieChartDanhGiaComponent";
import BarChartTyLeNgayComponent from "../components/BarChartTyLeNgayComponent";
import BarChartTheoDiaDiemComponent from "../components/BarChartTheoDiaDiemComponent";

const { RangePicker } = DatePicker;

// Sentinel đại diện "Tất cả" trong Select địa điểm (multi-select) — không
// khớp ID thật nào (ID nhà ăn trong DB bắt đầu từ 1), nên dùng để FE tự lọc
// ra trước khi gửi API (xem diaDiemIds trong useLayThongKeDashboardQuery).
const TAT_CA_DIA_DIEM = 0;

// Chiều cao đã bị LayoutV2Component "ăn" mất trước khi tới nội dung trang
// này — Header (64px, xem CHIEU_CAO_THANH_TREN ở LayoutV2Component.tsx) +
// margin/padding của Content (lg:m-6 lg:p-6 = 24px mỗi phía). Trừ ra để toàn
// bộ dashboard gọn trong 1 màn hình, không cần cuộn trang.
const CHIEU_CAO_DA_DUNG = 64 + 24 * 2 + 24 * 2;

interface TuanTrongKhoang {
    nhan: string;
    gia: string;
    batDau: Dayjs;
    ketThuc: Dayjs;
}

// Liệt kê các tuần ISO (Thứ 2 -> Chủ nhật) nằm trong khoảng [tuNgay, denNgay]
// đang chọn ở filter "Ngày" — khoảng xuyên nhiều năm thì liệt kê đủ các tuần
// của từng năm, không chỉ riêng năm hiện tại.
const tinhDanhSachTuan = (tuNgay: Dayjs, denNgay: Dayjs): TuanTrongKhoang[] => {
    const ds: TuanTrongKhoang[] = [];
    let con = tuNgay.startOf("isoWeek");
    const cuoi = denNgay.endOf("isoWeek");
    while (con.isBefore(cuoi) || con.isSame(cuoi)) {
        const nam = con.isoWeekYear();
        const tuan = con.isoWeek();
        ds.push({
            nhan: `Tuần ${tuan} - ${nam}`,
            gia: `${nam}-${tuan}`,
            batDau: con.startOf("isoWeek"),
            ketThuc: con.endOf("isoWeek"),
        });
        con = con.add(1, "week");
    }
    return ds;
};

interface ThangTrongKhoang {
    nhan: string;
    gia: string;
}

// Liệt kê các tháng nằm trong khoảng [tuNgay, denNgay] đang chọn ở filter
// "Ngày" — tương tự tinhDanhSachTuan, chỉ khác đơn vị là tháng thay vì tuần.
const tinhDanhSachThang = (tuNgay: Dayjs, denNgay: Dayjs): ThangTrongKhoang[] => {
    const ds: ThangTrongKhoang[] = [];
    let con = tuNgay.startOf("month");
    const cuoi = denNgay.endOf("month");
    while (con.isBefore(cuoi) || con.isSame(cuoi)) {
        const nam = con.year();
        const thang = con.month() + 1;
        ds.push({
            nhan: `Tháng ${thang} - ${nam}`,
            gia: `${nam}-${String(thang).padStart(2, "0")}`,
        });
        con = con.add(1, "month");
    }
    return ds;
};

// Module "Dashboard" — chuyển từ báo cáo Power BI nhúng iframe (DashboardPage.tsx
// hệ v1 cũ) sang tự vẽ bằng chart.js, dùng chung authV2. Số liệu lấy từ
// DashboardController/Summary (BE tổng hợp sẵn bằng SQL, không tải thô vì
// KetQuaDanhGia/DuLieuCom có tới hàng triệu dòng).
const DashboardPageV2: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const navigator = useNavigate();

    // State đang chọn trên form filter — CHƯA gọi API ngay, chỉ khi bấm "Tìm"
    // (xem boLocDaApDung + xuLyTimKiem) mới áp dụng, tránh refetch (quét SQL
    // aggregate trên hàng triệu dòng) mỗi lần đổi 1 ô filter.
    const [diaDiemIds, setDiaDiemIds] = useState<number[]>([TAT_CA_DIA_DIEM]);
    const [codeBuaAnList, setCodeBuaAnList] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(6, "month").startOf("day"), dayjs().endOf("day")]);
    // "Ngày" là khoảng bao ngoài độc lập, không bị Tháng/Tuần ghi đè — chọn
    // Tháng/Tuần chỉ thêm điều kiện lọc kết hợp (AND với Ngày, OR giữa các
    // tháng/tuần đã chọn trong cùng nhóm), xem DashboardController.GetSummary.
    const [tuanDaChonList, setTuanDaChonList] = useState<string[]>([]);
    const [thangDaChonList, setThangDaChonList] = useState<string[]>([]);

    // Danh sách tuần/tháng để chọn phụ thuộc trực tiếp vào khoảng "Ngày"
    // đang chọn — đổi rangedate thì danh sách tự cập nhật theo.
    const danhSachTuan = useMemo(() => tinhDanhSachTuan(dateRange[0], dateRange[1]), [dateRange]);
    const danhSachThang = useMemo(() => tinhDanhSachThang(dateRange[0], dateRange[1]), [dateRange]);

    const [boLocDaApDung, setBoLocDaApDung] = useState({ diaDiemIds, codeBuaAnList, dateRange, tuanDaChonList, thangDaChonList });

    const { data: dataNhaAn } = useDanhSachDiaDiemNhaAnQuery();
    const { data: dataBuaAn } = useDanhSachBuaAnQuery();

    const { data: thongKe, isFetching } = useLayThongKeDashboardQuery({
        tuNgay: boLocDaApDung.dateRange[0].format("YYYY-MM-DD"),
        denNgay: boLocDaApDung.dateRange[1].format("YYYY-MM-DD"),
        diaDiemIds: boLocDaApDung.diaDiemIds.includes(TAT_CA_DIA_DIEM) ? undefined : boLocDaApDung.diaDiemIds,
        codeBuaAnList: boLocDaApDung.codeBuaAnList.length > 0 ? boLocDaApDung.codeBuaAnList : undefined,
        tuanDaChon: boLocDaApDung.tuanDaChonList.length > 0 ? boLocDaApDung.tuanDaChonList : undefined,
        thangDaChon: boLocDaApDung.thangDaChonList.length > 0 ? boLocDaApDung.thangDaChonList : undefined,
    });

    const xuLyTimKiem = () => {
        setBoLocDaApDung({ diaDiemIds, codeBuaAnList, dateRange, tuanDaChonList, thangDaChonList });
    };

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        } else if (!authV2.nguoiDung?.laAdmin) {
            navigator("/v2");
        }
    }, []);

    if (!authV2.isAuthenticated || !authV2.nguoiDung?.laAdmin) {
        return null;
    }

    const soNguoiDungDinhDang = (so: number) => so.toLocaleString("vi-VN");

    // "Tất cả" và địa điểm cụ thể loại trừ nhau: chọn "Tất cả" thì bỏ hết các
    // địa điểm cụ thể đang chọn; chọn 1 địa điểm cụ thể thì tự bỏ "Tất cả".
    // Bỏ hết lựa chọn (mảng rỗng) thì quay lại mặc định "Tất cả".
    const xuLyChonDiaDiem = (vals: number[]) => {
        const vuaThem = vals.filter((v) => !diaDiemIds.includes(v));
        if (vuaThem.includes(TAT_CA_DIA_DIEM)) {
            setDiaDiemIds([TAT_CA_DIA_DIEM]);
            return;
        }
        const diaDiemCuThe = vals.filter((v) => v !== TAT_CA_DIA_DIEM);
        setDiaDiemIds(diaDiemCuThe.length > 0 ? diaDiemCuThe : [TAT_CA_DIA_DIEM]);
    };

    return <LayoutV2Component>
        <div className="flex flex-col" style={{ height: `calc(100vh - ${CHIEU_CAO_DA_DUNG}px)` }}>
            <div className="flex justify-start items-center gap-2 mb-3 shrink-0">
                <div className="w-[36px] h-[36px] flex justify-center items-center bg-gray-100 rounded-md shrink-0">
                    <FaChartLine className="text-lg text-black" />
                </div>
                <h2 className="font-bold text-base text-zinc-700">BÁO CÁO KẾT QUẢ HỆ THỐNG ĐÁNH GIÁ CHẤT LƯỢNG PHỤC VỤ NHÀ ĂN</h2>
            </div>

            <div className="flex flex-wrap items-end gap-3 mb-3 shrink-0">
                

                <div className="w-[200px] shrink-0">
                    <div className="text-xs font-semibold text-zinc-500 mb-1">THÁNG</div>
                    <Select
                        className="w-full"
                        size="small"
                        mode="multiple"
                        allowClear
                        placeholder="Tất cả"
                        value={thangDaChonList}
                        onChange={(vals) => setThangDaChonList(vals)}
                        options={danhSachThang.map((t) => ({ label: t.nhan, value: t.gia }))}
                    />
                </div>

                <div className="w-[200px] shrink-0">
                    <div className="text-xs font-semibold text-zinc-500 mb-1">TUẦN</div>
                    <Select
                        className="w-full"
                        size="small"
                        mode="multiple"
                        allowClear
                        placeholder="Tất cả"
                        value={tuanDaChonList}
                        onChange={(vals) => setTuanDaChonList(vals)}
                        options={danhSachTuan.map((t) => ({ label: t.nhan, value: t.gia }))}
                    />
                </div>

                <div className="w-[150px] shrink-0">
                    <div className="text-xs font-semibold text-zinc-500 mb-1">BỮA ĂN</div>
                    <Select
                        className="w-full"
                        size="small"
                        mode="multiple"
                        allowClear
                        placeholder="Tất cả"
                        value={codeBuaAnList}
                        onChange={(vals) => setCodeBuaAnList(vals)}
                        options={(dataBuaAn ?? []).map((x: BuaAnModel) => ({ label: x.tenBuaAn, value: x.codeBuaAn }))}
                    />
                </div>

                <div className="w-[250px] shrink-0">
                    <div className="text-xs font-semibold text-zinc-500 mb-1">NGÀY</div>
                    <RangePicker
                        className="w-full"
                        size="small"
                        format="DD/MM/YYYY"
                        value={dateRange}
                        onChange={(vals) => {
                            if (vals && vals[0] && vals[1]) {
                                setDateRange([vals[0].startOf("day"), vals[1].endOf("day")]);
                            }
                        }}
                    />
                </div>

                <div className="flex-1 min-w-[200px]">
                    <div className="text-xs font-semibold text-zinc-500 mb-1">ĐỊA ĐIỂM NHÀ ĂN</div>
                    <Select
                        className="w-full"
                        size="small"
                        mode="multiple"
                        allowClear
                        placeholder="Tất cả"
                        value={diaDiemIds}
                        onChange={xuLyChonDiaDiem}
                        options={[
                            { label: "Tất cả", value: TAT_CA_DIA_DIEM },
                            ...(dataNhaAn ?? []).filter((x: NhaAnModel) => x.isActive).map((x: NhaAnModel) => ({ label: x.diaDiem, value: x.id })),
                        ]}
                    />
                </div>

                <Button type="primary" size="small" icon={<IoSearchOutline />} onClick={xuLyTimKiem} loading={isFetching} className="shrink-0">
                    Tìm
                </Button>
            </div>

            <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-3">
                {isFetching && !thongKe ? (
                        <div className="flex-1 flex justify-center items-center">
                            <Spin />
                        </div>
                    ) : (
                        <>
                            <div className="flex-[9] min-h-0 grid grid-cols-4 gap-3">
                                <div className="col-span-2 min-h-0 bg-white rounded-xl shadow border p-3 flex flex-col">
                                    <div className="text-center font-bold text-zinc-700 text-sm mb-1 shrink-0">TẤT CẢ LỊCH SỬ ĐÁNH GIÁ</div>
                                    <div className="flex-1 min-h-0">
                                        <PieChartDanhGiaComponent theoMucDanhGia={thongKe?.theoMucDanhGia ?? []} />
                                    </div>
                                </div>

                                <div className="grid grid-rows-2 gap-3 min-h-0">
                                    <StatCardComponent
                                        title="Tổng lượt đánh giá"
                                        value={soNguoiDungDinhDang(thongKe?.tongLuotDanhGia ?? 0)}
                                        background="#dbeafe"
                                        valueColor="#1d4ed8"
                                    />
                                    <StatCardComponent
                                        title="Tổng cơm thực tế"
                                        value={soNguoiDungDinhDang(thongKe?.tongComThucTe ?? 0)}
                                    />
                                </div>

                                <div className="flex flex-col gap-3 min-h-0">
                                    <div className="flex-1 min-h-0 bg-white rounded-xl shadow border p-2 flex flex-col">
                                        <div className="text-center font-semibold text-zinc-700 text-xs mb-1 shrink-0">TỶ LỆ % THEO NGÀY</div>
                                        <div className="flex-1 min-h-0">
                                            <BarChartTyLeNgayComponent theoNgay={thongKe?.theoNgay ?? []} />
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <StatCardComponent
                                            title="Tổng tỷ lệ đánh giá"
                                            value={`${thongKe?.tyLeDanhGiaPercent ?? 0}%`}
                                            background="#dbeafe"
                                            valueColor="#1d4ed8"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-[11] min-h-0 bg-white rounded-xl shadow border p-3">
                                <BarChartTheoDiaDiemComponent theoDiaDiem={thongKe?.theoDiaDiem ?? []} />
                            </div>
                    </>
                )}
            </div>
        </div>
    </LayoutV2Component>;
};

export default DashboardPageV2;
