import Phieu4Model from '../models/Phieu4Model';
import Phieu4ResponseModel from '../models/Phieu4ResponseModel';
import { apiSliceV2 } from './apiSliceV2';

export interface Phieu4Request {
    tuNgay: string;
    denNgay: string;
    nhaThauIds: number[];
}

export interface Phieu4GiaTriItem {
    dongId: number;
    nhaThauId: number;
    giaTri?: number | null;
}

// Bảng 4/5 — giá trị chung, không chia theo cột nhà thầu (xem Phieu4DongModel.giaTriChung)
export interface Phieu4GiaTriChungItem {
    dongId: number;
    giaTriChung?: number | null;
}

export interface Phieu4CapNhatGiaTriRequest {
    giaTri: Phieu4GiaTriItem[];
    giaTriChung: Phieu4GiaTriChungItem[];
}

export interface Phieu4BangRequest {
    tenBang?: string;
}

export interface Phieu4ThemNhaThauRequest {
    nhaThauId: number;
}

export interface DanhSachPhieu4Params {
    trangThai?: string;
}

export const phieu4Api = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachPhieu4: builder.query<Phieu4Model[], DanhSachPhieu4Params | void>({
            query: (params) => ({ url: '/phieu4', params: params ?? {} }),
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Phieu4' as const, id })), { type: 'Phieu4' as const, id: 'LIST' }]
                    : [{ type: 'Phieu4' as const, id: 'LIST' }],
        }),
        chiTietPhieu4: builder.query<Phieu4ResponseModel, number>({
            query: (id) => `/phieu4/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Phieu4', id }],
        }),
        themPhieu4: builder.mutation<Phieu4ResponseModel, Phieu4Request>({
            query: (body) => ({ url: '/phieu4', method: 'POST', body }),
            invalidatesTags: [{ type: 'Phieu4', id: 'LIST' }],
        }),
        xoaPhieu4: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/phieu4/${id}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Phieu4', id }, { type: 'Phieu4', id: 'LIST' }],
        }),
        tinhLaiPhieu4: builder.mutation<Phieu4ResponseModel, number>({
            query: (id) => ({ url: `/phieu4/${id}/tinh-lai`, method: 'POST' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Phieu4', id }],
        }),
        themNhaThauPhieu4: builder.mutation<Phieu4ResponseModel, { id: number; body: Phieu4ThemNhaThauRequest }>({
            query: ({ id, body }) => ({ url: `/phieu4/${id}/nha-thau`, method: 'POST', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Phieu4', id }],
        }),
        xoaNhaThauPhieu4: builder.mutation<Phieu4ResponseModel, { id: number; nhaThauId: number }>({
            query: ({ id, nhaThauId }) => ({ url: `/phieu4/${id}/nha-thau/${nhaThauId}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Phieu4', id }],
        }),
        capNhatGiaTriPhieu4: builder.mutation<Phieu4ResponseModel, { id: number; body: Phieu4CapNhatGiaTriRequest }>({
            query: ({ id, body }) => ({ url: `/phieu4/${id}/gia-tri`, method: 'PUT', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Phieu4', id }],
        }),
        suaBangPhieu4: builder.mutation<Phieu4ResponseModel, { id: number; bangId: number; body: Phieu4BangRequest }>({
            query: ({ id, bangId, body }) => ({ url: `/phieu4/${id}/bang/${bangId}`, method: 'PUT', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Phieu4', id }],
        }),
        guiKyPhieu4: builder.mutation<Phieu4Model, number>({
            query: (id) => ({ url: `/phieu4/${id}/gui-ky`, method: 'POST' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Phieu4', id }, { type: 'Phieu4', id: 'LIST' }],
        }),
        dongBoTrangThaiPhieu4: builder.mutation<Phieu4Model, number>({
            query: (id) => ({ url: `/phieu4/${id}/dong-bo-trang-thai`, method: 'POST' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Phieu4', id }, { type: 'Phieu4', id: 'LIST' }],
        }),
    }),
});

export const {
    useDanhSachPhieu4Query,
    useChiTietPhieu4Query,
    useThemPhieu4Mutation,
    useXoaPhieu4Mutation,
    useTinhLaiPhieu4Mutation,
    useThemNhaThauPhieu4Mutation,
    useXoaNhaThauPhieu4Mutation,
    useCapNhatGiaTriPhieu4Mutation,
    useSuaBangPhieu4Mutation,
    useGuiKyPhieu4Mutation,
    useDongBoTrangThaiPhieu4Mutation,
} = phieu4Api;
