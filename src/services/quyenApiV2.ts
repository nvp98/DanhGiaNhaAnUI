import { apiSliceV2 } from './apiSliceV2';
import QuyenModel from '../models/QuyenModel';

// Danh mục quyền cố định — chỉ đọc (mỗi mã quyền khớp 1 policy ở backend, xem
// 02. Phantich/modules/VaiTro.md), dùng để build checkbox group gán quyền cho
// vai trò ở VaiTroPageV2.
export const quyenApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachQuyen: builder.query<QuyenModel[], void>({
            query: () => '/quyen',
            providesTags: [{ type: 'Quyen', id: 'LIST' }],
        }),
    }),
});

export const { useDanhSachQuyenQuery } = quyenApiV2;
