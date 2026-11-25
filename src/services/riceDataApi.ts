import { apiSliceV2 } from './apiSliceV2';

// Body cho POST /RiceData/SyncDataTheoBoLoc — nút "Đồng bộ dữ liệu cơm" ở
// DashboardPageV2, gọi tay theo Ngày/Địa điểm/Bữa ăn chọn riêng cho nút này
// (không dùng Tháng/Tuần của form search — 2 ô đó chỉ suy ra "Ngày", không
// phải điều kiện lọc độc lập). BE giới hạn (denNgay - tuNgay) tối đa 5 ngày.
// Action riêng, KHÔNG dùng chung /RiceData/SyncData gốc vì đã có tool ngoài
// đang gọi endpoint đó theo hợp đồng cũ (xem RiceDataController.SyncData).
export interface SyncDataRiceParams {
    tuNgay: string;
    denNgay: string;
    diaDiemIds?: number[];
    codeBuaAnList?: string[];
}

// Khớp RiceDataSyncResultDto ở BE — action chạy hết mọi tổ hợp (ngày x địa
// điểm x bữa ăn) rồi mới trả kết quả, không bỏ ngang khi 1 tổ hợp lỗi (khác
// SyncData gốc), nên luôn biết rõ bao nhiêu thành công/lỗi dù có lỗi giữa
// đường.
export interface SyncDataRiceResult {
    soToHopThanhCong: number;
    soToHopLoi: number;
    thongBaoLoi: string[];
}

export const riceDataApi = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        syncDataRice: builder.mutation<SyncDataRiceResult, SyncDataRiceParams>({
            query: (body) => ({ url: '/RiceData/SyncDataTheoBoLoc', method: 'POST', body }),
            invalidatesTags: [{ type: 'Dashboard', id: 'SUMMARY' }],
        }),
    }),
});

export const { useSyncDataRiceMutation } = riceDataApi;
