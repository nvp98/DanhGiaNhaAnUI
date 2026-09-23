import { Button, InputNumber, Select, Tooltip } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { FaEdit, FaFileWord } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import LayoutV2Component from "../../components/LayoutV2Component";
import {
    DoanBuilder,
    DoanBuilderItem,
    GhiChuHtml,
    PhieuActions,
    PhieuHeader,
    PhieuInputCard,
    PhieuToolbar,
    TinyMceModal,
} from "../../components/phieu";

import { DoanRequest } from "../../models/DoanModel";
import NhaThauModel from "../../models/NhaThauModel";
import PhongBanModel from "../../models/PhongBanModel";
import { Phieu3Bang1DongModel, Phieu3Bang2DongModel } from "../../models/Phieu3ResponseModel";

import { useTienDoKyQuery } from "../../services/chuKyPhieuApi";
import { useDanhSachNhaThauQuery } from "../../services/nhaThauApiV2";
import { locDanhMucChon, tenOptionDanhMuc } from "../../utils/danhMucHoatDong";
import { useDanhSachPhieu1Query } from "../../services/phieu1Api";
import { useDanhSachPhieu2Query } from "../../services/phieu2Api";
import {
    useChiTietPhieu3Query,
    usePhanHoiYKienNhaThauPhieu3Mutation,
    useSuaPhieu3Mutation,
    useThemDoanPhieu3Mutation,
    useThemPhieu3Mutation,
    useTinhLaiPhieu3Mutation,
    useXoaDoanPhieu3Mutation,
    useXoaPhieu3Mutation,
} from "../../services/phieu3Api";
import { useDanhSachPhongBanQuery } from "../../services/phongBanApiV2";

import { setNotify } from "../../store/notifycationSlide";
import { RootType } from "../../store/types";
import xuatWordPhieu3 from "../../utils/xuatWordPhieu3";

import "./Phieu3FormPage.scss";

// Cấu hình cột kiểu "BangCoDinhConfig" (xem PHIEU4_BANG1_CONFIG/PHIEU4_BANG2_CONFIG
// ở Phieu4FormPage.tsx) — Ở Phiếu 4, TRỤ CỘT cố định là nhà thầu (động, lấy từ dữ
// liệu) nên phần khai báo config nằm ở DÒNG. Ở Phiếu 3 thì ngược lại: DÒNG lấy từ
// dữ liệu (bang1/bang2 — theo maDong/phongBanId), còn CỘT (điểm 1-5, TC1-6) mới là
// phần cố định — nên khai báo config ở CỘT, dùng chung để render cả header lẫn ô
// dữ liệu, thay vì tách rời hằng số mã cột + object tra tên như trước.
const BANG1_COT_DIEM: { key: "diem1" | "diem2" | "diem3" | "diem4" | "diem5"; label: string }[] = [
    { key: "diem1", label: "1-Rất không hài lòng" },
    { key: "diem2", label: "2-Không hài lòng" },
    { key: "diem3", label: "3-Bình thường" },
    { key: "diem4", label: "4-Hài lòng" },
    { key: "diem5", label: "5-Rất hài lòng" },
];

// Tên đầy đủ 6 tiêu chí Bảng 2 — khớp thứ tự với Phiếu 2 (VSATTP, định lượng thực đơn,
// thái độ phối hợp, điều khoản khác) + 2 tiêu chí riêng của Bảng 2 (đa dạng thực đơn,
// phản hồi sự cố). Chỉ là nhãn hiển thị — MaTieuChi lưu DB vẫn là TC1..TC6.
const BANG2_COT_TIEU_CHI: { key: string; label: string }[] = [
    { key: "TC1", label: "Tuân thủ đúng quy định về vệ sinh an toàn thực phẩm" },
    { key: "TC2", label: "Tuân thủ định lượng theo thực đơn đã được phê duyệt" },
    { key: "TC3", label: "Đa dạng thực đơn" },
    { key: "TC4", label: "Tuân thủ hợp đồng, bản cam kết, quy trình báo cáo" },
    { key: "TC5", label: "Thái độ phối hợp, cầu thị cải tiến" },
    { key: "TC6", label: "Phản hồi sự cố, xử lý khiếu nại nhanh chóng" },
];

// Nối danh sách các mục CÓ THỂ BẤM kiểu "A, B và C" hoặc "A; B; C" (số hiệu
// Phiếu 1/Phiếu 2) — dùng ở "1. Căn cứ đánh giá", hover xanh + trỏ tay, bấm
// điều hướng thẳng tới phiếu chi tiết tương ứng.
const renderDsClickable = (
    items: { key: number; label: string; onClick: () => void }[],
    kieu: "cham" | "va" = "va"
) =>
    items.map((item, i) => (
        <React.Fragment key={item.key}>
            <span className="lien-ket-phieu" onClick={item.onClick}>{item.label}</span>
            {i === items.length - 1
                ? ""
                : kieu === "cham"
                    ? "; "
                    : i === items.length - 2 ? " và " : ", "}
        </React.Fragment>
    ));

const tenDongBang1 = (maDong: string) => {
    switch (maDong) {
        case "LUOT_CBNV_THAM_GIA": return "Số lượt CBNV tham gia đánh giá";
        case "TONG_SUAT_AN": return "Tổng số lượng suất ăn tại chỗ tại các vị trí đánh giá";
        case "TY_LE_PHAN_TRAM": return "Tỷ lệ % theo tiêu chí đánh giá";
        default: return maDong;
    }
};

const Phieu3FormPage: React.FC = () => {
    const { id } = useParams();
    const laTaoMoi = !id || id === "moi";
    const phieuId = laTaoMoi ? undefined : Number(id);

    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    // ============================================================
    // QUERIES & MUTATIONS
    // ============================================================

    const { data: chiTietPhieu, isFetching: dangTaiPhieu } = useChiTietPhieu3Query(
        phieuId!,
        { skip: laTaoMoi }
    );
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();
    const { data: danhSachPhongBan = [] } = useDanhSachPhongBanQuery();
    // Tiến độ ký — chỉ còn dùng để in trạng thái/ngày ký vào bảng chữ ký khi
    // xuất Word (xem xuLyXuatWord); phần mềm không còn luồng ký/duyệt nội bộ,
    // việc ký diễn ra ngoài phần mềm trên bản in.
    const { data: tienDoKy = [] } = useTienDoKyQuery(
        { loaiDoiTuong: "PHIEU3", doiTuongId: phieuId! },
        { skip: laTaoMoi }
    );

    const [themPhieu3, { isLoading: dangThem }] = useThemPhieu3Mutation();
    const [tinhLaiPhieu3, { isLoading: dangTinhLai }] = useTinhLaiPhieu3Mutation();
    const [xoaPhieu3] = useXoaPhieu3Mutation();
    const [phanHoiYKienNhaThau, { isLoading: dangLuuYKien }] = usePhanHoiYKienNhaThauPhieu3Mutation();
    const [suaPhieu3, { isLoading: dangLuuGiaTri }] = useSuaPhieu3Mutation();
    const [themDoanPhieu3, { isLoading: dangThemDoan }] = useThemDoanPhieu3Mutation();
    const [xoaDoanPhieu3] = useXoaDoanPhieu3Mutation();

    // ============================================================
    // LOCAL STATES
    // ============================================================

    const [nhaThauId, setNhaThauId] = useState<number | undefined>(undefined);
    const [thang, setThang] = useState<number>(new Date().getMonth() + 1);
    const [nam, setNam] = useState<number>(new Date().getFullYear());
    // Ranh giới tháng/năm báo cáo đang chọn — giới hạn DatePicker của
    // DoanBuilder bên dưới chỉ cho chọn ngày TRONG tháng này.
    const ngayDauThang = dayjs(`${nam}-${String(thang).padStart(2, "0")}-01`).startOf("month");
    const ngayCuoiThang = ngayDauThang.endOf("month");
    const [bang1, setBang1] = useState<Phieu3Bang1DongModel[]>([]);
    const [bang2, setBang2] = useState<Phieu3Bang2DongModel[]>([]);
    const [daKhoiTao, setDaKhoiTao] = useState(false);
    // Đoạn thời gian & địa điểm phụ trách — build mode (form tạo mới, chưa
    // có phiếu) giữ state cục bộ, key tạm; xem DoanBuilder.
    const [doanMoi, setDoanMoi] = useState<DoanBuilderItem[]>([]);

    const [yKien, setYKien] = useState("");
    // Modal soạn Ý kiến BP.QLTT — bấm icon sửa để mở, thay vì hiện thẳng khung
    // TinyMCE to trên trang.
    const [modalYKienOpen, setModalYKienOpen] = useState(false);
    const [dangXuatWord, setDangXuatWord] = useState(false);
    // Ô "Đa dạng thực đơn" (TC3, Bảng 2) — không có nguồn tự động ở CẢ 2 dòng
    // (P.ĐN lẫn P.ATMT, xem Phieu3Service.TinhLaiBang2Async) nên vẫn cho nhập
    // tay, khóa theo PhongBanId, chỉ chứa ô người dùng vừa sửa (chưa lưu).
    const [suaDaDangThucDon, setSuaDaDangThucDon] = useState<Record<number, number | null>>({});

    // Danh sách Phiếu 1 / Phiếu 2 để tự tổng hợp mục "1. Căn cứ đánh giá" —
    // PHẢI khớp ĐÚNG tập Phiếu 2/Phiếu 1 mà Bảng 2 backend thực sự dùng để
    // tính điểm (Phieu3Service.TinhLaiBang2Async): ngày rơi vào UNION các
    // "đoạn" đã khai báo (TrongDoanNao), KHÔNG còn theo Thang/Nam nữa — dù
    // FE giờ chỉ cho chọn đoạn TRONG tháng báo cáo (xem ngayDauThang/
    // ngayCuoiThang, DoanBuilder), backend không tự ràng buộc lại điều này.
    const doanRanges = (chiTietPhieu?.doan ?? []).map(d => ({
        tuNgay: dayjs(d.tuNgay).startOf("day"),
        denNgay: dayjs(d.denNgay).startOf("day"),
    }));
    const trongDoanNao = (ngay?: string | null) => {
        if (!ngay) return false;
        const n = dayjs(ngay).startOf("day");
        return doanRanges.some(r => !n.isBefore(r.tuNgay) && !n.isAfter(r.denNgay));
    };
    const tuNgayNhoNhat = doanRanges.length > 0
        ? doanRanges.reduce((min, r) => (r.tuNgay.isBefore(min) ? r.tuNgay : min), doanRanges[0].tuNgay)
        : null;
    const denNgayLonNhat = doanRanges.length > 0
        ? doanRanges.reduce((max, r) => (r.denNgay.isAfter(max) ? r.denNgay : max), doanRanges[0].denNgay)
        : null;

    // Chỉ Phiếu 1 do P.ATMT lập mới được Bảng 2 dùng để tính điểm (xem
    // Phieu3Service.TinhLaiBang2Async — pbAtmt) — lọc đúng phòng ban này ngay
    // từ đây để "Căn cứ đánh giá" không liệt kê nhầm Phiếu 1 của phòng ban
    // khác (không hề ảnh hưởng tới Bảng 2).
    const pbAtmtId = danhSachPhongBan.find((pb: PhongBanModel) => pb.ma === "PATMT")?.id;
    // pageSize lớn — đây là tổng hợp TOÀN BỘ Phiếu 1/2 trong khoảng đoạn để
    // tính "1. Căn cứ đánh giá", KHÔNG phải màn danh sách cho người dùng lật
    // trang, nên không được để mặc định 20/trang của endpoint làm mất dữ
    // liệu tổng hợp. CHỈ lấy phiếu ĐÃ DUYỆT — PHẢI khớp đúng điều kiện
    // TrangThai == "DA_DUYET" dùng ở Phieu3Service.TinhLaiBang2Async, nếu
    // không mục "Căn cứ đánh giá" sẽ liệt kê cả Phiếu 1/2 đang Nháp/Chờ ký mà
    // Bảng 2 bên dưới không hề dùng tới số liệu đó — 2 chỗ lệch nhau, dễ gây
    // hiểu nhầm. Query chỉ lấy khoảng [nhỏ nhất, lớn nhất] của các đoạn (bao
    // trọn mọi đoạn) rồi lọc lại chính xác qua trongDoanNao ở phía dưới —
    // endpoint danh sách không hỗ trợ lọc theo NHIỀU khoảng ngày rời rạc.
    const { data: ketQuaPhieu2ThangNay } = useDanhSachPhieu2Query(
        {
            nhaThauId,
            trangThai: "DA_DUYET",
            tuNgay: tuNgayNhoNhat?.format("YYYY-MM-DD"),
            denNgay: denNgayLonNhat?.format("YYYY-MM-DD"),
            pageSize: 1000,
        },
        { skip: laTaoMoi || !nhaThauId || !tuNgayNhoNhat || !denNgayLonNhat }
    );
    const danhSachPhieu2ThangNay = (ketQuaPhieu2ThangNay?.items ?? []).filter(p => trongDoanNao(p.thoiGianTu));
    const { data: ketQuaPhieu1ThangNay } = useDanhSachPhieu1Query(
        {
            nhaThauId,
            phongBanId: pbAtmtId,
            trangThai: "DA_DUYET",
            tuNgay: tuNgayNhoNhat?.format("YYYY-MM-DD"),
            denNgay: denNgayLonNhat?.format("YYYY-MM-DD"),
            pageSize: 1000,
        },
        { skip: laTaoMoi || !nhaThauId || !tuNgayNhoNhat || !denNgayLonNhat }
    );
    const danhSachPhieu1ThangNay = (ketQuaPhieu1ThangNay?.items ?? []).filter(p => trongDoanNao(p.ngayKiemTra));

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, [authV2.isAuthenticated, navigator]);

    useEffect(() => {
        setDaKhoiTao(false);
        setSuaDaDangThucDon({});
        setDoanMoi([]);
    }, [id]);

    useEffect(() => {
        if (daKhoiTao) return;
        if (!laTaoMoi && (dangTaiPhieu || !chiTietPhieu)) return;

        if (chiTietPhieu) {
            setNhaThauId(chiTietPhieu.phieu.nhaThauId);
            setThang(chiTietPhieu.phieu.thang);
            setNam(chiTietPhieu.phieu.nam);
            setBang1(chiTietPhieu.bang1);
            setBang2(chiTietPhieu.bang2);
            setYKien(chiTietPhieu.yKienNhaThau?.yKien ?? "");
        }

        setDaKhoiTao(true);
    }, [chiTietPhieu, dangTaiPhieu, laTaoMoi, daKhoiTao]);

    if (!authV2.isAuthenticated) {
        return null;
    }

    const phieu = chiTietPhieu?.phieu;
    const coTheSua =
        laTaoMoi ||
        !phieu ||
        phieu.trangThai === "NHAP" ||
        phieu.trangThai === "TU_CHOI";

    const tenNhaThau = (idNt?: number) =>
        idNt ? danhSachNhaThau.find((nt: NhaThauModel) => nt.id === idNt)?.ten ?? "" : "";
    // Option chọn: chỉ nhà thầu còn hoạt động + giá trị đã lưu trên phiếu (giữ lịch sử).
    const optionNhaThau = locDanhMucChon(danhSachNhaThau, [chiTietPhieu?.phieu.nhaThauId, nhaThauId]);
    const tenPhongBan = (idPb: number) =>
        danhSachPhongBan.find((pb: PhongBanModel) => pb.id === idPb)?.ten ?? `Phòng ban #${idPb}`;
    // "1. Căn cứ đánh giá": tự tổng hợp từ các Phiếu 2 (Bảng đánh giá) và Phiếu 1
    // (phiếu kiểm tra VSATTP) ĐÃ DUYỆT trong tháng/nhà thầu của báo cáo này —
    // đúng những phiếu THẬT SỰ được Bảng 2 dùng để tính điểm (đã lọc ở 2 query
    // bên trên). Chỉ lấy phần số thứ tự (VD "001" từ soHieu "001/2026/PĐGCLDVSA"),
    // không lặp lại cả chuỗi số hiệu đầy đủ (đã có sẵn "Bảng đánh giá số" dẫn
    // trước). Giữ kèm "id" để bấm số hiệu điều hướng thẳng tới phiếu chi tiết
    // (xem renderDsClickable).
    const dsSoHieuPhieu2 = danhSachPhieu2ThangNay.map(p => ({ id: p.id, label: p.soHieu.split("/")[0] }));

    // Map lồng phongBanId -> (số hiệu -> id Phiếu 1) — giữ kèm id để bấm số
    // hiệu điều hướng thẳng tới phiếu chi tiết, cùng cách lấy nhãn với
    // dsSoHieuPhieu2 ở trên (chỉ lấy phần số đếm, VD "001" từ soHieu
    // "001/2026/ATMT/VSATTP" — xem Phieu1Service.SinhSoHieuAsync). Nếu trùng
    // nhãn (hiếm gặp) thì giữ phiếu ĐẦU TIÊN gặp được.
    const phieu1TheoPhongBan = new Map<number, Map<string, number>>();
    danhSachPhieu1ThangNay.forEach(p => {
        const nhan = p.soHieu.split("/")[0];
        if (!phieu1TheoPhongBan.has(p.phongBanId)) {
            phieu1TheoPhongBan.set(p.phongBanId, new Map());
        }
        const theoSoHieu = phieu1TheoPhongBan.get(p.phongBanId)!;
        if (!theoSoHieu.has(nhan)) theoSoHieu.set(nhan, p.id);
    });
    const canCuPhieu1 = Array.from(phieu1TheoPhongBan.entries()).map(([phongBanId, theoSoHieu]) => ({
        phongBanId,
        danhSachSoHieu: Array.from(theoSoHieu.entries())
            .map(([soHieu, id]) => ({ soHieu, id }))
            .sort((a, b) => a.soHieu.localeCompare(b.soHieu, undefined, { numeric: true })),
    }));

    // ============================================================
    // TẠO MỚI / LƯU Ý KIẾN / TÍNH LẠI
    // ============================================================

    const moModalYKien = () => setModalYKienOpen(true);

    // Chỉ cập nhật state — API lưu thật diễn ra chung với nút "Lưu thay đổi"
    // (xem luuYKien), phiếu chỉ cần lưu khi còn sửa được nên không có nhánh
    // "lưu ngay" như Phiếu 2 (Ý kiến BP.QLTT không cần phản hồi sau khi ký).
    const luuYKienModal = (html: string) => {
        setYKien(html);
        setModalYKienOpen(false);
    };

    const xuLyTaoMoi = async () => {
        if (!nhaThauId) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Vui lòng chọn nhà thầu", messageNotify: "" }));
            return;
        }
        try {
            const doan: DoanRequest[] = doanMoi.map(({ key, ...rest }) => rest);
            const ketQua = await themPhieu3({ thang, nam, nhaThauId, doan }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã lập báo cáo", messageNotify: "" }));
            navigator(`/phieu3/${ketQua.phieu.id}`);
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Lập báo cáo thất bại", messageNotify: "" }));
        }
    };

    // Build mode (form tạo mới) — chỉ mutate state cục bộ, gộp vào body lúc
    // bấm "Lập báo cáo" (xem xuLyTaoMoi).
    const xuLyThemDoanMoi = (doan: DoanRequest) => {
        setDoanMoi((prev) => [...prev, { ...doan, key: `tam-${Date.now()}-${prev.length}` }]);
    };
    const xuLyXoaDoanMoi = (key: number | string) => {
        setDoanMoi((prev) => prev.filter((d) => d.key !== key));
    };

    // API mode (phiếu đã tồn tại, còn Nháp/Từ chối) — gọi API ngay, tag
    // invalidation của RTK Query tự refetch chi tiết phiếu.
    const xuLyThemDoan = async (doan: DoanRequest) => {
        try {
            await themDoanPhieu3({ id: phieuId!, body: doan }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã thêm đoạn", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Thêm đoạn thất bại", messageNotify: "" }));
        }
    };
    const xuLyXoaDoan = async (key: number | string) => {
        try {
            await xoaDoanPhieu3({ id: phieuId!, doanId: Number(key) }).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa đoạn", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa đoạn thất bại", messageNotify: "" }));
        }
    };

    // Lưu "Ý kiến của BP.QLTT" + ô "Đa dạng thực đơn" (TC3, Bảng 2) nếu có
    // sửa — 2 trường NHẬP TAY duy nhất còn lại trên phiếu (Bảng 1/2 phần còn
    // lại luôn lấy từ hệ thống, xem "Làm mới"), gộp chung 1 nút "Lưu thay đổi".
    const luuYKien = async () => {
        if (laTaoMoi) {
            await xuLyTaoMoi();
            return;
        }
        try {
            await phanHoiYKienNhaThau({ id: phieuId!, body: { yKien } }).unwrap();

            if (Object.keys(suaDaDangThucDon).length > 0) {
                const ketQua = await suaPhieu3({
                    id: phieuId!,
                    body: {
                        bang1: [],
                        bang2: Object.entries(suaDaDangThucDon).map(([phongBanId, giaTri]) => ({
                            phongBanId: Number(phongBanId),
                            giaTri: [{ maTieuChi: "TC3", giaTri: giaTri ?? undefined }],
                        })),
                    },
                }).unwrap();
                // Cập nhật thẳng từ response — bang1/bang2 là state cục bộ,
                // chỉ đồng bộ từ chiTietPhieu 1 lần lúc khởi tạo (xem daKhoiTao),
                // không tự refetch lại khi RTK Query invalidate tag.
                setBang2(ketQua.bang2);
                setSuaDaDangThucDon({});
            }

            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã lưu thay đổi", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Lưu thất bại", messageNotify: "" }));
        }
    };

    const xuLyTinhLai = async () => {
        try {
            const ketQua = await tinhLaiPhieu3(phieuId!).unwrap();
            setBang1(ketQua.bang1);
            setBang2(ketQua.bang2);
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã tính lại Bảng 1 (giữ nguyên ô đã sửa tay)", messageNotify: "" }));
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Tính lại thất bại", messageNotify: "" }));
        }
    };

    const xuLyXoaPhieu = async () => {
        try {
            await xoaPhieu3(phieuId!).unwrap();
            dispatch(setNotify({ typeNotify: "success", titleNotify: "Đã xóa báo cáo", messageNotify: "" }));
            navigator("/phieu3");
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: error?.data?.message || "Xóa báo cáo thất bại", messageNotify: "" }));
        }
    };

    const xuLyXuatWord = async () => {
        setDangXuatWord(true);
        try {
            await xuatWordPhieu3({
                soHieu: phieu?.soHieu,
                ngayLap: phieu?.ngayTao,
                tenNhaThau: tenNhaThau(nhaThauId),
                thang,
                nam,
                dsSoHieuPhieu2: dsSoHieuPhieu2.map(p => p.label),
                canCuPhieu1: canCuPhieu1.map(({ phongBanId, danhSachSoHieu }) => ({
                    tenPhongBan: tenPhongBan(phongBanId),
                    danhSachSoHieu: danhSachSoHieu.map(d => d.soHieu),
                })),
                bang1,
                bang2: bang2.map(dong => ({
                    tenPhongBan: tenPhongBan(dong.phongBanId),
                    giaTriTheoTieuChi: BANG2_COT_TIEU_CHI.map(cot =>
                        // TC3 đang sửa dở (chưa lưu) vẫn phải xuất đúng giá trị mới gõ.
                        cot.key === "TC3" && dong.phongBanId in suaDaDangThucDon
                            ? suaDaDangThucDon[dong.phongBanId] ?? undefined
                            : dong.giaTri.find(g => g.maTieuChi === cot.key)?.giaTri
                    ),
                })),
                bang2CotTieuChi: BANG2_COT_TIEU_CHI.map(cot => cot.label),
                yKienHtml: yKien,
                chuKy: tienDoKy.map(b => ({
                    tenBuoc: b.tenBuoc,
                    trangThai: b.trangThai,
                    ghiChu: b.ghiChu,
                    ngayKy: b.ngayKy,
                })),
            });
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Xuất Word thất bại", messageNotify: "" }));
        } finally {
            setDangXuatWord(false);
        }
    };

    // Định dạng 1 giá trị Bảng 1 theo đúng kiểu hiển thị của dòng (số nguyên
    // hoặc % có 2 số thập phân với dòng TY_LE_PHAN_TRAM) — dùng chung cho ô
    // và tooltip so sánh giá trị hệ thống / đã sửa tay.
    const dinhDangGiaTriBang1 = (dong: Phieu3Bang1DongModel, giaTri: number) =>
        dong.maDong === "TY_LE_PHAN_TRAM"
            ? `${giaTri.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
            : giaTri.toLocaleString("vi-VN");

    // Ô Bảng 1: render input hoặc giá trị tĩnh. Nếu ô đã từng bị sửa tay
    // (khác giá trị hệ thống tự tính) thì tô vàng nhạt + hover xem giá trị
    // hệ thống gốc so với giá trị đã sửa (thay vì 1 tag "Đã sửa tay" chung
    // chung cho cả dòng — trước đây không biết ô nào trong 5 ô đã bị sửa).
    const renderOBang1 = (dong: Phieu3Bang1DongModel, cot: "diem1" | "diem2" | "diem3" | "diem4" | "diem5" | "tong") => {
        const giaTri = dong[cot];
        const daSuaTay = dong.truongDaSuaTay?.includes(cot) ?? false;
        const giaTriHeThong = dong[`${cot}HeThong` as const];

        const noiDung =
            giaTri === undefined || giaTri === null ? "--" : dinhDangGiaTriBang1(dong, giaTri);
        const span = <span className={daSuaTay ? "o-so-sua-tay" : undefined}>{noiDung}</span>;
        // Vẫn giữ hiển thị "đã sửa tay" (từ lịch sử chỉnh sửa trước đây, khi
        // Bảng 1 còn cho nhập tay) để đối chiếu — bản thân ô giờ chỉ hiển thị,
        // không còn sửa được nữa (số liệu lấy hoàn toàn từ hệ thống).
        if (!daSuaTay) return span;
        return (
            <Tooltip
                title={
                    <>
                        Hệ thống tính: {giaTriHeThong !== undefined && giaTriHeThong !== null ? dinhDangGiaTriBang1(dong, giaTriHeThong) : "--"}
                        <br />
                        Đã sửa tay (trước đây): {noiDung}
                    </>
                }
            >
                {span}
            </Tooltip>
        );
    };

    // P.ĐN — theo đúng quy ước backend (Phieu3Service dùng PhongBan.Ma ==
    // "PDN" để phân biệt dòng, xem MaPhongBanBang2), không dựa vào thứ tự
    // dòng trong mảng (dù hiện tại luôn là dòng đầu tiên).
    const laPhongDoiNgoai = (phongBanId: number) =>
        danhSachPhongBan.find((pb: PhongBanModel) => pb.id === phongBanId)?.ma === "PDN";

    const renderOBang2 = (dong: Phieu3Bang2DongModel, maTieuChi: string) => {
        const oGiaTri = dong.giaTri.find(g => g.maTieuChi === maTieuChi);

        // TC3 "Đa dạng thực đơn" — không có nguồn tự động, nhưng CHỈ cho nhập
        // tay ở dòng P.ĐN theo yêu cầu (P.ATMT vẫn chỉ hiển thị, chờ xác nhận
        // thêm nghiệp vụ).
        if (coTheSua && maTieuChi === "TC3" && laPhongDoiNgoai(dong.phongBanId)) {
            const giaTriDangSua = dong.phongBanId in suaDaDangThucDon
                ? suaDaDangThucDon[dong.phongBanId]
                : oGiaTri?.giaTri ?? null;
            const hienThi = giaTriDangSua !== null && giaTriDangSua !== undefined
                ? Number(giaTriDangSua).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                : "--";
            return (
                <>
                    <InputNumber
                        className="no-print"
                        size="small"
                        min={1}
                        max={5}
                        step={0.1}
                        value={giaTriDangSua ?? undefined}
                        onChange={v => setSuaDaDangThucDon(prev => ({ ...prev, [dong.phongBanId]: v === null || v === undefined ? null : Number(v) }))}
                    />
                    <span className="print-only">{hienThi}</span>
                </>
            );
        }

        if (oGiaTri?.giaTri === undefined || oGiaTri?.giaTri === null) return <span>--</span>;
        return (
            <span className={oGiaTri.chinhSuaThuCong ? "o-so-sua-tay" : undefined}>
                {Number(oGiaTri.giaTri).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
        );
    };

    return (
        <LayoutV2Component>
            {/* 1. TOOLBAR CHUNG */}
            <PhieuToolbar
                title={
                    laTaoMoi
                        ? "Lập báo cáo chất lượng dịch vụ suất ăn theo tháng"
                        : `Báo cáo tháng — ${phieu?.soHieu ?? ""}`
                }
                trangThai={phieu?.trangThai}
                onPrint={() => window.print()}
                extraButtons={
                    !laTaoMoi && (
                        <Button
                            className="no-print"
                            icon={<FaFileWord />}
                            loading={dangXuatWord}
                            onClick={xuLyXuatWord}
                        >
                            Xuất Word
                        </Button>
                    )
                }
            />

            {/* 2. FORM THÔNG TIN NHẬP LIỆU (NO-PRINT) — chỉ chọn được lúc tạo mới */}
            <PhieuInputCard title="Thông tin báo cáo">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <div className="mb-1 text-xs font-medium">Nhà thầu</div>
                        <Select
                            className="w-full"
                            size="small"
                            placeholder="-- Chọn nhà thầu --"
                            showSearch
                            optionFilterProp="children"
                            disabled={!laTaoMoi}
                            value={nhaThauId}
                            onChange={v => setNhaThauId(v)}
                        >
                            {optionNhaThau.map((nt: NhaThauModel) => (
                                <Select.Option key={nt.id} value={nt.id}>{tenOptionDanhMuc(nt)}</Select.Option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <div className="mb-1 text-xs font-medium">Tháng</div>
                        <Select className="w-full" size="small" disabled={!laTaoMoi} value={thang} onChange={v => setThang(v)}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(t => (
                                <Select.Option key={t} value={t}>Tháng {t}</Select.Option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <div className="mb-1 text-xs font-medium">Năm</div>
                        <Select className="w-full" size="small" disabled={!laTaoMoi} value={nam} onChange={v => setNam(v)}>
                            {[nam - 1, nam, nam + 1].map(n => (
                                <Select.Option key={n} value={n}>{n}</Select.Option>
                            ))}
                        </Select>
                    </div>
                </div>
                {!laTaoMoi && (
                    <div className="text-xs text-gray-400 mt-2">
                        Nhà thầu / Tháng / Năm cố định từ lúc lập báo cáo, không sửa được sau khi tạo.
                    </div>
                )}
            </PhieuInputCard>

            {/* Đoạn thời gian & địa điểm phụ trách — thay cho suy luận tự động
                cũ, cho phép nhà thầu đổi tập địa điểm phụ trách GIỮA kỳ báo
                cáo. Build mode lúc tạo mới, API mode (thêm/xóa ngay) lúc còn
                Nháp/Từ chối. Chỉ cho chọn ngày TRONG tháng/năm báo cáo đang
                chọn (thang/nam — khóa cứng sau khi tạo, xem Select disabled
                theo laTaoMoi ở trên) — khác Phiếu 4 vẫn cho đoạn vượt ranh
                giới tháng, xem DoanBuilder.tsx. */}
            <PhieuInputCard title="Đoạn thời gian & địa điểm phụ trách">
                {laTaoMoi ? (
                    <DoanBuilder
                        items={doanMoi}
                        coTheSua
                        onThem={xuLyThemDoanMoi}
                        onXoa={xuLyXoaDoanMoi}
                        ngayToiThieu={ngayDauThang}
                        ngayToiDa={ngayCuoiThang}
                    />
                ) : (
                    <DoanBuilder
                        items={(chiTietPhieu?.doan ?? []).map((d) => ({ ...d, key: d.id }))}
                        coTheSua={coTheSua}
                        dangThem={dangThemDoan}
                        onThem={xuLyThemDoan}
                        onXoa={xuLyXoaDoan}
                        ngayToiThieu={ngayDauThang}
                        ngayToiDa={ngayCuoiThang}
                    />
                )}
            </PhieuInputCard>

            {laTaoMoi ? (
                <div className="no-print">
                    <Button type="primary" size="large" loading={dangThem} onClick={xuLyTaoMoi}>
                        Lập báo cáo — tự động tính Bảng 1 từ Phiếu 2
                    </Button>
                </div>
            ) : (
                <div className="phieu-a4">
                    <PhieuHeader
                        maPhieu="PHIEU3"
                        soHieu={phieu?.soHieu}
                        title="BÁO CÁO CHẤT LƯỢNG DỊCH VỤ SUẤT ĂN"
                    />
                    <div className="phieu3-header-info">
                        <div>Nhà thầu: {tenNhaThau(nhaThauId) || "........................"}</div>
                        <div>Tháng {String(thang).padStart(2, "0")}/{nam}</div>
                    </div>

                    {/* 1. CĂN CỨ ĐÁNH GIÁ — tự tổng hợp từ Phiếu 1/Phiếu 2 trong tháng */}
                    <div className="phieu3-section-title">1. Căn cứ đánh giá</div>
                    <div className="phieu3-can-cu-list">
                        <div>- Hợp đồng suất ăn công nghiệp số 0390.2023.HPDQ-PN-HDNT;</div>
                        <div>- Căn cứ kết quả đánh giá thực tế từ CBNV;</div>
                        {dsSoHieuPhieu2.length > 0 && (
                            <div>
                                - Căn cứ kết quả đánh giá từ P.ĐN theo các Bảng đánh giá số: {" "}
                                {renderDsClickable(
                                    dsSoHieuPhieu2.map(p => ({ key: p.id, label: p.label, onClick: () => navigator(`/phieu2/${p.id}`) })),
                                    "cham"
                                )};
                            </div>
                        )}
                        {canCuPhieu1.map(({ phongBanId, danhSachSoHieu }) => (
                            <div key={phongBanId}>
                                - Căn cứ kết quả đánh giá công tác VSATTP của P.ATMT theo các Bảng đánh giá số: {" "}
                                {renderDsClickable(
                                    danhSachSoHieu.map(d => ({ key: d.id, label: d.soHieu, onClick: () => navigator(`/phieu1/${d.id}`) })),
                                    "cham"
                                )}{" "}
                                của P.ATMT.
                            </div>
                        ))}
                    </div>

                    {/* 2. ĐÁNH GIÁ CHẤT LƯỢNG DỊCH VỤ */}
                    <div className="phieu3-section-title mt-3">
                        2. Đánh giá chất lượng dịch vụ theo phương án phân bổ số lượng suất ăn
                    </div>

                    {/* BẢNG 1 */}
                    <div className="phieu3-bang-title no-print-mb">
                        2.1. Đánh giá trong tháng từ CBNV
                    </div>
                    <table className="phieu-table phieu3-bang1-table">
                        <thead>
                            <tr>
                                <th rowSpan={2} className="cot-noi-dung">Nội dung</th>
                                <th colSpan={BANG1_COT_DIEM.length}>Tiêu chí đánh giá</th>
                                <th rowSpan={2}>Tổng</th>
                            </tr>
                            <tr>
                                {BANG1_COT_DIEM.map(cot => (
                                    <th key={cot.key}>{cot.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bang1.map(dong =>
                                dong.maDong === "TONG_SUAT_AN" ? (
                                    <tr key={dong.maDong}>
                                        <td className="o-noi-dung" colSpan={1 + BANG1_COT_DIEM.length}>
                                            {tenDongBang1(dong.maDong)}
                                        </td>
                                        <td className="o-so o-so-tong">{renderOBang1(dong, "tong")}</td>
                                    </tr>
                                ) : (
                                    <tr key={dong.maDong}>
                                        <td className="o-noi-dung">{tenDongBang1(dong.maDong)}</td>
                                        {BANG1_COT_DIEM.map(cot => (
                                            <td key={cot.key} className="o-so">{renderOBang1(dong, cot.key)}</td>
                                        ))}
                                        <td className="o-so o-so-tong">{renderOBang1(dong, "tong")}</td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                    <div className="text-xs text-gray-400 no-print mt-1">
                        "Tổng suất ăn tại chỗ" nhập tay hoàn toàn (không dùng để tính tỷ lệ bên dưới). "Tỷ lệ % tiêu chí đánh giá" tự tính = Số lượt CBNV tham gia đánh giá ở từng mức / Tổng số lượt CBNV tham gia đánh giá — bấm "Làm mới" (thanh nút cuối trang) để cập nhật.
                    </div>

                    {/* BẢNG 2 */}
                    <div className="phieu3-bang-title mt-4">2.2. Đánh giá trong tháng từ phòng ban liên quan</div>
                    <table className="phieu-table phieu3-bang2-table">
                        <thead>
                            <tr>
                                <th rowSpan={2} className="cot-noi-dung">Bộ phận đánh giá</th>
                                <th colSpan={BANG2_COT_TIEU_CHI.length}>Điểm đánh giá theo tiêu chí (thang điểm 1-5)</th>
                            </tr>
                            <tr>
                                {BANG2_COT_TIEU_CHI.map(cot => (
                                    <th key={cot.key}>{cot.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bang2.map(dong => (
                                <tr key={dong.id}>
                                    <td className="o-noi-dung">{tenPhongBan(dong.phongBanId)}</td>
                                    {BANG2_COT_TIEU_CHI.map(cot => (
                                        <td key={cot.key} className="o-so">{renderOBang2(dong, cot.key)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="text-xs text-gray-400 no-print mt-1">
                        Dòng P.ĐN: TC1, TC2, TC4, TC5, TC6 tự động tính từ Phiếu 2 trong tháng (bấm "Làm mới" để cập nhật).
                        Dòng P.ATMT: chỉ TC1 (VSATTP) tự động tính từ Phiếu 1 do P.ATMT lập trong tháng.
                        Riêng TC3 "Đa dạng thực đơn" của dòng P.ĐN nhập tay được — bấm "Lưu thay đổi" (thanh nút cuối trang) để lưu.
                    </div>

                    {/* Ý KIẾN BP.QLTT — cùng TC3 "Đa dạng thực đơn" ở Bảng 2, là 2
                        trường tự nhập còn lại trên phiếu (phần còn lại của Bảng 1/2
                        chỉ hiển thị số liệu hệ thống). Hiện dạng preview (bấm ảnh
                        phóng to được), bấm icon để mở modal TinyMCE soạn/chèn ảnh —
                        modal chỉ cập nhật state, lưu qua nút "Lưu thay đổi" ở thanh
                        action cuối trang (xem luuYKien). */}
                    <div className="phieu-y-kien mt-4">
                        <div className="phieu3-bang-title mt-4">3. Ý kiến của BP.QLTT</div>
                        <div className="ghi-chu-cell-wrapper">
                            {yKien ? (
                                <GhiChuHtml
                                    className="ghi-chu-rich-preview ghi-chu-content"
                                    html={yKien}
                                />
                            ) : (
                                <span className="text-gray-400 text-sm ghi-chu-content">Chưa có ý kiến</span>
                            )}
                            {coTheSua && (
                                <Tooltip title="Soạn ý kiến / chèn ảnh minh chứng">
                                    <Button
                                        className="no-print ghi-chu-btn-edit"
                                        size="small"
                                        icon={<FaEdit />}
                                        onClick={moModalYKien}
                                    />
                                </Tooltip>
                            )}
                        </div>
                    </div>

                </div>
            )}

            {/* 4. THANH NÚT ACTION — không còn "Gửi ký": việc ký diễn ra bên
                ngoài phần mềm trên bản Word xuất ra (xem xuLyXuatWord). */}
            {!laTaoMoi && (
                <PhieuActions
                    coTheSua={coTheSua}
                    laTaoMoi={laTaoMoi}
                    trangThai={phieu?.trangThai}
                    dangLuu={dangLuuYKien || dangLuuGiaTri}
                    dangLamMoi={dangTinhLai}
                    onLuu={luuYKien}
                    onLamMoi={xuLyTinhLai}
                    onXoa={xuLyXoaPhieu}
                />
            )}

            <TinyMceModal
                open={modalYKienOpen}
                title="Soạn ý kiến của BP.QLTT"
                initialValue={yKien}
                onSave={luuYKienModal}
                onCancel={() => setModalYKienOpen(false)}
            />
        </LayoutV2Component>
    );
};

export default Phieu3FormPage;
