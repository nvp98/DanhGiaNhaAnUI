import { apiSliceV2 } from './apiSliceV2';
import KetQuaDanhGiaPhanBoModel from '../models/KetQuaDanhGiaPhanBoModel';

export interface DanhSachKetQuaDanhGiaPhanBoParamsV2 {
    diaDiemNhaAnId?: number;
    idBuaAn?: number;
    tuNgay?: string;
    denNgay?: string;
}

// Màn hình rà soát số liệu gốc (KetQuaDanhGia thô) vs đã phân bổ (khớp
// DuLieuCom.Com_ThucTe) — xem KetQuaDanhGiaPhanBoPageV2.tsx.
export const ketQuaDanhGiaPhanBoApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachKetQuaDanhGiaPhanBo: builder.query<KetQuaDanhGiaPhanBoModel[], DanhSachKetQuaDanhGiaPhanBoParamsV2 | void>({
            query: (params) => ({ url: '/KetQuaDanhGiaPhanBo', params: params ?? {} }),
            providesTags: [{ type: 'KetQuaDanhGiaPhanBo', id: 'LIST' }],
        }),
    }),
});

export const { useDanhSachKetQuaDanhGiaPhanBoQuery } = ketQuaDanhGiaPhanBoApiV2;
