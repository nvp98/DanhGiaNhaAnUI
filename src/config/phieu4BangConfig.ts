import { BangCoDinhConfig } from "../components/phieu";

// Cấu hình dòng/cột cố định (hard-code) cho Bảng 1/2 của Phiếu 4 — tách
// riêng khỏi Phieu4FormPage.tsx để dùng CHUNG được cho cả màn hình
// (Phieu4FormPage.tsx render qua BangCoDinhTable) lẫn xuất Word
// (utils/xuatWordPhieu4.ts render qua docx Table), tránh lệch cấu trúc dòng
// giữa 2 nơi và tránh import vòng (page <-> util).

// Nhãn hiển thị cho 4 nhóm cố định của Bảng 1 — khớp mẫu báo cáo giấy (khác
// NoiDung ngắn gọn lưu ở DB, thay đổi thuần hiển thị, không đụng dữ liệu/logic
// tính toán vốn tra theo NhomSo/Stt).
const NHAN_NHOM_BANG1: Record<number, string> = {
    1: "Tổng số lượng suất ăn tại chỗ cấp phát tại các điểm đánh giá",
    2: "Số lượt CBNV tham gia đánh giá",
    3: "Điểm đánh giá trung bình của CBNV theo lượt đánh giá",
    4: "Tỷ lệ CBNV tham gia phản hồi (II/I)",
};
const NHAN_MUC_BANG1: Record<number, string> = {
    1: "1-Rất không hài lòng",
    2: "2-Không hài lòng",
    3: "3-Bình thường",
    4: "4-Hài lòng",
    5: "5-Rất hài lòng",
};

// Bảng 2 — 2 nhóm dòng cố định (NhomSo 1=P.ĐN, 2=P.ATMT), 6 tiêu chí mỗi
// nhóm — CỐ ĐỊNH giống hệt Bảng 2 của Phiếu 3 (khác chiều: cột ở đây là
// nhà thầu, không phải tiêu chí), xem Phieu4Service.KhoiTaoBang2CoDinhAsync.
// Key PHẢI khớp đúng NhomSo thật ở backend (1=P.ĐN, 2=P.ATMT, xem
// Phieu4Service.TinhLaiBang2Async) — muốn đổi thứ tự HIỂN THỊ thì đổi
// "soLaMa" trong PHIEU4_BANG2_CONFIG bên dưới, không đổi key ở đây.
const NHAN_NHOM_BANG2: Record<number, string> = {
    1: "Đánh giá từ P.ĐN",
    2: "Đánh giá từ P.ATMT",
    3: "Điểm đánh giá trung bình của phòng ban theo trọng số (*)",
};

// Config dạng ma trận dòng/cột cho Bảng 1 (thay viết JSX tay) — mỗi dòng
// khớp đúng 1 (NhomSo, Stt) thật trong DB (xem Phieu4Service.KhoiTaoBang1Async).
export const PHIEU4_BANG1_CONFIG: BangCoDinhConfig = {
    key: "phieu4_bang1",
    nhom: [
        { nhomSo: 1, soLaMa: "I", nhanNhom: NHAN_NHOM_BANG1[1], dongCha: { stt: 1 }, dong: [] },
        {
            nhomSo: 2, soLaMa: "II", nhanNhom: NHAN_NHOM_BANG1[2], coDongTongTrenHeader: true,
            dong: [1, 2, 3, 4, 5].map(muc => ({ nhomSo: 2, stt: muc, label: NHAN_MUC_BANG1[muc] })),
        },
        { nhomSo: 3, soLaMa: "III", nhanNhom: NHAN_NHOM_BANG1[3], dongCha: { stt: 1 }, dong: [] },
        { nhomSo: 4, soLaMa: "IV", nhanNhom: NHAN_NHOM_BANG1[4], dongCha: { stt: 1 }, dong: [] },
    ],
};

// Config Bảng 2 — Stt liên tục toàn bảng, KHÔNG lặp lại giữa các nhóm (xem
// Phieu4Service.TieuChiBang2 + DongBoBang2CoDinhAsync):
//   nhomSo=1 (P.ĐN)   -> Stt 1-6  (đủ 6 tiêu chí, có tiêu chí con)
//   nhomSo=2 (P.ATMT) -> Stt 7    (chỉ 1 tiêu chí VSATTP — vẫn tách thành 1
//                                  dòng con "option 0" của TEN_TIEU_CHI_BANG2,
//                                  không dùng dongCha, để đồng nhất layout
//                                  header + dòng con với nhóm P.ĐN)
//   nhomSo=3           -> Stt 13  ("Điểm đánh giá trung bình... theo trọng
//                                  số", nhập tay hoàn toàn -> dongCha)
// Thứ tự hiển thị (soLaMa) theo yêu cầu: P.ATMT (I) -> P.ĐN (II) -> trọng số (III).
const TEN_TIEU_CHI_BANG2 = [
    "Tuân thủ đúng quy định về vệ sinh an toàn thực phẩm",
    "Tuân thủ định lượng theo thực đơn đã được phê duyệt",
    "Đa dạng thực đơn",
    "Tuân thủ hợp đồng, bản cam kết, quy trình báo cáo",
    "Thái độ phối hợp, cầu thị cải tiến",
    "Phản hồi sự cố, xử lý khiếu nại nhanh chóng",
];
export const PHIEU4_BANG2_CONFIG: BangCoDinhConfig = {
    key: "phieu4_bang2",
    nhom: [
        {
            nhomSo: 1, soLaMa: "I", nhanNhom: NHAN_NHOM_BANG2[2],
            dong: [{ nhomSo: 2, stt: 7, label: TEN_TIEU_CHI_BANG2[0] }],
        },
        {
            nhomSo: 2, soLaMa: "II", nhanNhom: NHAN_NHOM_BANG2[1],
            dong: TEN_TIEU_CHI_BANG2.map((label, i) => ({ nhomSo: 1, stt: i + 1, label })),
        },
        {
            nhomSo: 3, soLaMa: "III", nhanNhom: NHAN_NHOM_BANG2[3],
            dongCha: { stt: 13 }, dong: [],
        },
    ],
};
