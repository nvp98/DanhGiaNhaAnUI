import { apiSliceV2 } from './apiSliceV2';
import Phieu1Model from '../models/Phieu1Model';
import Phieu1ResponseModel from '../models/Phieu1ResponseModel';

export interface Phieu1ChiTietRequest {
    id?: number; // undefined = dòng mới, có giá trị = cập nhật dòng đã tồn tại
    nhomId?: number;
    tieuChiId?: number;
    noiDungTuThem?: string;
    ketQua?: string;
    ghiChu?: string;
    thuTu: number;
}

export interface Phieu1Request {
    ngayKiemTra: string;
    bepAnId: number;
    nhaThauId: number;
    phongBanId: number;
    ketLuanGhiChu?: string;
    chiTiet: Phieu1ChiTietRequest[];
}

export interface DanhSachPhieu1Params {
    bepAnId?: number;
    phongBanId?: number;
    nhaThauId?: number;
    trangThai?: string;
    tuNgay?: string;
    denNgay?: string;
}

export const phieu1Api = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachPhieu1: builder.query<Phieu1Model[], DanhSachPhieu1Params | void>({
            query: (params) => ({ url: '/phieu1', params: params ?? {} }),
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Phieu1' as const, id })), { type: 'Phieu1' as const, id: 'LIST' }]
                    : [{ type: 'Phieu1' as const, id: 'LIST' }],
        }),
        chiTietPhieu1: builder.query<Phieu1ResponseModel, number>({
            query: (id) => `/phieu1/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Phieu1', id }],
        }),
        themPhieu1: builder.mutation<Phieu1ResponseModel, Phieu1Request>({
            query: (body) => ({ url: '/phieu1', method: 'POST', body }),
            invalidatesTags: [{ type: 'Phieu1', id: 'LIST' }],
        }),
        suaPhieu1: builder.mutation<Phieu1ResponseModel, { id: number; body: Phieu1Request }>({
            query: ({ id, body }) => ({ url: `/phieu1/${id}`, method: 'PUT', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Phieu1', id }, { type: 'Phieu1', id: 'LIST' }],
        }),
        xoaPhieu1: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/phieu1/${id}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Phieu1', id }, { type: 'Phieu1', id: 'LIST' }],
        }),
        guiKyPhieu1: builder.mutation<Phieu1Model, number>({
            query: (id) => ({ url: `/phieu1/${id}/gui-ky`, method: 'POST' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Phieu1', id }, { type: 'Phieu1', id: 'LIST' }],
        }),
        dongBoTrangThaiPhieu1: builder.mutation<Phieu1Model, number>({
            query: (id) => ({ url: `/phieu1/${id}/dong-bo-trang-thai`, method: 'POST' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Phieu1', id }, { type: 'Phieu1', id: 'LIST' }],
        }),
    }),
});

export const {
    useDanhSachPhieu1Query,
    useChiTietPhieu1Query,
    useThemPhieu1Mutation,
    useSuaPhieu1Mutation,
    useXoaPhieu1Mutation,
    useGuiKyPhieu1Mutation,
    useDongBoTrangThaiPhieu1Mutation,
} = phieu1Api;
