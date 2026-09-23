import {
    Button,
    Card,
    DatePicker,
    Input,
    Select,
    Tooltip,
} from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { FaEdit, FaFileWord, FaImage, FaPlus, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import LayoutV2Component from "../../components/LayoutV2Component";
import {
    GhiChuHtml,
    PhieuActions,
    PhieuHeader,
    PhieuSignatures,
    PhieuToolbar,
    TinyMceModal,
} from "../../components/phieu";

import BepAnModel from "../../models/BepAnModel";
import NhaThauModel from "../../models/NhaThauModel";
import NhomTieuChiModel from "../../models/NhomTieuChiModel";
import Phieu1ChiTietModel from "../../models/Phieu1ChiTietModel";
import PhongBanModel from "../../models/PhongBanModel";
import TieuChiModel from "../../models/TieuChiModel";

import { useDanhSachBepAnQuery } from "../../services/bepAnApiV2";
import { useTienDoKyQuery } from "../../services/chuKyPhieuApi";
import { useDanhSachNhaThauQuery } from "../../services/nhaThauApiV2";
import { laHoatDong, locDanhMucChon, tenOptionDanhMuc } from "../../utils/danhMucHoatDong";
import { useDanhSachNhomTieuChiQuery } from "../../services/nhomTieuChiApi";
import {
    Phieu1ChiTietRequest,
    useChiTietPhieu1Query,
    useDongBoTrangThaiPhieu1Mutation,
    useGuiKyPhieu1Mutation,
    useSuaPhieu1Mutation,
    useThemPhieu1Mutation,
    useXoaPhieu1Mutation,
} from "../../services/phieu1Api";
import { useDanhSachPhongBanQuery } from "../../services/phongBanApiV2";
import { useDanhSachTieuChiQuery } from "../../services/tieuChiApi";

import { setNotify } from "../../store/notifycationSlide";
import { RootType } from "../../store/types";
import xuatWordPhieu1 from "../../utils/xuatWordPhieu1";

import "./Phieu1FormPage.scss";

interface DongChecklist {
    id?: number;
    nhomId?: number;
    tieuChiId?: number;
    // Snapshot tên tiêu chí lúc lưu (Phieu1ChiTietModel.tenTieuChi) — ưu tiên
    // dùng để hiển thị thay vì tra cứu sống, để phiếu cũ không đổi theo khi
    // Admin sửa/xóa tiêu chí gốc sau này. Rỗng với dòng mới chưa từng lưu
    // (khi đó vẫn tra cứu sống theo tieuChiId, hợp lý vì chưa có gì để "đóng
    // băng" cả).
    tenTieuChiSnapshot?: string;
    noiDungTuThem?: string;
    ketQua?: string;
    ghiChu?: string;
    thuTu: number;
    laDongTuThem: boolean;
}

interface ModalGhiChuState {
    open: boolean;
    thuTu?: number;
    // true khi modal đang soạn Ghi chú Kết luận (duy nhất/phiếu, không gắn
    // với dòng checklist nào) — phân biệt với modal soạn ghi chú từng dòng.
    laKetLuan?: boolean;
    title: string;
    subtitle?: string;
    value: string;
}

const chuaNoiDungHtml = (text?: string): boolean => {
    if (!text) return false;
    return /<[a-z][\s\S]*>/i.test(text);
};

const tinhKetLuanTamThoi = (danhSachDong: DongChecklist[]) => {
    const hopLe = danhSachDong.filter(
        d => d.ketQua === "DAT" || d.ketQua === "KHONG_DAT"
    );
    const tongSo = hopLe.length;
    const soDat = hopLe.filter(d => d.ketQua === "DAT").length;
    const tyLe = tongSo > 0 ? Math.round((soDat / tongSo) * 10000) / 100 : null;
    const ketLuan = tyLe !== null ? (tyLe >= 50 ? "DAT" : "KHONG_DAT") : null;
    const diem = tyLe !== null ? Math.round(((tyLe * 5) / 100) * 100) / 100 : null;

    return { tongSo, soDat, tyLe, ketLuan, diem };
};

const Phieu1FormPage: React.FC = () => {
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
    // xóa sạch cache).
    const { data: chiTietPhieu, isFetching: dangTaiPhieu } = useChiTietPhieu1Query(
        phieuId!,
        { skip: laTaoMoi, refetchOnMountOrArgChange: true }
    );
    const { data: danhSachBepAn = [] } = useDanhSachBepAnQuery();
    const { data: danhSachPhongBan = [] } = useDanhSachPhongBanQuery();
    const { data: danhSachNhaThau = [] } = useDanhSachNhaThauQuery();
    const { data: danhSachNhom = [], isFetching: dangTaiNhom } = useDanhSachNhomTieuChiQuery({
        loaiPhieu: "PHIEU1",
        dangHoatDong: true,
    });
    // Không lọc dangHoatDong — dùng để HIỂN THỊ các dòng đã lưu theo nhóm (xem
    // nhomVaDong): nhóm bị ngừng hoạt động sau này thì dòng của phiếu cũ vẫn
    // phải hiện đúng dưới nhóm đó, không được biến mất.
    const { data: danhSachNhomTraTen = [] } = useDanhSachNhomTieuChiQuery({ loaiPhieu: "PHIEU1" });
    const { data: danhSachTieuChiTatCa = [], isFetching: dangTaiTieuChiTatCa } = useDanhSachTieuChiQuery({
        dangHoatDong: true,
    });
    // Không lọc dangHoatDong — dùng riêng để TRA TÊN hiển thị, kể cả tiêu chí
    // đã bị vô hiệu hóa sau này, để phiếu cũ (đặc biệt đã ký) vẫn hiện đúng
    // tên tiêu chí lúc đó thay vì hiện trống (xem tenTieuChi bên dưới).
    const { data: danhSachTieuChiTraTen = [] } = useDanhSachTieuChiQuery();
    // Tiến độ ký — chỉ dùng để in trạng thái/ngày ký vào bảng chữ ký khi xuất
    // Word (xem xuLyXuatWord), giống Phieu3FormPage.tsx/Phieu4FormPage.tsx.
    // PhieuSignatures.tsx tự fetch riêng cho khối chữ ký hiển thị trên màn
    // hình nên không đụng tới state này.
    const { data: tienDoKy = [] } = useTienDoKyQuery(
        { loaiDoiTuong: "PHIEU1", doiTuongId: phieuId! },
        { skip: laTaoMoi, refetchOnMountOrArgChange: true }
    );

    const [themPhieu1, { isLoading: dangThem }] = useThemPhieu1Mutation();
    const [suaPhieu1, { isLoading: dangSua }] = useSuaPhieu1Mutation();
    const [xoaPhieu1] = useXoaPhieu1Mutation();
    const [guiKyPhieu1, { isLoading: dangGuiKy }] = useGuiKyPhieu1Mutation();
    const [dongBoTrangThaiPhieu1] = useDongBoTrangThaiPhieu1Mutation();

    // ============================================================
    // LOCAL STATES
    // ============================================================

    const [ngayKiemTra, setNgayKiemTra] = useState(dayjs());
    const [bepAnId, setBepAnId] = useState<number | undefined>(undefined);
    const [nhaThauId, setNhaThauId] = useState<number | undefined>(undefined);
    // Không cho chọn tay nữa — phiếu MỚI luôn lấy đúng phòng ban của tài
    // khoản đang đăng nhập (mỗi phòng ban lập Phiếu 1 độc lập để đối chiếu
    // chéo, xem Phieu1_KiemTraVSATTP.md). Phiếu ĐÃ LƯU giữ nguyên phòng ban
    // gốc lúc lập (nạp lại từ chiTietPhieu ở effect bên dưới), không đổi theo
    // người đang xem/sửa.
    const [phongBanId, setPhongBanId] = useState<number | undefined>(authV2.nguoiDung?.phongBanId);
    const [ketLuanGhiChu, setKetLuanGhiChu] = useState("");
    const [danhSachDong, setDanhSachDong] = useState<DongChecklist[]>([]);
    const [daKhoiTao, setDaKhoiTao] = useState(false);
    const [dangXuatWord, setDangXuatWord] = useState(false);

    // Modal soạn TinyMCE dùng chung cho ghi chú từng dòng checklist VÀ ghi chú
    // Kết luận (duy nhất/phiếu) — xem moModalGhiChuDong/moModalKetLuan.
    const [modalGhiChu, setModalGhiChu] = useState<ModalGhiChuState>({
        open: false,
        title: "",
        value: "",
    });

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
        // Chờ CẢ 2 query (Nhóm tiêu chí + Tiêu chí) tải xong — đây là 2 API
        // độc lập, nếu chỉ chờ danhSachNhom (thường nhanh hơn vì ít dòng) mà
        // không chờ danhSachTieuChiTatCa thì effect sẽ build checklist với
        // danh sách tiêu chí RỖNG (do race condition), rồi khóa cứng bằng
        // setDaKhoiTao(true) bên dưới — checklist mãi trống cho tới khi "id"
        // đổi (VD sau khi Lập phiếu xong, điều hướng sang /phieu1/{id} mới).
        if (dangTaiNhom || dangTaiTieuChiTatCa) return;
        if (!laTaoMoi && (dangTaiPhieu || !chiTietPhieu)) return;

        const chiTietDaLuu = chiTietPhieu?.chiTiet ?? [];
        const trangThaiPhieu = chiTietPhieu?.phieu.trangThai;
        // Phiếu đã CHO_KY/DA_DUYET là hồ sơ đã chốt — chỉ hiển thị ĐÚNG các
        // dòng đã lưu lúc ký, KHÔNG trộn thêm tiêu chí mới phát sinh sau này
        // (tránh phiếu cũ tự "mọc" thêm dòng trống chưa trả lời khi Admin
        // thêm tiêu chí mới, gây hiểu nhầm là phiếu thiếu đánh giá).
        const phieuDaChotKhongTronMoi =
            !laTaoMoi && (trangThaiPhieu === "CHO_KY" || trangThaiPhieu === "DA_DUYET");

        let dong: DongChecklist[];

        if (phieuDaChotKhongTronMoi) {
            dong = chiTietDaLuu
                .slice()
                .sort((a, b) => a.thuTu - b.thuTu)
                .map((ct: Phieu1ChiTietModel) => ({
                    id: ct.id,
                    nhomId: ct.nhomId,
                    tieuChiId: ct.tieuChiId,
                    tenTieuChiSnapshot: ct.tenTieuChi,
                    noiDungTuThem: ct.noiDungTuThem,
                    ketQua: ct.ketQua,
                    ghiChu: ct.ghiChu,
                    thuTu: ct.thuTu,
                    laDongTuThem: !ct.tieuChiId,
                }));
        } else {
            const idNhomHopLe = new Set(danhSachNhom.map((n: NhomTieuChiModel) => n.id));
            const tieuChiTrongPhieu1 = danhSachTieuChiTatCa.filter(
                (tc: TieuChiModel) => tc.nhomId && idNhomHopLe.has(tc.nhomId)
            );
            const nhomSapXep = [...danhSachNhom].sort((a: NhomTieuChiModel, b: NhomTieuChiModel) => a.thuTu - b.thuTu);
            dong = [];
            let thuTu = 0;

            for (const nhom of nhomSapXep) {
                const tieuChiCuaNhom = tieuChiTrongPhieu1
                    .filter((tc: TieuChiModel) => tc.nhomId === nhom.id)
                    .sort((a: TieuChiModel, b: TieuChiModel) => a.thuTu - b.thuTu);

                for (const tc of tieuChiCuaNhom) {
                    const daLuu = chiTietDaLuu.find((ct: Phieu1ChiTietModel) => ct.tieuChiId === tc.id);
                    dong.push({
                        id: daLuu?.id,
                        nhomId: nhom.id,
                        tieuChiId: tc.id,
                        tenTieuChiSnapshot: daLuu?.tenTieuChi,
                        ketQua: daLuu?.ketQua,
                        ghiChu: daLuu?.ghiChu,
                        thuTu: thuTu++,
                        laDongTuThem: false,
                    });
                }
            }

            const idTieuChiTrongMaster = new Set(tieuChiTrongPhieu1.map((tc: TieuChiModel) => tc.id));
            for (const ct of chiTietDaLuu) {
                if (ct.tieuChiId && idTieuChiTrongMaster.has(ct.tieuChiId)) {
                    continue;
                }
                dong.push({
                    id: ct.id,
                    nhomId: ct.nhomId,
                    tieuChiId: ct.tieuChiId,
                    tenTieuChiSnapshot: ct.tenTieuChi,
                    noiDungTuThem: ct.noiDungTuThem,
                    ketQua: ct.ketQua,
                    ghiChu: ct.ghiChu,
                    thuTu: thuTu++,
                    laDongTuThem: !ct.tieuChiId,
                });
            }
        }

        setDanhSachDong(dong);

        if (chiTietPhieu) {
            setNgayKiemTra(dayjs(chiTietPhieu.phieu.ngayKiemTra));
            setBepAnId(chiTietPhieu.phieu.bepAnId);
            setNhaThauId(chiTietPhieu.phieu.nhaThauId);
            setPhongBanId(chiTietPhieu.phieu.phongBanId);
            setKetLuanGhiChu(chiTietPhieu.ketLuan?.ghiChu ?? "");
        }

        setDaKhoiTao(true);
    }, [
        danhSachNhom,
        danhSachTieuChiTatCa,
        dangTaiNhom,
        dangTaiTieuChiTatCa,
        chiTietPhieu,
        dangTaiPhieu,
        laTaoMoi,
        daKhoiTao,
    ]);

    if (!authV2.isAuthenticated) {
        return null;
    }

    const phieu = chiTietPhieu?.phieu;
    const coTheSua =
        laTaoMoi ||
        !phieu ||
        phieu.trangThai === "NHAP" ||
        phieu.trangThai === "TU_CHOI";

    const tenTieuChi = (tieuChiId?: number) =>
        danhSachTieuChiTraTen.find((tc: TieuChiModel) => tc.id === tieuChiId)?.noiDung ?? "";

    const tenNhaThau = (nhaThauId: number) =>
        danhSachNhaThau.find((nt: NhaThauModel) => nt.id === nhaThauId)?.ten ?? "";

    const tenPhongBan = (id?: number) =>
        danhSachPhongBan.find((pb: PhongBanModel) => pb.id === id)?.ten ?? "";

    // Chỉ gợi ý nhà thầu còn hoạt động — nhà thầu đã ngừng không được chọn mới.
    const nhaThauCuaBepAn = (bepId?: number) => {
        const idNt = danhSachBepAn.find((b: BepAnModel) => b.id === bepId)?.nhaThauId;
        return danhSachNhaThau.some((nt: NhaThauModel) => nt.id === idNt && laHoatDong(nt)) ? idNt : undefined;
    };

    // Option chọn: chỉ bản ghi còn hoạt động + giá trị đã lưu trên phiếu (giữ lịch sử).
    const optionBepAn = locDanhMucChon(danhSachBepAn, [chiTietPhieu?.phieu.bepAnId, bepAnId]);
    const optionNhaThau = locDanhMucChon(danhSachNhaThau, [chiTietPhieu?.phieu.nhaThauId, nhaThauId]);

    // Dùng danh sách nhóm ĐẦY ĐỦ — nhóm không có dòng nào sẽ bị lọc bỏ bên
    // dưới, nên phiếu mới chỉ hiện nhóm đang hoạt động (checklist dựng từ
    // danhSachNhom), còn phiếu cũ vẫn giữ nhóm đã ngừng.
    const nhomVaDong = danhSachNhomTraTen
        .slice()
        .sort((a: NhomTieuChiModel, b: NhomTieuChiModel) => a.thuTu - b.thuTu)
        .map((nhom: NhomTieuChiModel) => ({
            nhom,
            dong: danhSachDong
                .filter(d => d.nhomId === nhom.id)
                .sort((a, b) => a.thuTu - b.thuTu),
        }))
        .filter(x => x.dong.length > 0)
        // Đánh số SAU khi lọc để số nhóm liên tục (không nhảy số vì nhóm rỗng)
        .map((x, nhomIndex) => ({ ...x, soNhom: nhomIndex + 1 }));

    const dongKhongNhom = danhSachDong
        .filter(d => !d.nhomId)
        .sort((a, b) => a.thuTu - b.thuTu);

    const capNhatDong = (thuTu: number, thayDoi: Partial<DongChecklist>) => {
        setDanhSachDong(ds =>
            ds.map(d => (d.thuTu === thuTu ? { ...d, ...thayDoi } : d))
        );
    };

    const themDongTuDo = (nhomId: number) => {
        setDanhSachDong(ds => [
            ...ds,
            {
                thuTu: ds.length,
                nhomId,
                laDongTuThem: true,
            },
        ]);
    };

    const xoaDong = (thuTu: number) => {
        setDanhSachDong(ds =>
            ds
                .filter(d => d.thuTu !== thuTu)
                .map((d, i) => ({ ...d, thuTu: i }))
        );
    };

    const chonKetQua = (dong: DongChecklist, ketQua: string) => {
        if (!coTheSua) return;
        capNhatDong(dong.thuTu, {
            ketQua: dong.ketQua === ketQua ? undefined : ketQua,
        });
    };

    // ============================================================
    // SOẠN GHI CHÚ / HÌNH ẢNH TINYMCE
    // ============================================================

    const moModalGhiChuDong = (dong: DongChecklist, tieuChiTen?: string) => {
        setModalGhiChu({
            open: true,
            thuTu: dong.thuTu,
            title: "Soạn ghi chú & Chèn hình ảnh",
            subtitle: tieuChiTen || dong.noiDungTuThem || `Dòng ${dong.thuTu + 1}`,
            value: dong.ghiChu || "",
        });
    };

    const luuGhiChuModal = (html: string) => {
        if (modalGhiChu.laKetLuan) {
            setKetLuanGhiChu(html);
            setModalGhiChu(prev => ({ ...prev, open: false }));
            return;
        }
        if (modalGhiChu.thuTu !== undefined) {
            capNhatDong(modalGhiChu.thuTu, { ghiChu: html });
        }
        setModalGhiChu(prev => ({ ...prev, open: false }));
    };

    const moModalKetLuan = () => {
        setModalGhiChu({
            open: true,
            laKetLuan: true,
            title: "Soạn ghi chú Kết luận",
            value: ketLuanGhiChu,
        });
    };

    // ============================================================
    // LƯU & XỬ LÝ PHIẾU
    // ============================================================

    const luuPhieu = async () => {
        if (!bepAnId || !nhaThauId) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: "Vui lòng chọn bếp ăn và nhà thầu",
                    messageNotify: "",
                })
            );
            return;
        }
        if (!phongBanId) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: "Tài khoản của bạn chưa được gán Phòng ban — liên hệ Admin để cập nhật trước khi lập phiếu",
                    messageNotify: "",
                })
            );
            return;
        }

        const chiTiet: Phieu1ChiTietRequest[] = danhSachDong.map(d => ({
            id: d.id,
            nhomId: d.nhomId,
            tieuChiId: d.laDongTuThem ? undefined : d.tieuChiId,
            noiDungTuThem: d.laDongTuThem ? d.noiDungTuThem : undefined,
            ketQua: d.ketQua,
            ghiChu: d.ghiChu,
            thuTu: d.thuTu,
        }));

        const payload = {
            ngayKiemTra: ngayKiemTra.format("YYYY-MM-DD"),
            bepAnId,
            nhaThauId,
            phongBanId,
            ketLuanGhiChu,
            chiTiet,
        };

        try {
            if (laTaoMoi) {
                const ketQua = await themPhieu1(payload).unwrap();
                dispatch(
                    setNotify({
                        typeNotify: "success",
                        titleNotify: "Đã lập phiếu kiểm tra",
                        messageNotify: "",
                    })
                );
                navigator(`/phieu1/${ketQua.phieu.id}`);
            } else {
                await suaPhieu1({ id: phieuId!, body: payload }).unwrap();
                dispatch(
                    setNotify({
                        typeNotify: "success",
                        titleNotify: "Đã cập nhật phiếu kiểm tra",
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
            await xoaPhieu1(phieuId!).unwrap();
            dispatch(
                setNotify({
                    typeNotify: "success",
                    titleNotify: "Đã xóa phiếu kiểm tra",
                    messageNotify: "",
                })
            );
            navigator("/phieu1");
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
        if (tinhKetLuanTamThoi(danhSachDong).tongSo === 0) {
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: "Vui lòng đánh giá ít nhất 1 tiêu chí (Đạt/Không đạt) trước khi gửi ký",
                    messageNotify: "",
                })
            );
            return;
        }
        try {
            await luuPhieu();
            await guiKyPhieu1(phieuId!).unwrap();
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

    const layThamSoXuatPhieu1 = () => {
        const ketLuan = tinhKetLuanTamThoi(danhSachDong);
        return {
            soHieu: phieu?.soHieu,
            ngayLap: phieu?.ngayTao,
            tenBepAn: bepAnId ? danhSachBepAn.find((b: BepAnModel) => b.id === bepAnId)?.ten ?? "" : "",
            tenNhaThau: nhaThauId ? tenNhaThau(nhaThauId) : "",
            ngayKiemTra: ngayKiemTra.format("DD/MM/YYYY"),
            nhomVaDong: nhomVaDong.map(({ nhom, soNhom, dong }) => ({
                soNhom,
                tenNhom: nhom.ten,
                dong: dong.map((item, idx) => ({
                    tt: `${soNhom}.${idx + 1}`,
                    noiDung: item.laDongTuThem ? (item.noiDungTuThem || "") : (item.tenTieuChiSnapshot ?? tenTieuChi(item.tieuChiId)),
                    ketQua: item.ketQua,
                    ghiChuHtml: item.ghiChu,
                })),
            })),
            dongKhongNhom: dongKhongNhom.map((item, idx) => ({
                tt: String(idx + 1),
                noiDung: item.laDongTuThem ? (item.noiDungTuThem || "") : (item.tenTieuChiSnapshot ?? tenTieuChi(item.tieuChiId)),
                ketQua: item.ketQua,
                ghiChuHtml: item.ghiChu,
            })),
            ketLuan: {
                soDat: ketLuan.soDat,
                tongSo: ketLuan.tongSo,
                tyLe: ketLuan.tyLe,
                ketLuan: ketLuan.ketLuan,
                diem: ketLuan.diem,
                ghiChuHtml: ketLuanGhiChu,
            },
            chuKy: tienDoKy.map(b => ({
                tenBuoc: b.tenBuoc,
                trangThai: b.trangThai,
                ghiChu: b.ghiChu,
                ngayKy: b.ngayKy,
                nguoiKyHoTen: b.nguoiKyHoTen,
                duongDanChuKy: b.duongDanChuKy,
            })),
        };
    };

    const xuLyXuatWord = async () => {
        setDangXuatWord(true);
        try {
            await xuatWordPhieu1(layThamSoXuatPhieu1());
        } catch (error: any) {
            dispatch(setNotify({ typeNotify: "error", titleNotify: "Xuất Word thất bại", messageNotify: "" }));
        } finally {
            setDangXuatWord(false);
        }
    };

    const ketLuanTamThoi = tinhKetLuanTamThoi(danhSachDong);
    const tenBepAnHienTai = bepAnId
        ? danhSachBepAn.find((b: BepAnModel) => b.id === bepAnId)?.ten
        : "........................";
    const tenNhaThauHienTai = nhaThauId
        ? tenNhaThau(nhaThauId)
        : "........................";

    // Helper render ô Ghi chú
    const renderOGhiChu = (item: DongChecklist, tieuChiTen?: string) => {
        const coHtml = chuaNoiDungHtml(item.ghiChu);

        if (coHtml) {
            return (
                <div className="ghi-chu-cell-wrapper">
                    <GhiChuHtml
                        className="ghi-chu-rich-preview ghi-chu-content"
                        html={item.ghiChu || ""}
                    />
                    {coTheSua && (
                        <Tooltip title="Chỉnh sửa ghi chú / ảnh minh chứng">
                            <Button
                                className="no-print ghi-chu-btn-edit"
                                size="small"
                                icon={<FaEdit />}
                                onClick={() => moModalGhiChuDong(item, tieuChiTen)}
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
                            placeholder="Ghi chú..."
                            value={item.ghiChu}
                            onChange={e =>
                                capNhatDong(item.thuTu, {
                                    ghiChu: e.target.value,
                                })
                            }
                        />
                    </div>
                    <Tooltip title="Chèn hình ảnh / Soạn chi tiết">
                        <Button
                            className="no-print ghi-chu-btn-edit"
                            size="small"
                            icon={<FaImage />}
                            onClick={() => moModalGhiChuDong(item, tieuChiTen)}
                        />
                    </Tooltip>
                </div>
            );
        }

        return <div className="ghi-chu-rich-preview">{item.ghiChu}</div>;
    };

    return (
        <LayoutV2Component>
            {/* 1. TOOLBAR CHUNG */}
            <PhieuToolbar
                title={
                    laTaoMoi
                        ? "Lập phiếu kiểm tra VSATTP"
                        : `Phiếu kiểm tra — ${phieu?.soHieu ?? ""}`
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
            <div className="no-print mb-4">
                <Card size="small">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <div className="mb-1 text-xs font-medium">Ngày kiểm tra</div>
                            <DatePicker
                                className="w-full"
                                size="small"
                                value={ngayKiemTra}
                                format="DD/MM/YYYY"
                                disabled={!coTheSua}
                                // Không cho lập phiếu với ngày kiểm tra trong tương lai —
                                // chỉ chọn được hôm nay hoặc trước đó.
                                disabledDate={(current) => !!current && current > dayjs().endOf("day")}
                                onChange={v => v && setNgayKiemTra(v)}
                            />
                        </div>

                        <div>
                            <div className="mb-1 text-xs font-medium">Bếp ăn</div>
                            <Select
                                className="w-full"
                                size="small"
                                placeholder="-- Chọn bếp ăn --"
                                showSearch
                                optionFilterProp="children"
                                disabled={!coTheSua}
                                value={bepAnId}
                                onChange={v => {
                                    setBepAnId(v);
                                    // Gợi ý nhà thầu theo bếp ăn nếu chưa chọn — chỉ là gợi ý
                                    // mặc định, người lập phiếu vẫn có thể đổi lại (bếp ăn có
                                    // thể đổi nhà thầu vận hành qua các đợt hợp đồng khác nhau).
                                    if (!nhaThauId) setNhaThauId(nhaThauCuaBepAn(v));
                                }}
                            >
                                {optionBepAn.map((b: BepAnModel) => (
                                    <Select.Option key={b.id} value={b.id}>
                                        {tenOptionDanhMuc(b)}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <div className="mb-1 text-xs font-medium">Nhà thầu</div>
                            <Select
                                className="w-full"
                                size="small"
                                placeholder="-- Chọn nhà thầu --"
                                showSearch
                                optionFilterProp="children"
                                disabled={!coTheSua}
                                value={nhaThauId}
                                onChange={v => setNhaThauId(v)}
                            >
                                {optionNhaThau.map((nt: NhaThauModel) => (
                                    <Select.Option key={nt.id} value={nt.id}>
                                        {tenOptionDanhMuc(nt)}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <div className="mb-1 text-xs font-medium">Phòng ban lập phiếu</div>
                            <Input
                                className="w-full"
                                size="small"
                                disabled
                                value={tenPhongBan(phongBanId) || "--"}
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* 3. TỜ PHIẾU IN A4 */}
            <div className="phieu-a4">
                {/* Header in */}
                <PhieuHeader
                    maPhieu="PHIEU1"
                    soHieu={phieu?.soHieu}
                    title="PHIẾU KIỂM TRA CÔNG TÁC VSATTP"
                    subtitle={`TẠI BẾP ĂN ${tenBepAnHienTai}`}
                    infoItems={[
                        { label: "Nhà thầu:", value: tenNhaThauHienTai },
                        {
                            label: "Ngày kiểm tra:",
                            value: ngayKiemTra.format("DD/MM/YYYY"),
                        },
                    ]}
                />

                {/* Bảng Checklist */}
                <div className="phieu-thuc-trang-title">1. Thực trạng đánh giá</div>
                <table className="phieu-table">
                    <thead>
                        <tr>
                            <th className="cot-tt">TT</th>
                            <th className="cot-noi-dung">Nội dung đánh giá</th>
                            <th className="cot-dat">Đạt</th>
                            <th className="cot-khong-dat">Không đạt</th>
                            <th className="cot-ghi-chu">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        {nhomVaDong.map(({ nhom, soNhom, dong }: { nhom: NhomTieuChiModel; soNhom: number; dong: DongChecklist[] }) => (
                            <React.Fragment key={nhom.id}>
                                <tr className="dong-nhom">
                                    <td colSpan={5}>
                                        {soNhom}. {nhom.ten}
                                    </td>
                                </tr>
                                {dong.map((item: DongChecklist, itemIndex: number) => {
                                    const tieuChiTen = item.tenTieuChiSnapshot ?? tenTieuChi(item.tieuChiId);
                                    return (
                                        <tr key={item.thuTu} className="dong-tieu-chi">
                                            <td className="o-tt">
                                                {soNhom}.{itemIndex + 1}
                                            </td>
                                            <td className="o-noi-dung">
                                                {item.laDongTuThem ? (
                                                    <Input
                                                        bordered={false}
                                                        className="input-table"
                                                        placeholder="Nội dung dòng tự thêm..."
                                                        disabled={!coTheSua}
                                                        value={item.noiDungTuThem}
                                                        onChange={e =>
                                                            capNhatDong(item.thuTu, {
                                                                noiDungTuThem:
                                                                    e.target.value,
                                                            })
                                                        }
                                                    />
                                                ) : (
                                                    tieuChiTen
                                                )}
                                            </td>
                                            <td
                                                className={`o-ket-qua ${item.ketQua === "DAT" ? "da-chon" : ""
                                                    }`}
                                                onClick={() => chonKetQua(item, "DAT")}
                                            >
                                                {item.ketQua === "DAT" && "✓"}
                                            </td>
                                            <td
                                                className={`o-ket-qua ${item.ketQua === "KHONG_DAT"
                                                    ? "da-chon"
                                                    : ""
                                                    }`}
                                                onClick={() =>
                                                    chonKetQua(item, "KHONG_DAT")
                                                }
                                            >
                                                {item.ketQua === "KHONG_DAT" && "✓"}
                                            </td>
                                            <td className="o-ghi-chu">
                                                {renderOGhiChu(item, tieuChiTen)}
                                                {item.laDongTuThem && coTheSua && (
                                                    <Button
                                                        className="no-print mt-1"
                                                        danger
                                                        size="small"
                                                        icon={<FaTrash />}
                                                        onClick={() =>
                                                            xoaDong(item.thuTu)
                                                        }
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {coTheSua && (
                                    <tr className="no-print">
                                        <td colSpan={5}>
                                            <div className="phieu-add-row">
                                                <Button
                                                    icon={<FaPlus />}
                                                    onClick={() =>
                                                        themDongTuDo(nhom.id)
                                                    }
                                                >
                                                    Thêm dòng
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}

                        {dongKhongNhom.length > 0 && (
                            <>
                                <tr className="dong-nhom">
                                    <td colSpan={5}>Các nội dung khác</td>
                                </tr>
                                {dongKhongNhom.map((item, index) => {
                                    const tieuChiTen = item.tenTieuChiSnapshot ?? tenTieuChi(item.tieuChiId);
                                    return (
                                        <tr key={item.thuTu}>
                                            <td className="o-tt">{index + 1}</td>
                                            <td className="o-noi-dung">
                                                {item.laDongTuThem ? (
                                                    <Input
                                                        bordered={false}
                                                        className="input-table"
                                                        disabled={!coTheSua}
                                                        value={item.noiDungTuThem}
                                                        onChange={e =>
                                                            capNhatDong(item.thuTu, {
                                                                noiDungTuThem:
                                                                    e.target.value,
                                                            })
                                                        }
                                                    />
                                                ) : (
                                                    tieuChiTen
                                                )}
                                            </td>
                                            <td
                                                className={`o-ket-qua ${item.ketQua === "DAT" ? "da-chon" : ""
                                                    }`}
                                                onClick={() => chonKetQua(item, "DAT")}
                                            >
                                                {item.ketQua === "DAT" && "✓"}
                                            </td>
                                            <td
                                                className={`o-ket-qua ${item.ketQua === "KHONG_DAT"
                                                    ? "da-chon"
                                                    : ""
                                                    }`}
                                                onClick={() =>
                                                    chonKetQua(item, "KHONG_DAT")
                                                }
                                            >
                                                {item.ketQua === "KHONG_DAT" && "✓"}
                                            </td>
                                            <td className="o-ghi-chu">
                                                {renderOGhiChu(item, tieuChiTen)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </>
                        )}
                    </tbody>
                </table>

                {/* Bảng Kết luận */}
                <div className="phieu-ket-luan">
                    <div className="phieu-ket-luan-title">2. Kết luận</div>
                    <table className="phieu-ket-luan-table">
                        <thead>
                            <tr>
                                <th className="kl-cot-tt">TT</th>
                                <th className="kl-cot-dat">
                                    Số lượng
                                    <br />
                                    tiêu chí đạt
                                </th>
                                <th className="kl-cot-tong">
                                    Tổng số
                                    <br />
                                    lượng tiêu
                                    <br />
                                    chí đánh giá
                                </th>
                                <th className="kl-cot-ty-le">
                                    Tỷ lệ % tiêu chí đạt
                                    <br />
                                    (Số lượng tiêu chí
                                    <br />
                                    đạt/Tổng số tiêu chí)
                                </th>
                                <th className="kl-cot-ket-luan">Kết luận</th>
                                <th className="kl-cot-diem">
                                    Điểm
                                    <br />
                                    đánh giá
                                </th>
                                <th className="kl-cot-ghi-chu">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="kl-center">1</td>
                                <td className="kl-center kl-value">
                                    {ketLuanTamThoi.soDat}
                                </td>
                                <td className="kl-center kl-value">
                                    {ketLuanTamThoi.tongSo}
                                </td>
                                <td className="kl-center kl-value">
                                    {ketLuanTamThoi.tyLe !== null
                                        ? ketLuanTamThoi.tyLe.toLocaleString("vi-VN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })
                                        : "--"}
                                </td>
                                <td className="kl-center kl-value">
                                    {ketLuanTamThoi.ketLuan === "DAT"
                                        ? "Đạt"
                                        : ketLuanTamThoi.ketLuan === "KHONG_DAT"
                                            ? "Không đạt"
                                            : "--"}
                                </td>
                                <td className="kl-center kl-value">
                                    {ketLuanTamThoi.diem !== null
                                        ? ketLuanTamThoi.diem.toLocaleString("vi-VN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })
                                        : "--"}
                                </td>
                                <td className="kl-ghi-chu">
                                    <div className="ghi-chu-cell-wrapper">
                                        {chuaNoiDungHtml(ketLuanGhiChu) ? (
                                            <GhiChuHtml
                                                className="ghi-chu-rich-preview ghi-chu-content"
                                                html={ketLuanGhiChu}
                                            />
                                        ) : (
                                            <span className="ghi-chu-content">{ketLuanGhiChu || "--"}</span>
                                        )}
                                        {coTheSua && (
                                            <Tooltip title="Soạn ghi chú Kết luận / chèn ảnh minh chứng">
                                                <Button
                                                    className="no-print ghi-chu-btn-edit"
                                                    size="small"
                                                    icon={<FaEdit />}
                                                    onClick={moModalKetLuan}
                                                />
                                            </Tooltip>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="phieu-quy-uoc">
                        <div className="quy-uoc-title">Quy ước:</div>
                        <div className="quy-uoc-item">
                            - Trường hợp tỷ lệ % tiêu chí đạt &lt;{" "}
                            <strong>50%</strong>, kết luận kết quả đánh giá{" "}
                            <strong>KHÔNG ĐẠT</strong>. Điểm đánh giá ={" "}
                            <strong>0</strong> điểm.
                        </div>
                        <div className="quy-uoc-item">
                            - Trường hợp tỷ lệ % tiêu chí đạt ≥ <strong>50%</strong>,
                            kết luận kết quả đánh giá <strong>ĐẠT</strong>. Điểm đánh
                            giá = Tỷ lệ % tiêu chí đạt *5.
                        </div>
                    </div>

                </div>

                {/* Khối Chữ ký — kiêm luôn chọn người ký / ký / từ chối (xem
                    huongdanquanlytaikhoan.md mục 5.2) */}
                <PhieuSignatures
                    loaiDoiTuong="PHIEU1"
                    doiTuongId={phieuId}
                    onDaDongBo={() => phieuId && dongBoTrangThaiPhieu1(phieuId)}
                />
            </div>

            {/* 4. THANH NÚT ACTION */}
            <PhieuActions
                coTheSua={coTheSua}
                laTaoMoi={laTaoMoi}
                trangThai={phieu?.trangThai}
                dangLuu={dangThem || dangSua}
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
                onCancel={() =>
                    setModalGhiChu(prev => ({ ...prev, open: false }))
                }
            />
        </LayoutV2Component>
    );
};

export default Phieu1FormPage;