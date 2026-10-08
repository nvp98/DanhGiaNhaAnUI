import { apiSliceV2 } from './apiSliceV2';
import DashboardSummaryModel, { DashboardFilterParams } from '../models/DashboardModel';

// Số liệu tổng hợp cho DashboardPageV2 (thay báo cáo Power BI cũ) —
// DashboardController/Summary ở BE tính sẵn bằng SQL aggregate. Gửi bằng
// POST + JSON body (không phải GET + query string) vì filter có nhiều field
// chọn-nhiều (array) — model binding List<T> của ASP.NET Core từ query
// string chỉ nhận lặp key ("DiaDiemIds=1&DiaDiemIds=2"), không nhận chuỗi
// nối phẩy mà fetchBaseQuery/URLSearchParams tự sinh khi value là array
// ("DiaDiemIds=1,2") — từng gây lỗi 400 "not valid". Vẫn dùng builder.query
// (không phải mutation) vì đây là đọc dữ liệu, chỉ mượn method POST để
// mang được body phức tạp, RTK Query vẫn cache/refetch theo args như bình
// thường.
export const dashboardApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        layThongKeDashboard: builder.query<DashboardSummaryModel, DashboardFilterParams>({
            query: (body) => ({ url: '/Dashboard/Summary', method: 'POST', body }),
            providesTags: [{ type: 'Dashboard', id: 'SUMMARY' }],
        }),
    }),
});

export const { useLayThongKeDashboardQuery } = dashboardApiV2;
