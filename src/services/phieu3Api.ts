import Phieu3Model from '../models/Phieu3Model';
import Phieu3ResponseModel from '../models/Phieu3ResponseModel';
import { apiSliceV2 } from './apiSliceV2';

export interface Phieu3Bang1DongRequest {
    maDong: string;
    diem1?: number | null;
    diem2?: number | null;
    diem3?: number | null;
    diem4?: number | null;
    diem5?: number | null;
    tong?: number | null;
}

export interface Phieu3Bang2GiaTriRequest {
    maTieuChi: string;
    giaTri?: number | null;
}

export interface Phieu3Bang2DongRequest {
    phongBanId: number;
    giaTri: Phieu3Bang2GiaTriRequest[];
}

export interface Phieu3Request {
    thang: number;
    nam: number;
    nhaThauId: number;
}

export interface Phieu3SuaRequest {
    bang1: Phieu3Bang1DongRequest[];
    bang2: Phieu3Bang2DongRequest[];
}

export interface Phieu3YKienNhaThauRequest {
    yKien?: string;
}

export interface DanhSachPhieu3Params {
    nhaThauId?: number;
    thang?: number;
    nam?: number;
    trangThai?: string;
}

export const phieu3Api = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachPhieu3: builder.query<Phieu3Model[], DanhSachPhieu3Params | void>({
            query: (params) => ({ url: '/phieu3', params: params ?? {} }),
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Phieu3' as const, id })), { type: 'Phieu3' as const, id: 'LIST' }]
                    : [{ type: 'Phieu3' as const, id: 'LIST' }],
        }),
        chiTietPhieu3: builder.query<Phieu3ResponseModel, number>({
            query: (id) => `/phieu3/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Phieu3', id }],
        }),
        themPhieu3: builder.mutation<Phieu3ResponseModel, Phieu3Request>({
            query: (body) => ({ url: '/phieu3', method: 'POST', body }),
            invalidatesTags: [{ type: 'Phieu3', id: 'LIST' }],
        }),
        suaPhieu3: builder.mutation<Phieu3ResponseModel, { id: number; body: Phieu3SuaRequest }>({
            query: ({ id, body }) => ({ url: `/phieu3/${id}`, method: 'PUT', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Phieu3', id }, { type: 'Phieu3', id: 'LIST' }],
        }),
        tinhLaiPhieu3: builder.mutation<Phieu3ResponseModel, number>({
            query: (id) => ({ url: `/phieu3/${id}/tinh-lai`, method: 'POST' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Phieu3', id }],
        }),
        xoaPhieu3: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/phieu3/${id}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Phieu3', id }, { type: 'Phieu3', id: 'LIST' }],
        }),
        guiKyPhieu3: builder.mutation<Phieu3Model, number>({
            query: (id) => ({ url: `/phieu3/${id}/gui-ky`, method: 'POST' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Phieu3', id }, { type: 'Phieu3', id: 'LIST' }],
        }),
        dongBoTrangThaiPhieu3: builder.mutation<Phieu3Model, number>({
            query: (id) => ({ url: `/phieu3/${id}/dong-bo-trang-thai`, method: 'POST' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Phieu3', id }, { type: 'Phieu3', id: 'LIST' }],
        }),
        phanHoiYKienNhaThauPhieu3: builder.mutation<Phieu3ResponseModel, { id: number; body: Phieu3YKienNhaThauRequest }>({
            query: ({ id, body }) => ({ url: `/phieu3/${id}/y-kien-nha-thau`, method: 'POST', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Phieu3', id }],
        }),
    }),
});

export const {
    useDanhSachPhieu3Query,
    useChiTietPhieu3Query,
    useThemPhieu3Mutation,
    useSuaPhieu3Mutation,
    useTinhLaiPhieu3Mutation,
    useXoaPhieu3Mutation,
    useGuiKyPhieu3Mutation,
    useDongBoTrangThaiPhieu3Mutation,
    usePhanHoiYKienNhaThauPhieu3Mutation,
} = phieu3Api;
