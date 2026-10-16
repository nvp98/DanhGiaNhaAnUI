import React, { useEffect, useMemo, useState } from "react";
import LayoutV2Component from "../components/LayoutV2Component";
import { useSelector } from "react-redux";
import { RootType } from "../store/types";
import { useNavigate } from "react-router-dom";
import { DatePicker, Select, Spin } from "antd";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);
import { FaChartLine } from "react-icons/fa";
import { useDanhSachDiaDiemNhaAnQuery } from "../services/diaDiemNhaAnApiV2";
import { useDanhSachBuaAnQuery } from "../services/buaAnApi";
import { useLayThongKeDashboardQuery } from "../services/dashboardApiV2";
import { DashboardFilterParams } from "../models/DashboardModel";
import NhaAnModel from "../models/NhaAnModel";
import BuaAnModel from "../models/BuaAnModel";
import StatCardComponent from "../components/StatCardComponent";
import PieChartDanhGiaComponent from "../components/PieChartDanhGiaComponent";
import BarChartTyLeNgayComponent from "../components/BarChartTyLeNgayComponent";
import BarChartTheoDiaDiemComponent from "../components/BarChartTheoDiaDiemComponent";
import { coQuyen, MA_QUYEN } from "../utils/quyenV2";

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

    // State đang chọn trên form filter — CHƯA gọi API ngay, debounce 500ms
    // mới đổ sang boLocDaApDung (xem useEffect debounce bên dưới), tránh
    // refetch (quét SQL aggregate trên hàng triệu dòng) ngay mỗi lần đổi 1 ô
    // filter — VD chọn liền 3 địa điểm chỉ kích hoạt đúng 1 lần gọi API sau
    // khi dừng chọn 500ms.
    const [diaDiemIds, setDiaDiemIds] = useState<number[]>([TAT_CA_DIA_DIEM]);
    const [codeBuaAnList, setCodeBuaAnList] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(6, "month").startOf("day"), dayjs().endOf("day")]);
    // "Ngày" là khoảng bao ngoài độc lập, không bị Tháng/Tuần ghi đè — chọn
    // Tháng/Tuần chỉ thêm điều kiện lọc kết hợp (AND với Ngày, OR giữa các
    // tháng/tuần đã chọn trong cùng nhóm), xem DashboardController.GetSummary.
    const [tuanDaChonList, setTuanDaChonList] = useState<string[]>([]);
    const [thangDaChonList, setThangDaChonList] = useState<string[]>([]);

    // Phạm vi dùng để SINH danh sách lựa chọn Tuần/Tháng — tách riêng khỏi
    // dateRange thực tế gửi API. Chọn Tháng sẽ tự nhảy dateRange theo đúng
    // tháng đó (xem xuLyChonThang) nhưng KHÔNG được làm co hẹp luôn danh
    // sách tháng còn lại để chọn tiếp (nếu dùng chung dateRange, chọn xong
    // tháng 4 sẽ làm mất các tháng khác khỏi dropdown). Chỉ cập nhật
    // khoangHienThi khi người dùng tự tay sửa RangePicker.
    const [khoangHienThi, setKhoangHienThi] = useState<[Dayjs, Dayjs]>(dateRange);
    const danhSachTuan = useMemo(() => tinhDanhSachTuan(khoangHienThi[0], khoangHienThi[1]), [khoangHienThi]);
    const danhSachThang = useMemo(() => tinhDanhSachThang(khoangHienThi[0], khoangHienThi[1]), [khoangHienThi]);

    const [boLocDaApDung, setBoLocDaApDung] = useState({ diaDiemIds, codeBuaAnList, dateRange, tuanDaChonList, thangDaChonList });

    const { data: dataNhaAn } = useDanhSachDiaDiemNhaAnQuery();
    const { data: dataBuaAn } = useDanhSachBuaAnQuery();

    // Chuyển state bộ lọc (dayjs object, v.v.) thành đúng params gửi API.
    const taoThamSoLoc = (bl: typeof boLocDaApDung): DashboardFilterParams => ({
        tuNgay: bl.dateRange[0].format("YYYY-MM-DD"),
        denNgay: bl.dateRange[1].format("YYYY-MM-DD"),
        diaDiemIds: bl.diaDiemIds.includes(TAT_CA_DIA_DIEM) ? undefined : bl.diaDiemIds,
        codeBuaAnList: bl.codeBuaAnList.length > 0 ? bl.codeBuaAnList : undefined,
        tuanDaChon: bl.tuanDaChonList.length > 0 ? bl.tuanDaChonList : undefined,
        thangDaChon: bl.thangDaChonList.length > 0 ? bl.thangDaChonList : undefined,
    });

    const { data: thongKe, isFetching } = useLayThongKeDashboardQuery(taoThamSoLoc(boLocDaApDung));

    // Debounce 500ms: đổi filter liên tục (VD chọn lần lượt nhiều địa điểm)
    // chỉ đổ sang boLocDaApDung — và vì vậy chỉ gọi API — đúng 1 lần, sau khi
    // ngừng đổi 500ms, thay vì gọi ngay mỗi lần đổi 1 ô.
    useEffect(() => {
        const timer = setTimeout(() => {
            setBoLocDaApDung({ diaDiemIds, codeBuaAnList, dateRange, tuanDaChonList, thangDaChonList });
        }, 500);
        return () => clearTimeout(timer);
    }, [diaDiemIds, codeBuaAnList, dateRange, tuanDaChonList, thangDaChonList]);

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        } else if (!coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_DASHBOARD)) {
            navigator("/v2");
        }
    }, []);

    if (!authV2.isAuthenticated || !coQuyen(authV2.nguoiDung, MA_QUYEN.QUAN_LY_DASHBOARD)) {
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

    // Chọn Tháng thì "Ngày" tự nhảy theo — từ ngày 1 của tháng nhỏ nhất đến
    // ngày cuối của tháng lớn nhất trong các tháng đang chọn (VD chọn tháng
    // 4 -> 01/04-30/04; chọn thêm tháng 6 -> 01/04-30/06). Bỏ hết lựa chọn
    // thì giữ nguyên "Ngày" hiện tại, không có mốc nào để tự suy ra.
    const xuLyChonThang = (vals: string[]) => {
        setThangDaChonList(vals);
        if (vals.length === 0) return;
        const daySapXep = [...vals].sort();
        setDateRange([
            dayjs(`${daySapXep[0]}-01`).startOf("month"),
            dayjs(`${daySapXep[daySapXep.length - 1]}-01`).endOf("month"),
        ]);
    };

    return <LayoutV2Component>
        <div className="flex flex-col" style={{ height: `calc(100vh - ${CHIEU_CAO_DA_DUNG}px)` }}>
            <div className="flex justify-start items-center gap-2 mb-3 shrink-0">
                <div className="w-[36px] h-[36px] flex justify-center items-center bg-gray-100 rounded-md shrink-0">
                    <FaChartLine className="text-lg text-black" />
                </div>
                <h2 className="font-bold text-lg text-zinc-700">BÁO CÁO KẾT QUẢ HỆ THỐNG ĐÁNH GIÁ CHẤT LƯỢNG PHỤC VỤ NHÀ ĂN</h2>
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-3">
                {isFetching && !thongKe ? (
                        <div className="flex-1 flex justify-center items-center">
                            <Spin />
                        </div>
                    ) : (
                        <>
                            <div className="flex-[6] min-h-0 flex gap-3">
                                {/* Sidebar bộ lọc — các field xếp dọc, tự động gọi API sau debounce 500ms khi đổi (xem useEffect debounce ở trên) */}
                                <div className="w-1/4 shrink-0 bg-white rounded-xl shadow border p-2 flex flex-col gap-2 overflow-y-auto">
                                    <div>
                                        <div className="text-xs font-bold text-zinc-600 mb-0.5 uppercase">Địa điểm nhà ăn</div>
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

                                    <div>
                                        <div className="text-xs font-bold text-zinc-600 mb-0.5 uppercase">Tháng</div>
                                        <Select
                                            className="w-full"
                                            size="small"
                                            mode="multiple"
                                            allowClear
                                            placeholder="Tất cả"
                                            value={thangDaChonList}
                                            onChange={xuLyChonThang}
                                            options={danhSachThang.map((t) => ({ label: t.nhan, value: t.gia }))}
                                        />
                                    </div>

                                    <div>
                                        <div className="text-xs font-bold text-zinc-600 mb-0.5 uppercase">Tuần</div>
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

                                    <div>
                                        <div className="text-xs font-bold text-zinc-600 mb-0.5 uppercase">Bữa ăn</div>
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

                                    <div>
                                        <div className="text-xs font-bold text-zinc-600 mb-0.5 uppercase">Ngày</div>
                                        <RangePicker
                                            className="w-full"
                                            size="small"
                                            format="DD/MM/YYYY"
                                            value={dateRange}
                                            onChange={(vals) => {
                                                if (vals && vals[0] && vals[1]) {
                                                    const moi: [Dayjs, Dayjs] = [vals[0].startOf("day"), vals[1].endOf("day")];
                                                    setDateRange(moi);
                                                    setKhoangHienThi(moi);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 min-h-0 grid grid-cols-4 gap-3">
                                    <div className="col-span-2 min-h-0 bg-white rounded-xl shadow border p-3 flex flex-col">
                                        <div className="text-center font-bold text-zinc-700 text-base mb-1 shrink-0">TẤT CẢ LỊCH SỬ ĐÁNH GIÁ</div>
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
                                            <div className="text-center font-semibold text-zinc-700 text-sm mb-1 shrink-0">TỶ LỆ % THEO NGÀY</div>
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
                            </div>

                            <div className="flex-[4] min-h-0 bg-white rounded-xl shadow border p-3">
                                <BarChartTheoDiaDiemComponent theoDiaDiem={thongKe?.theoDiaDiem ?? []} />
                            </div>
                    </>
                )}
            </div>
        </div>
    </LayoutV2Component>;
};

export default DashboardPageV2;
