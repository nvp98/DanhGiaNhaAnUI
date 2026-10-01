import { useEffect, useRef, useState } from "react";
import { NavigateFunction, useLocation, useNavigationType } from "react-router-dom";

// Giữ state (form tìm kiếm, trang đang xem...) của 1 trang danh sách khi
// người dùng mở 1 phiếu rồi QUAY LẠI ngay (nút "Quay lại" của layout hoặc nút
// Back trình duyệt) — DS -> phiếu -> quay lại. Đi xa hơn (DS -> phiếu -> trang
// khác -> quay lại 2 lần), vào lại từ menu, hay F5 thì reset như bình thường.
//
// Lưu trong bộ nhớ JS (KHÔNG localStorage/sessionStorage/redux-persist) nên
// F5/đóng tab tự mất — đúng yêu cầu "F5 thì reset".

// Số lần đổi route (location.key) từ lúc mở app — tăng ở useTheoDoiChuyenTrang
// (gắn 1 lần ở App). Lưu ý thứ tự trong cùng 1 lần commit của React: cleanup
// unmount của trang cũ chạy TRƯỚC effect tăng bộ đếm, còn trang mới render
// TRƯỚC effect đó — xem điều kiện `moc + 1` bên dưới.
let soLanChuyenTrang = 0;
let loaiChuyenTrangCuoi: string | undefined;

interface GiaTriDaLuu {
    giaTri: unknown;
    moc: number; // soLanChuyenTrang lúc rời trang
}

const boNho = new Map<string, GiaTriDaLuu>();
const mocRoiTrang = new Map<string, number>();

// Gắn 1 lần duy nhất ở App (bên trong <BrowserRouter>).
export const useTheoDoiChuyenTrang = () => {
    const location = useLocation();
    const loai = useNavigationType();
    useEffect(() => {
        soLanChuyenTrang++;
        loaiChuyenTrangCuoi = loai;
    }, [location.key, loai]);
};

// true nếu trang hiện tại là trang KẾ TIẾP được mở thẳng (PUSH) từ trang
// danh sách `trang` — tức history ngay phía sau đúng là trang danh sách đó.
export const vuaRoiTrang = (trang: string): boolean =>
    loaiChuyenTrangCuoi === "PUSH" && mocRoiTrang.get(trang) === soLanChuyenTrang - 1;

// Về trang danh sách sau khi xóa phiếu: nếu phiếu được mở thẳng từ danh sách
// thì lùi lịch sử (POP) để danh sách khôi phục form tìm kiếm; ngược lại (vào
// phiếu từ link khác, F5 ở trang phiếu...) thì mở mới danh sách như cũ.
export const quayVeDanhSach = (navigate: NavigateFunction, trang: string, duongDan: string) => {
    if (vuaRoiTrang(trang)) navigate(-1);
    else navigate(duongDan);
};

// Dùng thay useState cho các state cần giữ. `trang` = tên trang danh sách
// (VD "phieu1", cũng là khóa của vuaRoiTrang/quayVeDanhSach), `ten` = tên
// state trong trang đó.
export const useGiuKhiQuayLai = <T>(trang: string, ten: string, macDinh: T | (() => T)) => {
    const khoa = `${trang}:${ten}`;
    const loai = useNavigationType();

    const [giaTri, setGiaTri] = useState<T>(() => {
        const daLuu = boNho.get(khoa);
        // Quay lại (POP) và chỉ mới đi đúng 1 bước kể từ lúc rời trang (bộ
        // đếm đã tăng 1 cho trang phiếu, chưa tăng cho lần quay lại này).
        if (daLuu && loai === "POP" && daLuu.moc + 1 === soLanChuyenTrang) return daLuu.giaTri as T;
        return typeof macDinh === "function" ? (macDinh as () => T)() : macDinh;
    });

    const giaTriMoiNhat = useRef(giaTri);
    useEffect(() => {
        giaTriMoiNhat.current = giaTri;
    }, [giaTri]);

    // Chụp lại giá trị lúc rời trang.
    useEffect(
        () => () => {
            boNho.set(khoa, { giaTri: giaTriMoiNhat.current, moc: soLanChuyenTrang });
            mocRoiTrang.set(trang, soLanChuyenTrang);
        },
        [khoa, trang]
    );

    return [giaTri, setGiaTri] as const;
};
