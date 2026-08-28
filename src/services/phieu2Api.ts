import Phieu1Model from '../models/Phieu1Model';
import Phieu2Model from '../models/Phieu2Model';
import Phieu2ResponseModel from '../models/Phieu2ResponseModel';
import { apiSliceV2 } from './apiSliceV2';

export interface Phieu2TieuChiRequest {
    maTieuChi: string;
    tenTieuChi?: string;
    dat: boolean;
    khongDat: boolean;
    diem?: number;
    ghiChu?: string;
    thuTu: number;
}

export interface Phieu2Request {
    thang: number;
    nam: number;
    nhaThauId: number;
    bepAnId?: number;
    nhaAnId: number;
    thoiGianTu?: string;
    thoiGianDen?: string;
    diaDiem?: string;
    thoiGianKiemTraText?: string;
    phieu1Id?: number;
    tieuChi: Phieu2TieuChiRequest[];
}

export interface Phieu2YKienNhaThauRequest {
    yKien?: string;
    nguoiPhanHoi?: string;
    ngayPhanHoi?: string;
}

export interface DanhSachPhieu2Params {
    nhaThauId?: number;
    bepAnId?: number;
    thang?: number;
    nam?: number;
    trangThai?: string;
}

export const phieu2Api = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachPhieu2: builder.query<Phieu2Model[], DanhSachPhieu2Params | void>({
            query: (params) => ({ url: '/phieu2', params: params ?? {} }),
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Phieu2' as const, id })), { type: 'Phieu2' as const, id: 'LIST' }]
                    : [{ type: 'Phieu2' as const, id: 'LIST' }],
        }),
        chiTietPhieu2: builder.query<Phieu2ResponseModel, number>({
            query: (id) => `/phieu2/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Phieu2', id }],
        }),
        // Danh sách Phiếu 1 khả dụng để chọn liên kết (cùng nhà thầu, tùy chọn lọc theo bếp ăn)
        danhSachPhieu1KhaDung: builder.query<Phieu1Model[], { nhaThauId: number; bepAnId?: number }>({
            query: ({ nhaThauId, bepAnId }) => ({ url: '/phieu2/phieu1-kha-dung', params: { nhaThauId, bepAnId } }),
        }),
        themPhieu2: builder.mutation<Phieu2ResponseModel, Phieu2Request>({
            query: (body) => ({ url: '/phieu2', method: 'POST', body }),
            invalidatesTags: [{ type: 'Phieu2', id: 'LIST' }],
        }),
        suaPhieu2: builder.mutation<Phieu2ResponseModel, { id: number; body: Phieu2Request }>({
            query: ({ id, body }) => ({ url: `/phieu2/${id}`, method: 'PUT', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Phieu2', id }, { type: 'Phieu2', id: 'LIST' }],
        }),
        xoaPhieu2: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/phieu2/${id}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Phieu2', id }, { type: 'Phieu2', id: 'LIST' }],
        }),
        guiKyPhieu2: builder.mutation<Phieu2Model, number>({
            query: (id) => ({ url: `/phieu2/${id}/gui-ky`, method: 'POST' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Phieu2', id }, { type: 'Phieu2', id: 'LIST' }],
        }),
        dongBoTrangThaiPhieu2: builder.mutation<Phieu2Model, number>({
            query: (id) => ({ url: `/phieu2/${id}/dong-bo-trang-thai`, method: 'POST' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Phieu2', id }, { type: 'Phieu2', id: 'LIST' }],
        }),
        phanHoiYKienNhaThau: builder.mutation<Phieu2ResponseModel, { id: number; body: Phieu2YKienNhaThauRequest }>({
            query: ({ id, body }) => ({ url: `/phieu2/${id}/y-kien-nha-thau`, method: 'POST', body }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Phieu2', id }],
        }),
    }),
});

export const {
    useDanhSachPhieu2Query,
    useChiTietPhieu2Query,
    useDanhSachPhieu1KhaDungQuery,
    useThemPhieu2Mutation,
    useSuaPhieu2Mutation,
    useXoaPhieu2Mutation,
    useGuiKyPhieu2Mutation,
    useDongBoTrangThaiPhieu2Mutation,
    usePhanHoiYKienNhaThauMutation,
} = phieu2Api;
