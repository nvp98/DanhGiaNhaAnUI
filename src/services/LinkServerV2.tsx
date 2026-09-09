// Module 2 (đánh giá nhà ăn - 4 phiếu) trỏ về DanhGiaAPI mới (khác API cũ ở acctions/LinkServer.tsx).
// Đổi VITE_BASE_API trong .env khi deploy lên môi trường thật (Vite chỉ expose
// biến môi trường có tiền tố "VITE_" ra code phía client).
// Dùng http (cổng 5056) — BE đã bỏ UseHttpsRedirection() nên không còn bị
// redirect sang https (7141) nữa (redirect trước đây tự bỏ header
// Authorization khi trình duyệt follow sang origin khác, gây 401 khó hiểu —
// xem modules/DangNhap.md). Nếu sau này đổi lại dùng https, nhớ trust dev-cert
// bằng `dotnet dev-certs https --trust` trước.
const LinkServerV2 = import.meta.env.VITE_BASE_API || "http://localhost:5056/api";

// Gốc domain (không có "/api") — dùng để dựng URL file tĩnh (vd ảnh chữ ký ở /uploads/...).
export const ApiRootV2 = LinkServerV2.replace(/\/api\/?$/, "");

export default LinkServerV2;
