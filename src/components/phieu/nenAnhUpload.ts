// Ảnh chụp thẳng từ camera điện thoại thường nặng hơn nhiều so với ảnh chụp
// màn hình (độ phân giải cảm biến cao, có thể 8-15MB) — trước khi upload vào
// CKEditor/TinyMCE (TinyMceModal.tsx, TinyMceInline.tsx), nén lại (giảm chất
// lượng JPEG) để giảm dung lượng, tránh vượt giới hạn server (xem
// DungLuongToiDa ở TepDinhKemService.cs) hoặc bị nginx cắt kết nối giữa chừng
// (FE thấy "Lỗi mạng" thay vì thông báo lỗi rõ ràng từ server).
//
// CHỦ ĐÍCH GIỮ NGUYÊN ĐỘ PHÂN GIẢI GỐC — không resize/scale kích thước ảnh vì
// đây là ảnh chụp hiện trường, cần giữ chi tiết đầy đủ để làm minh chứng. Chỉ
// giảm chất lượng nén (thử dần các mức, dừng ngay khi đủ nhẹ) để không nén quá
// tay so với mức cần thiết.
// Mục tiêu hiện tại là 1MB — khớp với client_max_body_size mặc định của
// nginx (chưa chỉnh ở server) để tránh bị cắt kết nối giữa chừng. Cần nhiều
// mức chất lượng thấp hơn (so với hồi mục tiêu còn 4MB) để đủ sức ép ảnh
// camera gốc (8-15MB) xuống dưới ngưỡng này.
const CAC_MUC_CHAT_LUONG_THU_NEN = [0.8, 0.65, 0.5, 0.35, 0.25, 0.15];
// Mục tiêu dung lượng sau nén — đạt được là dừng lại luôn, ưu tiên giữ chất
// lượng cao nhất có thể thay vì nén tối đa.
const NGUONG_MUC_TIEU = 1 * 1024 * 1024; // 1MB
// Ảnh đã nhỏ hơn ngưỡng này thì giữ nguyên, khỏi tốn công nén (screenshot,
// icon nhỏ...) — đặt thấp hơn NGUONG_MUC_TIEU một chút để ảnh xêm xêm 1MB
// cũng được thử nén thay vì lọt qua nguyên trạng.
const NGUONG_BO_QUA = 900 * 1024; // 900KB

export interface KetQuaNenAnh {
    blob: Blob;
    tenFile: string;
    // true khi thực sự đã thay ảnh gốc bằng bản nén nhẹ hơn — dùng để quyết
    // định có cần báo cho người dùng biết hay không (xem imagesUploadHandler
    // ở TinyMceModal.tsx/TinyMceInline.tsx).
    daNen: boolean;
    kichThuocGoc: number;
    kichThuocSauNen: number;
}

export async function nenAnhTruocKhiUpload(blob: Blob, tenFileGoc: string): Promise<KetQuaNenAnh> {
    const kichThuocGoc = blob.size;
    const khongDoi: KetQuaNenAnh = {
        blob,
        tenFile: tenFileGoc,
        daNen: false,
        kichThuocGoc,
        kichThuocSauNen: kichThuocGoc,
    };

    if (!blob.type.startsWith("image/") || blob.size <= NGUONG_BO_QUA) {
        return khongDoi;
    }

    try {
        const anhGoc = await taiAnhTuBlob(blob);

        const canvas = document.createElement("canvas");
        canvas.width = anhGoc.width;
        canvas.height = anhGoc.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return khongDoi;
        ctx.drawImage(anhGoc, 0, 0);

        let blobNenTotNhat: Blob | null = null;
        for (const chatLuong of CAC_MUC_CHAT_LUONG_THU_NEN) {
            const ketQua = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, "image/jpeg", chatLuong)
            );
            if (ketQua && ketQua.size < blob.size) {
                blobNenTotNhat = ketQua;
                if (ketQua.size <= NGUONG_MUC_TIEU) break;
            }
        }

        if (blobNenTotNhat) {
            const tenMoi = tenFileGoc.replace(/\.[^.]+$/, "") + ".jpg";
            return {
                blob: blobNenTotNhat,
                tenFile: tenMoi,
                daNen: true,
                kichThuocGoc,
                kichThuocSauNen: blobNenTotNhat.size,
            };
        }
        return khongDoi;
    } catch {
        // Nén lỗi (VD trình duyệt không hỗ trợ canvas/Image) thì vẫn upload
        // ảnh gốc, không chặn thao tác của người dùng.
        return khongDoi;
    }
}

export function dinhDangDungLuong(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function taiAnhTuBlob(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(e);
        };
        img.src = url;
    });
}
