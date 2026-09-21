import React from "react";
import {
    FaBuilding,
    FaChartBar,
    FaChartLine,
    FaClipboardCheck,
    FaFire,
    FaHandshake,
    FaHistory,
    FaLayerGroup,
    FaListUl,
    FaMapMarkerAlt,
    FaSignature,
    FaTable,
    FaUserTag,
    FaUsersCog,
    FaUtensils,
} from "react-icons/fa";
import NguoiDungModel from "../models/NguoiDungModel";
import { coQuyen, MA_QUYEN, MaQuyen } from "../utils/quyenV2";

// Nguồn dữ liệu menu DUY NHẤT dùng chung cho cả lưới module ở TrangChuV2Page
// và sidebar ở LayoutV2Component — tránh 2 nơi định nghĩa lệch nhau.
export interface MucMenu {
    title: string;
    description: string;
    to: string;
    icon: React.ReactNode;
    // undefined = mọi tài khoản nội bộ đã đăng nhập đều thấy. Có giá trị =
    // chỉ hiện khi tài khoản có đúng mã quyền này (hoặc laAdmin).
    maQuyen?: MaQuyen;
    // Chỉ set cho 4 mục Phiếu đánh giá — mục chỉ hiện khi tài khoản THỰC SỰ
    // được cấp quyền cho đúng loại phiếu này (Đánh giá/nhập liệu hoặc có bước
    // ký được gán, xem NguoiDungService.DanhSachLoaiPhieuDuocXemAsync ở
    // backend) — không còn hiện mặc định cho mọi tài khoản nội bộ nữa.
    loaiPhieu?: string;
    // Module kế thừa từ hệ v1 cũ (Lịch sử khảo sát, Dashboard) — không khớp
    // mã quyền nào trong 6 mã hiện có, backend cũng chưa có policy riêng cho
    // 2 module này. Tạm thời chỉ Quản trị viên (laAdmin) thấy, giống hệt hành
    // vi cũ (chỉ tài khoản admin truy cập được).
    chiAdmin?: boolean;
}

export interface NhomMenu {
    tieuDe: string;
    items: MucMenu[];
}

// Nhóm màn hình theo nghiệp vụ để dễ tìm: (1) 4 loại phiếu là nghiệp vụ
// chính hàng ngày, (2) tiêu chí/nhóm tiêu chí + luồng ký là cấu hình đứng
// sau checklist của các phiếu, (3) phần còn lại là danh mục dùng chung/quản
// trị hệ thống.
export const NHOM_MENU: NhomMenu[] = [
    {
        tieuDe: "Phiếu đánh giá",
        items: [
            { title: "BM.01 — Kiểm tra VSATTP", description: "Lập & quản lý phiếu kiểm tra VSATTP tại bếp ăn", to: "/phieu1", icon: <FaClipboardCheck />, loaiPhieu: "PHIEU1" },
            { title: "BM.02 — Đánh giá suất ăn", description: "Lập & quản lý phiếu đánh giá chất lượng dịch vụ suất ăn", to: "/phieu2", icon: <FaUtensils />, loaiPhieu: "PHIEU2" },
            { title: "BM.08 — Báo cáo tháng", description: "Lập & quản lý báo cáo chất lượng dịch vụ theo tháng", to: "/phieu3", icon: <FaChartBar />, loaiPhieu: "PHIEU3" },
            { title: "BM.09 — Tổng hợp & phân bổ", description: "Bảng tổng hợp đánh giá & phân bổ suất ăn", to: "/phieu4", icon: <FaTable />, loaiPhieu: "PHIEU4" },
        ],
    },
    {
        tieuDe: "Báo cáo & lịch sử",
        items: [
            { title: "Lịch sử khảo sát", description: "Tra cứu/export lịch sử khảo sát chấm điểm bữa ăn", to: "/v2/lich-su-khao-sat", icon: <FaHistory />, chiAdmin: true },
            { title: "Dashboard", description: "Báo cáo tổng hợp Power BI", to: "/v2/dashboard", icon: <FaChartLine />, chiAdmin: true },
        ],
    },
    {
        tieuDe: "Tiêu chí & cấu hình đánh giá",
        items: [
            { title: "Nhóm tiêu chí", description: "Quản lý nhóm/mục nội dung checklist", to: "/nhom-tieu-chi", icon: <FaLayerGroup />, maQuyen: MA_QUYEN.QUAN_LY_TIEU_CHI },
            { title: "Tiêu chí đánh giá", description: "Quản lý tiêu chí (checklist) trong từng nhóm", to: "/tieu-chi", icon: <FaListUl />, maQuyen: MA_QUYEN.QUAN_LY_TIEU_CHI },
            { title: "Luồng ký", description: "Cấu hình luồng trình ký theo từng loại phiếu", to: "/mau-luong-ky", icon: <FaSignature />, maQuyen: MA_QUYEN.QUAN_LY_LUONG_KY },
        ],
    },
    {
        tieuDe: "Danh mục & hệ thống",
        items: [
            { title: "Bếp ăn", description: "Danh mục bếp ăn, gắn nhà thầu vận hành", to: "/v2/bep-an", icon: <FaFire />, maQuyen: MA_QUYEN.QUAN_LY_DANH_MUC },
            { title: "Địa điểm nhà ăn", description: "Danh mục địa điểm/nhà ăn để chọn khi lập phiếu", to: "/v2/dia-diem-nha-an", icon: <FaMapMarkerAlt />, maQuyen: MA_QUYEN.QUAN_LY_DANH_MUC },
            { title: "Nhà thầu", description: "Danh mục nhà thầu cung cấp dịch vụ suất ăn", to: "/v2/nha-thau", icon: <FaHandshake />, maQuyen: MA_QUYEN.QUAN_LY_DANH_MUC },
            { title: "Vai trò", description: "Danh mục vai trò người dùng trong hệ thống", to: "/v2/vai-tro", icon: <FaUserTag />, maQuyen: MA_QUYEN.QUAN_LY_VAI_TRO },
            { title: "Phòng ban", description: "Danh mục phòng ban (P.ĐN, P.ATMT...)", to: "/v2/phong-ban", icon: <FaBuilding />, maQuyen: MA_QUYEN.QUAN_LY_PHONG_BAN },
            { title: "Quản lý tài khoản", description: "Duyệt / khóa / gán vai trò cho người dùng", to: "/v2/quan-ly-tai-khoan", icon: <FaUsersCog />, maQuyen: MA_QUYEN.QUAN_LY_TAI_KHOAN },
        ],
    },
];

// Lọc NHOM_MENU theo đúng tài khoản đang đăng nhập — dùng chung bởi lưới
// module (TrangChuV2Page) và sidebar (LayoutV2Component) để 2 nơi luôn khớp
// nhau tuyệt đối (không có module nào hiện ở nơi này mà ẩn ở nơi kia).
//
// danhSachLoaiPhieuDuocXem: lấy từ GET /api/profile (useLayHoSoQuery, xem
// profileApiV2.ts) — KHÔNG phải "loại tài khoản nội bộ/nhà thầu" như trước
// đây, mà là quyền THẬT của CHÍNH tài khoản đó (Đánh giá/nhập liệu hoặc có
// bước ký được gán, xem NguoiDungService.DanhSachLoaiPhieuDuocXemAsync).
// Truyền [] (mặc định) trong lúc đang tải hồ sơ — tạm ẩn nhóm "Phiếu đánh
// giá" 1 nhịp, không hiện sai rồi phải ẩn lại.
export const layNhomMenuHienThi = (
    nguoiDung: NguoiDungModel | null | undefined,
    danhSachLoaiPhieuDuocXem: string[] = []
): NhomMenu[] => {
    return NHOM_MENU
        .map(nhom => ({
            ...nhom,
            items: nhom.items.filter(muc =>
                (!muc.maQuyen || coQuyen(nguoiDung, muc.maQuyen)) &&
                (!muc.chiAdmin || nguoiDung?.laAdmin) &&
                (!muc.loaiPhieu || nguoiDung?.laAdmin || danhSachLoaiPhieuDuocXem.includes(muc.loaiPhieu))
            ),
        }))
        .filter(nhom => nhom.items.length > 0);
};
