import { ApiRootV2 } from "../services/LinkServerV2";

// Tải + THU NHỎ ảnh để nhúng vào file Word (dùng chung cho xuatWordPhieu1.ts
// và xuatWordPhieu2.ts). docx nhúng nguyên byte của ảnh, transformation chỉ
// đổi kích thước HIỂN THỊ — nếu nhúng ảnh gốc chụp điện thoại (3–5MB/ảnh)
// thì file Word phình to vài chục MB và Packer.toBlob (nén DEFLATE bằng JS
// trên main thread) chạy rất lâu, đơ UI. Vì vậy mỗi ảnh được vẽ lại qua
// canvas về đúng kích thước hiển thị × HE_SO_NET (đủ nét khi in) trước khi
// nhúng, thường chỉ còn vài chục–vài trăm KB.

export interface AnhDaTai {
    data: ArrayBuffer;
    type: "png" | "jpg";
    // Kích thước HIỂN THỊ trong Word (px) — ảnh thật bên trong lớn hơn
    // HE_SO_NET lần (nếu ảnh gốc đủ lớn) để in không bị vỡ.
    rong: number;
    cao: number;
}

// Ảnh nhúng có độ phân giải gấp 2 kích thước hiển thị (~190 DPI) — in vẫn
// nét mà dung lượng nhỏ.
const HE_SO_NET = 2;
const CHAT_LUONG_JPG = 0.85;

// Giới hạn số ảnh GIẢI MÃ + vẽ lại cùng lúc: ảnh 12MP giải mã ra bitmap
// ~48MB RAM, 10 ảnh cùng lúc dễ làm tab trình duyệt hết bộ nhớ. Bước tải
// (fetch) vẫn chạy song song không giới hạn.
const SO_ANH_XU_LY_DONG_THOI = 3;
let soDangXuLy = 0;
const hangDoi: (() => void)[] = [];

const chayCoGioiHan = async <T>(viec: () => Promise<T>): Promise<T> => {
    if (soDangXuLy < SO_ANH_XU_LY_DONG_THOI) soDangXuLy++;
    else await new Promise<void>(resolve => hangDoi.push(resolve)); // nhận lại suất của việc vừa xong
    try {
        return await viec();
    } finally {
        const tiepTheo = hangDoi.shift();
        if (tiepTheo) tiepTheo();
        else soDangXuLy--;
    }
};

const canvasSangBlob = (canvas: HTMLCanvasElement, mime: string): Promise<Blob> =>
    new Promise((resolve, reject) =>
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error("Không mã hóa được ảnh"))), mime, CHAT_LUONG_JPG)
    );

// Vẽ lại ảnh: kích thước hiển thị giữ tỉ lệ trong khung rongToiDa × caoToiDa
// (chỉ thu nhỏ, không phóng to); ảnh thật = hiển thị × HE_SO_NET, tối đa
// bằng ảnh gốc. JPG luôn tô nền trắng trước để ảnh PNG trong suốt không bị
// nền đen.
const veLaiAnh = async (blob: Blob, rongToiDa: number, caoToiDa: number, type: AnhDaTai["type"]): Promise<AnhDaTai> => {
    const bitmap = await createImageBitmap(blob);
    try {
        const tiLeHienThi = Math.min(caoToiDa / bitmap.height, rongToiDa / bitmap.width, 1);
        const tiLeAnhThat = Math.min(tiLeHienThi * HE_SO_NET, 1);

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * tiLeAnhThat));
        canvas.height = Math.max(1, Math.round(bitmap.height * tiLeAnhThat));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Trình duyệt không hỗ trợ canvas 2D");
        if (type === "jpg") {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        const ketQua = await canvasSangBlob(canvas, type === "jpg" ? "image/jpeg" : "image/png");
        return {
            data: await ketQua.arrayBuffer(),
            type,
            rong: Math.max(1, Math.round(bitmap.width * tiLeHienThi)),
            cao: Math.max(1, Math.round(bitmap.height * tiLeHienThi)),
        };
    } finally {
        bitmap.close();
    }
};

// null khi tải/giải mã lỗi (file bị xóa khỏi server, mạng chập chờn...) —
// nơi gọi tự fallback (chữ ký -> tick √, ảnh minh chứng -> bỏ qua ảnh đó)
// chứ không chặn cả việc xuất Word vì 1 ảnh lỗi.
const taiAnhTheoUrl = async (
    url: string,
    rongToiDa: number,
    caoToiDa: number,
    type: AnhDaTai["type"]
): Promise<AnhDaTai | null> => {
    try {
        // cache: "no-store" — tránh trường hợp trình duyệt tái dùng response
        // đã cache từ 1 lần tải ảnh trước đó qua thẻ <img> (request "no-cors",
        // không cần header CORS); fetch() ("cors") dùng lại cache đó sẽ luôn bị
        // chặn vì thiếu Access-Control-Allow-Origin dù server đã bật CORS.
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        return await chayCoGioiHan(() => veLaiAnh(blob, rongToiDa, caoToiDa, type));
    } catch (err) {
        // Lỗi thường gặp: ảnh cũ bị đóng băng domain sai trong HTML đã lưu
        // (host nội bộ/thiếu prefix reverse-proxy — xem
        // migration_fix_duong_dan_anh_ckeditor.sql), ảnh đã bị xóa khỏi
        // server, hoặc mạng chập chờn. Log ra để dev/BA tra được vì sao 1 ảnh
        // cụ thể không lên được Word thay vì biến mất trong im lặng.
        console.warn(`[anhWord] Không tải được ảnh, bỏ qua: ${url}`, err);
        return null;
    }
};

// Khớp .chu-ky-anh { max-height: 70px } trên màn hình, kèm chặn rộng tối đa
// để chữ ký ngang quá khổ không đè sang cột bên cạnh. Giữ PNG để không mất
// nền trong suốt của chữ ký.
const ANH_KY_CAO_TOI_DA = 70;
const ANH_KY_RONG_TOI_DA = 150;

export const layAnhChuKy = (duongDanChuKy?: string): Promise<AnhDaTai | null> =>
    !duongDanChuKy
        ? Promise.resolve(null)
        : taiAnhTheoUrl(`${ApiRootV2}${duongDanChuKy}`, ANH_KY_RONG_TOI_DA, ANH_KY_CAO_TOI_DA, "png");

// Ảnh minh chứng dán trong ghi chú (TinyMCE) — chụp hiện trường nên thường
// rất lớn. Thu nhỏ về khung ẢNH LẺ (khung lớn nhất khi xếp vào bảng ảnh);
// ảnh đi cặp được coGianAnh ở nơi gọi thu tiếp kích thước hiển thị, dữ liệu
// ảnh vẫn dư nét. Luôn xuất JPG — ảnh chụp, không cần trong suốt.
// src trong HTML ghi chú đã là URL TUYỆT ĐỐI (ghép sẵn ApiRootV2 lúc upload —
// xem TinyMceModal.tsx/TinyMceInline.tsx), khác với duongDanChuKy (tương đối)
// nên không ghép thêm ApiRootV2.
export const ANH_MINH_CHUNG_CAO_TOI_DA = 500;
export const ANH_MINH_CHUNG_RONG_TOI_DA = 500;

export const layAnhMinhChung = (url: string): Promise<AnhDaTai | null> =>
    taiAnhTheoUrl(url, ANH_MINH_CHUNG_RONG_TOI_DA, ANH_MINH_CHUNG_CAO_TOI_DA, "jpg");

// Bảng ảnh minh chứng xếp tối đa 2 ảnh/hàng: ảnh đi cặp bị chặn nhỏ (~1/2
// khổ trang, chặn cả chiều cao để 2 ảnh cùng hàng không lệch nhau quá), ảnh
// LẺ cuối cùng nằm riêng 1 hàng nên giữ khung lớn ANH_MINH_CHUNG_* ở trên.
export const ANH_MINH_CHUNG_CAP_CAO_TOI_DA = 220;
export const ANH_MINH_CHUNG_CAP_RONG_TOI_DA = 280;

// Đổi kích thước HIỂN THỊ giữ tỉ lệ (dữ liệu ảnh giữ nguyên). Chỉ thu nhỏ,
// KHÔNG phóng to ảnh nhỏ. Generic để dùng được cả cho ảnh đã đổi sang data
// URL của bản PDF (xem pdf/pdfChung.ts).
export const coGianAnh = <T extends { rong: number; cao: number }>(anh: T, caoToiDa: number, rongToiDa: number): T => {
    const tiLe = Math.min(caoToiDa / anh.cao, rongToiDa / anh.rong, 1);
    return { ...anh, cao: Math.round(anh.cao * tiLe), rong: Math.round(anh.rong * tiLe) };
};
