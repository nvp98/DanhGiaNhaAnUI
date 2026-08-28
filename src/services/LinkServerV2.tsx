// Module 2 (đánh giá nhà ăn - 4 phiếu) trỏ về DanhGiaAPI mới (khác API cũ ở acctions/LinkServer.tsx).
// Đổi VITE_BASE_API trong .env khi deploy lên môi trường thật (Vite chỉ expose
// biến môi trường có tiền tố "VITE_" ra code phía client).
// PHẢI dùng cổng https (7141), KHÔNG dùng http (5056): BE có UseHttpsRedirection()
// nên gọi cổng http sẽ bị BE redirect 307 sang https — fetch tự bỏ header
// Authorization khi follow redirect sang origin khác (đổi cổng = đổi origin),
// khiến mọi request có token đều thành "chưa xác thực" (401) dù đăng nhập vẫn
// đúng (POST đăng nhập không có header Authorization nên "vô tình" chạy qua
// redirect trót lọt). Nếu trình duyệt báo ERR_CERT_AUTHORITY_INVALID, chạy
// `dotnet dev-certs https --trust` để trust chứng chỉ dev của ASP.NET Core.
const LinkServerV2 = import.meta.env.VITE_BASE_API || "https://localhost:7141/api";

// Gốc domain (không có "/api") — dùng để dựng URL file tĩnh (vd ảnh chữ ký ở /uploads/...).
export const ApiRootV2 = LinkServerV2.replace(/\/api\/?$/, "");

export default LinkServerV2;
