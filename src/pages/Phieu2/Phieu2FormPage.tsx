import { Button, DatePicker, Input, InputNumber, Select, Tooltip } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { FaEdit, FaFileWord, FaImage, FaSave } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import LayoutV2Component from "../../components/LayoutV2Component";
import {
    GhiChuHtml,
    PhieuActions,
    PhieuHeader,
    PhieuInputCard,
    PhieuSignatures,
    PhieuToolbar,
    TinyMceModal,
} from "../../components/phieu";

import BepAnModel from "../../models/BepAnModel";
import NhaAnModel from "../../models/NhaAnModel";
import NhaThauModel from "../../models/NhaThauModel";

import { useDanhSachBepAnQuery } from "../../services/bepAnApiV2";
import { useTienDoKyQuery } from "../../services/chuKyPhieuApi";
import { useDanhSachDiaDiemNhaAnQuery } from "../../services/diaDiemNhaAnApiV2";
import { useDanhSachNhaThauQuery } from "../../services/nhaThauApiV2";
import { useChiTietPhieu1Query } from "../../services/phieu1Api";
import {
    Phieu2TieuChiRequest,
    useChiTietPhieu2Query,
    useDanhSachPhieu1KhaDungQuery,
    useDongBoTrangThaiPhieu2Mutation,
    useGuiKyPhieu2Mutation,
    usePhanHoiYKienNhaThauMutation,
    useSuaPhieu2Mutation,
    useThemPhieu2Mutation,
    useXoaPhieu2Mutation,
} from "../../services/phieu2Api";

import { setNotify } from "../../store/notifycationSlide";
import { RootType } from "../../store/types";
import xuatWordPhieu2 from "../../utils/xuatWordPhieu2";

import "./Phieu2FormPage.scss";

// 5 tiêu chí cố định — phải khớp với TieuChiCoDinh ở backend (Phieu2Service.cs)
const TIEU_CHI_CO_DINH: { ma: string; ten: string; thuTu: number }[] = [
    { ma: "VSATTP", ten: "Tuân thủ quy định về vệ sinh an toàn thực phẩm ", thuTu: 0 },
    { ma: "DINH_LUONG_THUC_DON", ten: "Tuân thủ định lượng theo thực đơn đã được phê duyệt", thuTu: 1 },
    { ma: "THAI_DO_PHOI_HOP", ten: "Thái độ phối hợp, cầu thị cải tiến ", thuTu: 2 },
    { ma: "PHAN_HOI_SU_CO", ten: "Phản hồi sự cố, xử lý khiếu nại (nếu có)", thuTu: 3 },
    { ma: "DIEU_KHOAN_KHAC", ten: "Tuân thủ các điều khoản khác của hợp đồng, bản cam kết, quy trình báo cáo (ngoài tiêu chí thuộc bảng đánh giá này)", thuTu: 4 },
];

interface DongTieuChi extends Phieu2TieuChiRequest { }

interface ModalGhiChuState {
    open: boolean;
    maTieuChi?: string;
    // true khi modal đang soạn Ý kiến/phản hồi nhà thầu (không gắn với 1 dòng
    // tiêu chí nào) — dùng phân biệt với modal soạn ghi chú "Không đạt".
    laYKien?: boolean;
    title: string;
    subtitle?: string;
    value: string;
}

const chuaNoiDungHtml = (text?: string): boolean => {
    if (!text) return false;
    return /<[a-z][\s\S]*>/i.test(text);
};

const khoiTaoTieuChi = (): DongTieuChi[] =>
    TIEU_CHI_CO_DINH.map(m => ({
        maTieuChi: m.ma,
        tenTieuChi: m.ten,
        dat: false,
        khongDat: false,
        diem: undefined,
        ghiChu: "",
        thuTu: m.thuTu,
    }));

const Phieu2FormPage: React.FC = () => {
    const { id } = useParams();
    const laTaoMoi = !id || id === "moi";
    const phieuId = laTaoMoi ? undefined : Number(id);

    const authV2 = useSelector((state: RootType) => state.authV2);
    const dispatch = useDispatch();
    const navigator = useNavigate();

    // ============================================================
    // QUERIES & MUTATIONS
    // ============================================================

    // refetchOnMountOrArgChange: bắt buộc gọi lại API mỗi lần vào trang —
    // trạng thái/người ký của phiếu có thể đã đổi do người KHÁC vừa ký/từ
    // chối (ở phiên/trình duyệt khác), RTK Query không có cách nào biết để tự
    // invalidate cache qua tag, nên nếu không ép refetch thì quay lại danh
    // sách rồi vào lại phiếu sẽ thấy dữ liệu cũ (chỉ F5 mới thấy đúng vì F5
    // xóa sạch cache) — xem thêm giải thích ở Phieu1FormPage.tsx.
    const { data: chiTietPhieu, isFetching: dangTaiPhieu } = useChiTietPhieu2Query(
        phieuId!,
        { skip: laTaoMoi, refetchOnMountOrArgChange: true }
    );
    const { data: danhSachBepAn = [] } = useDanhSachBepAnQuery();
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();
    // Tiến độ ký — chỉ dùng để in trạng thái/ngày ký vào bảng chữ ký khi xuất
    // Word (xem xuLyXuatWord), giống Phieu1FormPage.tsx/Phieu3FormPage.tsx.
    // PhieuSignatures.tsx tự fetch riêng cho khối chữ ký hiển thị trên màn
    // hình nên không đụng tới state này.
    const { data: tienDoKy = [] } = useTienDoKyQuery(
        { loaiDoiTuong: "PHIEU2", doiTuongId: phieuId! },
        { skip: laTaoMoi, refetchOnMountOrArgChange: true }
    );

    const [themPhieu2, { isLoading: dangThem }] = useThemPhieu2Mutation();
    const [suaPhieu2, { isLoading: dangSua }] = useSuaPhieu2Mutation();
    const [xoaPhieu2] = useXoaPhieu2Mutation();
    const [guiKyPhieu2, { isLoading: dangGuiKy }] = useGuiKyPhieu2Mutation();
    const [dongBoTrangThaiPhieu2] = useDongBoTrangThaiPhieu2Mutation();
    const [phanHoiYKienNhaThau, { isLoading: dangLuuYKien }] = usePhanHoiYKienNhaThauMutation();

    // ============================================================
    // LOCAL STATES
    // ============================================================

    const [nhaThauId, setNhaThauId] = useState<number | undefined>(undefined);
    const [bepAnId, setBepAnId] = useState<number | undefined>(undefined);
    // Cho chọn NHIỀU nhà ăn — đánh giá 1 lần cho nhiều nhà ăn của cùng bếp ăn
    // (chưa có liên kết chính thức Bếp ăn <-> Nhà ăn nên chọn tự do, xem
    // Phieu2Service.KiemTraNhaAnAsync ở backend).
    const [nhaAnIds, setNhaAnIds] = useState<number[]>([]);
    const [thang, setThang] = useState<number>(dayjs().month() + 1);
    const [nam, setNam] = useState<number>(dayjs().year());
    const [thoiGianTu, setThoiGianTu] = useState<dayjs.Dayjs | null>(null);
    const [thoiGianKiemTraText, setThoiGianKiemTraText] = useState("");
    const [phieu1Id, setPhieu1Id] = useState<number | undefined>(undefined);
    // Lọc thêm theo ngày cho dropdown "Phiếu 1 liên kết" — backend đã lọc sẵn
    // theo nhà thầu/bếp ăn/phòng ban/đã duyệt, nhưng nếu vẫn còn nhiều dòng
    // thì lọc thêm ở đây cho đỡ phải cuộn tìm.
    const [locNgayP1, setLocNgayP1] = useState<dayjs.Dayjs | null>(null);
    const [danhSachTieuChi, setDanhSachTieuChi] = useState<DongTieuChi[]>(khoiTaoTieuChi());
    const [daKhoiTao, setDaKhoiTao] = useState(false);
    const [dangXuatWord, setDangXuatWord] = useState(false);

    // Ý kiến nhà thầu — lưu độc lập qua API riêng
    const [yKien, setYKien] = useState("");
    const [nguoiPhanHoi, setNguoiPhanHoi] = useState("");
    const [ngayPhanHoi, setNgayPhanHoi] = useState<dayjs.Dayjs | null>(null);

    // Modal soạn TinyMCE — chỉ còn dùng cho ghi chú từng tiêu chí "Không đạt"
    // (tối đa 5 dòng cố định). Ý kiến nhà thầu (duy nhất/phiếu) dùng khung
    // TinyMCE hiện thẳng — xem TinyMceInline bên dưới.
    const [modalGhiChu, setModalGhiChu] = useState<ModalGhiChuState>({
        open: false,
        title: "",
        value: "",
    });

    // Danh sách Nhà ăn để chọn — lấy từ danh mục DiaDiemNhaAn có sẵn (hệ chấm
    // điểm bữa ăn cũ), cho chọn tự do, không ràng buộc lọc theo Bếp ăn đã
    // chọn (đã xác nhận nghiệp vụ 2026-08-27, xem Phieu2_DanhGiaSuatAn.md).
    const { data: danhSachDiaDiemNhaAnGoc = [] } = useDanhSachDiaDiemNhaAnQuery();
    const danhSachNhaAn = danhSachDiaDiemNhaAnGoc.filter(n => n.isActive);

    // Danh sách Phiếu 1 khả dụng để chọn liên kết (theo nhà thầu + bếp ăn đã
    // chọn, backend đã lọc sẵn đúng phòng ban của người đang lập + chỉ Phiếu
    // 1 ĐÃ DUYỆT — xem Phieu2Service.DanhSachPhieu1KhaDungAsync) — KHÔNG bắt
    // buộc: ngày đó có thể không lập Phiếu 1 cho bếp ăn, khi đó bỏ trống để
    // nhập tay điểm VSATTP sau.
    const { data: danhSachPhieu1KhaDung = [] } = useDanhSachPhieu1KhaDungQuery(
        { nhaThauId: nhaThauId!, bepAnId },
        { skip: !nhaThauId }
    );
    // Lọc thêm theo đúng 1 ngày (dateonly) client-side cho đỡ cuộn tìm khi
    // danh sách còn dài.
    const danhSachPhieu1DaLoc = danhSachPhieu1KhaDung.filter(p1 =>
        !locNgayP1 || dayjs(p1.ngayKiemTra).isSame(locNgayP1, "day")
    );

    // Chi tiết Phiếu 1 đã chọn — để lấy điểm VSATTP xem trước. Dùng
    // currentData (không phải data) để không dính dữ liệu của Phiếu 1 cũ
    // còn sót lại trong lúc phiếu mới đang tải sau khi đổi lựa chọn.
    const { currentData: chiTietPhieu1DaChon } = useChiTietPhieu1Query(
        phieu1Id!,
        { skip: !phieu1Id }
    );

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        }
    }, [authV2.isAuthenticated, navigator]);

    useEffect(() => {
        setDaKhoiTao(false);
    }, [id]);

    useEffect(() => {
        if (daKhoiTao) return;
        if (!laTaoMoi && (dangTaiPhieu || !chiTietPhieu)) return;

        if (chiTietPhieu) {
            const p = chiTietPhieu.phieu;
            setNhaThauId(p.nhaThauId);
            setBepAnId(p.bepAnId);
            setNhaAnIds(chiTietPhieu.danhSachNhaAn.map(n => n.id));
            setThang(p.thang);
            setNam(p.nam);
            setThoiGianTu(p.thoiGianTu ? dayjs(p.thoiGianTu) : null);
            setThoiGianKiemTraText(p.thoiGianKiemTraText ?? "");
            setPhieu1Id(p.phieu1Id);

            const daLuu = chiTietPhieu.tieuChi;
            setDanhSachTieuChi(
                TIEU_CHI_CO_DINH.map(m => {
                    const luu = daLuu.find(x => x.maTieuChi === m.ma);
                    return {
                        maTieuChi: m.ma,
                        tenTieuChi: luu?.tenTieuChi ?? m.ten,
                        dat: luu?.dat ?? false,
                        khongDat: luu?.khongDat ?? false,
                        diem: luu?.diem,
                        ghiChu: luu?.ghiChu ?? "",
                        thuTu: m.thuTu,
                    };
                })
            );

            if (chiTietPhieu.yKienNhaThau) {
                setYKien(chiTietPhieu.yKienNhaThau.yKien ?? "");
                setNguoiPhanHoi(chiTietPhieu.yKienNhaThau.nguoiPhanHoi ?? "");
                setNgayPhanHoi(
                    chiTietPhieu.yKienNhaThau.ngayPhanHoi
                        ? dayjs(chiTietPhieu.yKienNhaThau.ngayPhanHoi)
                        : null
                );
            }
        }

        setDaKhoiTao(true);
    }, [chiTietPhieu, dangTaiPhieu, laTaoMoi, daKhoiTao]);

    // Tự động đánh giá Đạt/Không đạt cho tiêu chí VSATTP theo kết luận của
    // Phiếu 1 liên kết — không cho sửa tay khi đã có kết luận (chỉ còn cho
    // ghi chú thêm ở trường hợp Không đạt để giải trình, xem chonKetQua).
    useEffect(() => {
        if (!daKhoiTao || !phieu1Id) return;
        const ketLuanPhieu1 = chiTietPhieu1DaChon?.ketLuan?.ketLuan;
        if (!ketLuanPhieu1) return;

        const dat = ketLuanPhieu1 === "DAT";
        setDanhSachTieuChi(ds =>
            ds.map(tc =>
                tc.maTieuChi === "VSATTP"
                    ? { ...tc, dat, khongDat: !dat, diem: chiTietPhieu1DaChon?.ketLuan?.diemDanhGia }
                    : tc
            )
        );
    }, [phieu1Id, chiTietPhieu1DaChon, daKhoiTao]);

    if (!authV2.isAuthenticated) {
        return null;
    }

    const phieu = chiTietPhieu?.phieu;
    const coTheSua =
        laTaoMoi ||
        !phieu ||
        phieu.trangThai === "NHAP" ||
        phieu.trangThai === "TU_CHOI";

    const tenNhaThau = (id?: number) =>
        id ? danhSachNhaThau.find((nt: NhaThauModel) => nt.id === id)?.ten ?? "" : "";

    // Vị trí kiểm tra: tự động lấy theo Nhà ăn đã chọn (nơi phát suất ăn, nơi
    // thực tế diễn ra kiểm tra) — kèm tên bếp ăn nấu cho nhà ăn đó, không nhập tay
    const bepAnHienTai = bepAnId
        ? danhSachBepAn.find((b: BepAnModel) => b.id === bepAnId)
        : undefined;
    const danhSachNhaAnHienTai = danhSachDiaDiemNhaAnGoc.filter((n: NhaAnModel) =>
        nhaAnIds.includes(n.id)
    );
    const tenCacNhaAnHienTai = danhSachNhaAnHienTai.map((n: NhaAnModel) => n.diaDiem).join("; ");
    const viTriKiemTra = tenCacNhaAnHienTai
        ? bepAnHienTai
            ? `${tenCacNhaAnHienTai} (Bếp ăn: ${bepAnHienTai.ten})`
            : tenCacNhaAnHienTai
        : "";

    // Điểm VSATTP xem trước: lấy từ kết luận của Phiếu 1 đang chọn khi đạt
    const diemVsattpXemTruoc = chiTietPhieu1DaChon?.ketLuan?.diemDanhGia;

    // Có kết luận Phiếu 1 liên kết => tiêu chí VSATTP tự động Đạt/Không đạt,
    // khóa không cho bấm sửa tay (chỉ còn ô ghi chú của Không đạt là sửa được).
    const vsattpTuDongTheoPhieu1 = !!phieu1Id && !!chiTietPhieu1DaChon?.ketLuan?.ketLuan;

    const capNhatTieuChi = (maTieuChi: string, thayDoi: Partial<DongTieuChi>) => {
        setDanhSachTieuChi(ds =>
            ds.map(tc => (tc.maTieuChi === maTieuChi ? { ...tc, ...thayDoi } : tc))
        );
    };

    const chonKetQua = (tc: DongTieuChi, ketQua: "DAT" | "KHONG_DAT") => {
        if (!coTheSua) return;
        if (tc.maTieuChi === "VSATTP" && vsattpTuDongTheoPhieu1) return;
        if (ketQua === "DAT") {
            const datMoi = !tc.dat;
            capNhatTieuChi(tc.maTieuChi, {
                dat: datMoi,
                khongDat: datMoi ? false : tc.khongDat,
                diem:
                    tc.maTieuChi === "VSATTP" && datMoi
                        ? diemVsattpXemTruoc ?? tc.diem
                        : tc.diem,
            });
        } else {
            const khongDatMoi = !tc.khongDat;
            capNhatTieuChi(tc.maTieuChi, {
                khongDat: khongDatMoi,
                dat: khongDatMoi ? false : tc.dat,
            });
        }
    };

    // ============================================================
    // SOẠN GHI CHÚ / HÌNH ẢNH TINYMCE
    // ============================================================

    const moModalGhiChuTieuChi = (tc: DongTieuChi) => {
        setModalGhiChu({
            open: true,
            maTieuChi: tc.maTieuChi,
            title: "Soạn ghi chú & Chèn hình ảnh",
            subtitle: tc.tenTieuChi,
            value: tc.ghiChu || "",
        });
    };

    const luuGhiChuModal = (html: string) => {
        if (modalGhiChu.laYKien) {
            setModalGhiChu(prev => ({ ...prev, open: false }));
            if (coTheSua) {
                // Còn sửa được: chỉ cập nhật state, gộp lưu chung với nút "Lưu
                // thay đổi" chính (xem luuPhieu) — đỡ gọi API 2 lần.
                setYKien(html);
            } else {
                // Phiếu đã ký — không còn nút "Lưu thay đổi" để gộp, phải lưu
                // ngay tại đây.
                xuLyLuuYKien(html);
            }
            return;
        }

        if (modalGhiChu.maTieuChi) {
            capNhatTieuChi(modalGhiChu.maTieuChi, { ghiChu: html });
        }
        setModalGhiChu(prev => ({ ...prev, open: false }));
    };

    const moModalYKien = () => {
        setModalGhiChu({
            open: true,
            laYKien: true,
            title: "Soạn ý kiến / phản hồi của nhà thầu",
            value: yKien,
        });
    };

    // ============================================================
    // LƯU & XỬ LÝ PHIẾU
    // ============================================================

    const luuPhieu = async () => {
        if (!nhaThauId || nhaAnIds.length === 0) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: "Vui lòng chọn nhà thầu và ít nhất 1 nhà ăn",
                    messageNotify: "",
                })
            );
            return;
        }

        const payload = {
            thang,
            nam,
            nhaThauId,
            bepAnId,
            nhaAnIds,
            thoiGianTu: thoiGianTu?.toISOString(),
            diaDiem: viTriKiemTra,
            thoiGianKiemTraText,
            phieu1Id,
            tieuChi: danhSachTieuChi,
        };

        try {
            if (laTaoMoi) {
                const ketQua = await themPhieu2(payload).unwrap();
                dispatch(
                    setNotify({
                        typeNotify: "success",
                        titleNotify: "Đã lập phiếu đánh giá",
                        messageNotify: "",
                    })
                );
                navigator(`/phieu2/${ketQua.phieu.id}`);
            } else {
                await suaPhieu2({ id: phieuId!, body: payload }).unwrap();
                // Gộp lưu luôn Ý kiến/phản hồi nhà thầu vào nút "Lưu thay đổi" —
                // đỡ phải bấm 2 lần. Chỉ còn cần nút "Lưu ý kiến phản hồi" riêng ở
                // TinyMceInline cho trường hợp phiếu đã ký (coTheSua = false, nút
                // này ẩn), lúc đó nhà thầu vẫn cần gửi phản hồi được.
                await phanHoiYKienNhaThau({
                    id: phieuId!,
                    body: {
                        yKien,
                        nguoiPhanHoi,
                        ngayPhanHoi: ngayPhanHoi?.format("YYYY-MM-DD"),
                    },
                }).unwrap();
                dispatch(
                    setNotify({
                        typeNotify: "success",
                        titleNotify: "Đã cập nhật phiếu đánh giá",
                        messageNotify: "",
                    })
                );
            }
        } catch (error: any) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: error?.data?.message || "Lưu phiếu thất bại",
                    messageNotify: "",
                })
            );
        }
    };

    const xuLyXoaPhieu = async () => {
        try {
            await xoaPhieu2(phieuId!).unwrap();
            dispatch(
                setNotify({
                    typeNotify: "success",
                    titleNotify: "Đã xóa phiếu đánh giá",
                    messageNotify: "",
                })
            );
            navigator("/phieu2");
        } catch (error: any) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: error?.data?.message || "Xóa phiếu thất bại",
                    messageNotify: "",
                })
            );
        }
    };

    const xuLyGuiKy = async () => {
        try {
            await luuPhieu();
            await guiKyPhieu2(phieuId!).unwrap();
            dispatch(
                setNotify({
                    typeNotify: "success",
                    titleNotify: "Đã gửi ký",
                    messageNotify: "",
                })
            );
        } catch (error: any) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: error?.data?.message || "Gửi ký thất bại",
                    messageNotify: "",
                })
            );
        }
    };

    const xuLyLuuYKien = async (html: string) => {
        if (!phieuId) return;
        try {
            await phanHoiYKienNhaThau({
                id: phieuId,
                body: {
                    yKien: html,
                    nguoiPhanHoi,
                    ngayPhanHoi: ngayPhanHoi?.format("YYYY-MM-DD"),
                },
            }).unwrap();
            setYKien(html);
            dispatch(
                setNotify({
                    typeNotify: "success",
                    titleNotify: "Đã lưu ý kiến phản hồi nhà thầu",
                    messageNotify: "",
                })
            );
        } catch (error: any) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: error?.data?.message || "Lưu ý kiến thất bại",
                    messageNotify: "",
                })
            );
        }
    };

    const layThamSoXuatPhieu2 = () => ({
        soHieu: phieu?.soHieu,
        ngayLap: phieu?.ngayTao,
        tenNhaThau: tenNhaThau(nhaThauId),
        ngayKiemTra: thoiGianTu ? thoiGianTu.format("DD/MM/YYYY") : "........................",
        thoiGianKiemTraText,
        viTriKiemTra,
        danhSachTieuChi: danhSachTieuChi.map(tc => ({
            maTieuChi: tc.maTieuChi,
            tenTieuChi: tc.tenTieuChi || "",
            dat: tc.dat,
            khongDat: tc.khongDat,
            diem: tc.maTieuChi === "VSATTP" ? tc.diem : undefined,
            ghiChuHtml: tc.ghiChu,
        })),
        yKienHtml: yKien,
        chuKy: tienDoKy.map(b => ({
            tenBuoc: b.tenBuoc,
            trangThai: b.trangThai,
            ghiChu: b.ghiChu,
            ngayKy: b.ngayKy,
            nguoiKyHoTen: b.nguoiKyHoTen,
            duongDanChuKy: b.duongDanChuKy,
        })),
    });

    const xuLyXuatWord = async () => {
        setDangXuatWord(true);
        try {
            await xuatWordPhieu2(layThamSoXuatPhieu2());
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Xuất Word thất bại", messageNotify: "" }));
        } finally {
            setDangXuatWord(false);
        }
    };

    const soTieuChiDat = danhSachTieuChi.filter(tc => tc.dat).length;
    const soTieuChiKhongDat = danhSachTieuChi.filter(tc => tc.khongDat).length;
    // Mẫu số = số tiêu chí ĐÃ được đánh giá (dat hoặc khongDat), không cố định
    // /5 — VD 5 tiêu chí nhưng chỉ chấm 3 đạt + 1 không đạt (4 tiêu chí đã
    // đánh giá, 1 còn bỏ trống) thì hiển thị 3/4, không phải 3/5.
    const soTieuChiDaDanhGia = soTieuChiDat + soTieuChiKhongDat;

    // Helper render ô Ghi chú (giống Phiếu 1)
    const renderOGhiChu = (tc: DongTieuChi) => {
        const coHtml = chuaNoiDungHtml(tc.ghiChu);

        if (coHtml) {
            return (
                <div className="ghi-chu-cell-wrapper">
                    <GhiChuHtml
                        className="ghi-chu-rich-preview ghi-chu-content"
                        html={tc.ghiChu || ""}
                    />
                    {coTheSua && (
                        <Tooltip title="Chỉnh sửa ghi chú / ảnh minh chứng">
                            <Button
                                className="no-print ghi-chu-btn-edit"
                                size="small"
                                icon={<FaEdit />}
                                onClick={() => moModalGhiChuTieuChi(tc)}
                            />
                        </Tooltip>
                    )}
                </div>
            );
        }

        if (coTheSua) {
            return (
                <div className="ghi-chu-cell-wrapper">
                    <div className="ghi-chu-content">
                        <Input.TextArea
                            bordered={false}
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            placeholder="Ghi chú (bắt buộc nếu không đạt)..."
                            value={tc.ghiChu}
                            onChange={e =>
                                capNhatTieuChi(tc.maTieuChi, { ghiChu: e.target.value })
                            }
                        />
                    </div>
                    <Tooltip title="Chèn hình ảnh / Soạn chi tiết">
                        <Button
                            className="no-print ghi-chu-btn-edit"
                            size="small"
                            icon={<FaImage />}
                            onClick={() => moModalGhiChuTieuChi(tc)}
                        />
                    </Tooltip>
                </div>
            );
        }

        return <div className="ghi-chu-rich-preview">{tc.ghiChu}</div>;
    };

    return (
        <LayoutV2Component>
            {/* 1. TOOLBAR CHUNG */}
            <PhieuToolbar
                title={
                    laTaoMoi
                        ? "Lập phiếu đánh giá chất lượng dịch vụ suất ăn"
                        : `Phiếu đánh giá suất ăn — ${phieu?.soHieu ?? ""}`
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

            {/* 2. FORM THÔNG TIN NHẬP LIỆU (NO-PRINT) */}
            <PhieuInputCard>
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-12 gap-3">
                        <div className="lg:col-span-1">
                            <div className="mb-1 text-xs font-medium">Ngày kiểm tra</div>
                            <DatePicker
                                className="w-full"
                                size="small"
                                format="DD/MM/YYYY"
                                disabled={!coTheSua}
                                value={thoiGianTu}
                                // Không cho lập phiếu với ngày kiểm tra trong tương lai —
                                // chỉ chọn được hôm nay hoặc trước đó.
                                disabledDate={(current) => !!current && current > dayjs().endOf("day")}
                                onChange={v => {
                                    setThoiGianTu(v);
                                    // Tháng/Năm của phiếu lấy luôn theo Ngày kiểm tra — gộp
                                    // chung 1 input thay vì để 2 dropdown Tháng/Năm riêng.
                                    if (v) {
                                        setThang(v.month() + 1);
                                        setNam(v.year());
                                    }
                                }}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <div className="mb-1 text-xs font-medium">Nhà thầu</div>
                            <Select
                                className="w-full"
                                size="small"
                                placeholder="-- Chọn nhà thầu --"
                                showSearch
                                optionFilterProp="children"
                                disabled={!coTheSua}
                                value={nhaThauId}
                                onChange={v => {
                                    setNhaThauId(v);
                                    setPhieu1Id(undefined);
                                }}
                            >
                                {danhSachNhaThau.map((nt: NhaThauModel) => (
                                    <Select.Option key={nt.id} value={nt.id}>
                                        {nt.ten}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="mb-1 text-xs font-medium">Bếp ăn (nơi nấu)</div>
                            <Select
                                className="w-full"
                                size="small"
                                allowClear
                                placeholder="-- Chọn bếp ăn --"
                                showSearch
                                optionFilterProp="children"
                                disabled={!coTheSua}
                                value={bepAnId}
                                onChange={v => {
                                    setBepAnId(v);
                                    setPhieu1Id(undefined);
                                }}
                            >
                                {danhSachBepAn.map((b: BepAnModel) => (
                                    <Select.Option key={b.id} value={b.id}>
                                        {b.ten}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="mb-1 text-xs font-medium">
                                Nhà ăn — có thể chọn nhiều
                            </div>
                            <Select
                                mode="multiple"
                                className="w-full"
                                size="small"
                                placeholder="-- Chọn 1 hoặc nhiều nhà ăn --"
                                showSearch
                                optionFilterProp="children"
                                disabled={!coTheSua}
                                value={nhaAnIds}
                                onChange={v => setNhaAnIds(v)}
                            >
                                {danhSachNhaAn.map((n: NhaAnModel) => (
                                    <Select.Option key={n.id} value={n.id}>
                                        {n.diaDiem}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>

                        <div className="lg:col-span-3">
                            <div className="mb-1 text-xs font-medium">Phiếu 1 (VSATTP) liên kết</div>
                            {danhSachPhieu1KhaDung.length > 5 && (
                                <DatePicker
                                    className="w-full mb-1"
                                    size="small"
                                    allowClear
                                    format="DD/MM/YYYY"
                                    placeholder="Lọc theo ngày kiểm tra"
                                    value={locNgayP1}
                                    onChange={setLocNgayP1}
                                />
                            )}
                            <Select
                                className="w-full"
                                size="small"
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                placeholder="-- Không có Phiếu 1 --"
                                disabled={!coTheSua || !nhaThauId}
                                value={phieu1Id}
                                onChange={v => setPhieu1Id(v)}
                                notFoundContent="Không có Phiếu 1 (đã duyệt) nào khớp bộ lọc"
                            >
                                {danhSachPhieu1DaLoc.map(p1 => {
                                    const nhanP1 = `${p1.soHieu} — ${new Date(p1.ngayKiemTra).toLocaleDateString("vi-VN")}`;
                                    // title = tooltip gốc trình duyệt khi hover, hiện đủ tên
                                    // dù ô bị cắt bớt do không đủ chỗ hiển thị.
                                    return (
                                        <Select.Option key={p1.id} value={p1.id} label={nhanP1} title={nhanP1}>
                                            {nhanP1}
                                        </Select.Option>
                                    );
                                })}
                            </Select>
                        </div>

                        

                        <div className="lg:col-span-2">
                            <div className="mb-1 text-xs font-medium">Vị trí kiểm tra</div>
                            <Input size="small" disabled value={viTriKiemTra} placeholder="Tự động lấy theo Nhà ăn đã chọn" />
                        </div>
                    </div>
            </PhieuInputCard>

            {/* 3. TỜ PHIẾU IN A4 */}
            <div className="phieu-a4">
                <PhieuHeader
                    maPhieu="PHIEU2"
                    soHieu={phieu?.soHieu}
                    title="PHIẾU ĐÁNH GIÁ CHẤT LƯỢNG DỊCH VỤ SUẤT ĂN"
                    infoItems={[
                        { label: "Nhà thầu:", value: tenNhaThau(nhaThauId) || "........................" },
                        {
                            label: "Ngày kiểm tra:",
                            value: thoiGianTu ? thoiGianTu.format("DD/MM/YYYY") : "........................",
                        },
                    ]}
                />

                <table className="phieu-table phieu2-table">
                    <thead>
                        <tr>
                            <th rowSpan={2} className="cot-thoi-gian">Thời gian kiểm tra</th>
                            <th rowSpan={2} className="cot-vi-tri">Vị trí kiểm tra</th>
                            {danhSachTieuChi.map(tc => (
                                <th key={tc.maTieuChi} colSpan={2} className="cot-tieu-chi-ten">
                                    {tc.tenTieuChi}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {danhSachTieuChi.map((tc, index) => {
                                const laCotCuoi = index === danhSachTieuChi.length - 1;
                                return (
                                    <React.Fragment key={tc.maTieuChi}>
                                        <th className="cot-dat-sub">
                                            Đạt
                                            {tc.maTieuChi === "VSATTP" && (
                                                <div className="ghi-chu-note-header">
                                                    {phieu1Id ? "(tự động theo Phiếu 1)" : "(không có Phiếu 1 — nhập tay)"}
                                                </div>
                                            )}
                                        </th>
                                        <th className={`cot-khong-dat-sub ${laCotCuoi ? "cot-khong-dat-sub-lon" : ""}`}>
                                            K-Đạt
                                        </th>
                                    </React.Fragment>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="dong-tieu-chi">
                            <td className="o-thoi-gian">
                                {coTheSua ? (
                                    <Input.TextArea
                                        bordered={false}
                                        className="input-table"
                                        autoSize={{ minRows: 1, maxRows: 3 }}
                                        placeholder="VD: Từ 16h30 đến 19h00"
                                        value={thoiGianKiemTraText}
                                        onChange={e => setThoiGianKiemTraText(e.target.value)}
                                    />
                                ) : (
                                    thoiGianKiemTraText || "........................"
                                )}
                            </td>
                            <td className="o-vi-tri">{viTriKiemTra || "........................"}</td>
                            {danhSachTieuChi.map(tc => {
                                const laVsattpKhoa =
                                    tc.maTieuChi === "VSATTP" && vsattpTuDongTheoPhieu1;
                                return (
                                <React.Fragment key={tc.maTieuChi}>
                                    <td
                                        className={`o-ket-qua ${tc.dat ? "da-chon" : ""} ${laVsattpKhoa ? "o-ket-qua-khoa" : ""}`}
                                        onClick={() => chonKetQua(tc, "DAT")}
                                        title={laVsattpKhoa ? "Tự động theo kết luận Phiếu 1" : undefined}
                                    >
                                        {tc.dat && "✓"}
                                        {tc.dat && tc.maTieuChi === "VSATTP" && (
                                            !phieu1Id && coTheSua ? (
                                                <div className="o-diem-inline" onClick={e => e.stopPropagation()}>
                                                    <InputNumber
                                                        size="small"
                                                        min={0}
                                                        max={5}
                                                        step={0.01}
                                                        placeholder="Nhập điểm"
                                                        value={tc.diem}
                                                        onChange={v =>
                                                            capNhatTieuChi(tc.maTieuChi, { diem: v ?? undefined })
                                                        }
                                                    />
                                                </div>
                                            ) : (
                                                tc.diem !== undefined &&
                                                tc.diem !== null && (
                                                    <div className="o-diem-inline">
                                                        {Number(tc.diem).toLocaleString("vi-VN", {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                        đ
                                                    </div>
                                                )
                                            )
                                        )}
                                    </td>
                                    <td
                                        className={`o-ket-qua o-khong-dat ${tc.khongDat ? "da-chon" : ""} ${laVsattpKhoa ? "o-ket-qua-khoa" : ""}`}
                                        onClick={() => chonKetQua(tc, "KHONG_DAT")}
                                        title={laVsattpKhoa ? "Tự động theo kết luận Phiếu 1" : undefined}
                                    >
                                        {tc.khongDat && "✓"}
                                        {tc.khongDat && (
                                            <div className="o-khong-dat-ghichu" onClick={e => e.stopPropagation()}>
                                                {renderOGhiChu(tc)}
                                            </div>
                                        )}
                                    </td>
                                </React.Fragment>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>

                {/* Kết quả tổng hợp */}
                <div className="phieu-ket-luan">
                    <div className="phieu-ket-luan-title">Kết quả</div>
                    <div className="ket-qua-tong-hop">
                        Đạt: <strong>{soTieuChiDat}/{soTieuChiDaDanhGia}</strong>
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        Không đạt: <strong>{soTieuChiKhongDat}/{soTieuChiDaDanhGia}</strong>
                    </div>
                </div>

                {/* Ý kiến nhà thầu — hiển thị dạng preview (giống ô Ghi chú của
                    cột "Không đạt": renderOGhiChu), bấm icon để mở modal TinyMCE
                    soạn/chèn ảnh, thay vì hiện khung soạn thảo to lù lù ngay trên
                    trang. Khi còn sửa được (coTheSua), nội dung sau khi lưu ở modal
                    chỉ cập nhật state, gộp lưu chung với nút "Lưu thay đổi" chính
                    (xem luuPhieu, luuGhiChuModal) — đỡ gọi API 2 lần. Sau khi phiếu
                    đã ký/duyệt (coTheSua = false), nút "Lưu thay đổi" chính ẩn đi
                    nên lưu ngay tại chỗ + hiện thêm nút "Lưu phản hồi" cạnh 2 ô
                    Người/Ngày phản hồi (đổi thông tin này mà không đụng tới nội
                    dung trong modal thì vẫn cần cách để lưu). */}
                <div className="phieu-y-kien">
                    <div className="phieu-ket-luan-title">Ý kiến / phản hồi của nhà thầu</div>
                    {!laTaoMoi ? (
                        <>
                            <div className="ghi-chu-cell-wrapper">
                                {yKien ? (
                                    <GhiChuHtml
                                        className="ghi-chu-rich-preview ghi-chu-content"
                                        html={yKien}
                                    />
                                ) : (
                                    <span className="text-gray-400 text-sm">Chưa có ý kiến</span>
                                )}
                                <Tooltip title="Soạn ý kiến / chèn ảnh minh chứng">
                                    <Button
                                        className="no-print ghi-chu-btn-edit"
                                        size="small"
                                        icon={<FaEdit />}
                                        onClick={moModalYKien}
                                    />
                                </Tooltip>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 no-print items-end">
                                <div>
                                    <div className="mb-1 font-medium">Người phản hồi</div>
                                    <Input
                                        value={nguoiPhanHoi}
                                        onChange={e => setNguoiPhanHoi(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <div className="mb-1 font-medium">Ngày phản hồi</div>
                                    <DatePicker
                                        className="w-full"
                                        format="DD/MM/YYYY"
                                        value={ngayPhanHoi}
                                        onChange={v => setNgayPhanHoi(v)}
                                    />
                                </div>
                            </div>

                            {!coTheSua && (
                                <div className="mt-3 no-print">
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<FaSave />}
                                        loading={dangLuuYKien}
                                        onClick={() => xuLyLuuYKien(yKien)}
                                    >
                                        Lưu phản hồi
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-gray-400 no-print">
                            Lập phiếu trước khi nhập ý kiến phản hồi nhà thầu.
                        </div>
                    )}
                </div>

                {/* Khối Chữ ký — kiêm luôn chọn người ký / ký / từ chối (xem
                    huongdanquanlytaikhoan.md mục 5.2) */}
                <PhieuSignatures
                    loaiDoiTuong="PHIEU2"
                    doiTuongId={phieuId}
                    onDaDongBo={() => phieuId && dongBoTrangThaiPhieu2(phieuId)}
                />

                {/* Ghi chú cuối phiếu */}
                <div className="phieu-ghi-chu-footer">
                    <div className="ghi-chu-footer-title">Ghi chú:</div>
                    <div className="ghi-chu-footer-item">- Kết quả ĐẠT, đánh dấu tick.</div>
                    <div className="ghi-chu-footer-item">
                        - Đối với kết quả KHÔNG ĐẠT, người đánh giá ghi rõ lý do và hình kèm ảnh minh chứng theo nếu có.
                    </div>
                </div>
            </div>

            {/* 4. THANH NÚT ACTION */}
            <PhieuActions
                coTheSua={coTheSua}
                laTaoMoi={laTaoMoi}
                trangThai={phieu?.trangThai}
                dangLuu={dangThem || dangSua || dangLuuYKien}
                dangGuiKy={dangGuiKy}
                onLuu={luuPhieu}
                onGuiKy={xuLyGuiKy}
                onXoa={xuLyXoaPhieu}
            />

            {/* 6. MODAL SOẠN GHI CHÚ & CHÈN HÌNH ẢNH (TINYMCE) */}
            <TinyMceModal
                open={modalGhiChu.open}
                title={modalGhiChu.title}
                subtitle={modalGhiChu.subtitle}
                initialValue={modalGhiChu.value}
                onSave={luuGhiChuModal}
                onCancel={() => setModalGhiChu(prev => ({ ...prev, open: false }))}
            />
        </LayoutV2Component>
    );
};

export default Phieu2FormPage;
