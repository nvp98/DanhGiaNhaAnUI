import BuaAnModel from '../models/BuaAnModel';
import { apiSliceV2 } from './apiSliceV2';

// Danh mục "Bữa ăn" — 4 dòng tĩnh, không có mutation (xem BuaAnController ở BE).
export const buaAnApi = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachBuaAn: builder.query<BuaAnModel[], void>({
            query: () => '/bua-an',
        }),
    }),
});

export const { useDanhSachBuaAnQuery } = buaAnApi;
