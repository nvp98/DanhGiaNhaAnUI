import { apiSliceV2 } from './apiSliceV2';
import NguoiDungListItemModel from '../models/NguoiDungListItemModel';
import ChuKyModel from '../models/ChuKyModel';
import MauLuongKyKhaDungModel from '../models/MauLuongKyKhaDungModel';
import NguoiDungPhieuQuyenModel from '../models/NguoiDungPhieuQuyenModel';

export interface DanhSachNguoiDungParamsV2 {
    trangThai?: string;
    phongBanId?: number;
    nhaThauId?: number;
}

export interface TaoNguoiDungParamsV2 {
    tenDangNhap: string;
    matKhau: string;
    hoTen: string;
    email?: string;
    soDienThoai?: string;
    phongBanId?: number;
    nhaThauId?: number;
    vaiTroIds: number[];
    mauLuongKyIds?: number[];
    phieuQuyen?: NguoiDungPhieuQuyenModel[];
}

export const nguoiDungApiV2 = apiSliceV2.injectEndpoints({
    endpoints: (builder) => ({
        danhSachNguoiDung: builder.query<NguoiDungListItemModel[], DanhSachNguoiDungParamsV2 | void>({
            query: (params) => ({ url: '/nguoi-dung', params: params ?? {} }),
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'NguoiDung' as const, id })), { type: 'NguoiDung' as const, id: 'LIST' }]
                    : [{ type: 'NguoiDung' as const, id: 'LIST' }],
        }),
        chiTietNguoiDung: builder.query<NguoiDungListItemModel, number>({
            query: (id) => `/nguoi-dung/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'NguoiDung', id }],
        }),
        taoNguoiDung: builder.mutation<NguoiDungListItemModel, TaoNguoiDungParamsV2>({
            query: (body) => ({ url: '/nguoi-dung', method: 'POST', body }),
            invalidatesTags: [{ type: 'NguoiDung', id: 'LIST' }],
        }),
        danhSachChuKyNguoiDung: builder.query<ChuKyModel[], number>({
            query: (id) => `/nguoi-dung/${id}/chu-ky`,
            providesTags: (_result, _error, id) => [{ type: 'ChuKy', id: `ND_${id}` }],
        }),
        uploadChuKyNguoiDung: builder.mutation<ChuKyModel, { id: number; file: File }>({
            query: ({ id, file }) => {
                const formData = new FormData();
                formData.append('file', file);
                return { url: `/nguoi-dung/${id}/chu-ky`, method: 'POST', body: formData };
            },
            invalidatesTags: (_result, _error, { id }) => [{ type: 'ChuKy', id: `ND_${id}` }],
        }),
        kichHoatChuKyNguoiDung: builder.mutation<{ message: string }, { id: number; chuKyId: number }>({
            query: ({ id, chuKyId }) => ({ url: `/nguoi-dung/${id}/chu-ky/${chuKyId}/kich-hoat`, method: 'POST' }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'ChuKy', id: `ND_${id}` }],
        }),
        xoaChuKyNguoiDung: builder.mutation<{ message: string }, { id: number; chuKyId: number }>({
            query: ({ id, chuKyId }) => ({ url: `/nguoi-dung/${id}/chu-ky/${chuKyId}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'ChuKy', id: `ND_${id}` }],
        }),
        duyetNguoiDung: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/nguoi-dung/${id}/duyet`, method: 'POST' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'NguoiDung', id }, { type: 'NguoiDung', id: 'LIST' }],
        }),
        tuChoiNguoiDung: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/nguoi-dung/${id}/tu-choi`, method: 'POST' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'NguoiDung', id }, { type: 'NguoiDung', id: 'LIST' }],
        }),
        xoaVinhVienNguoiDung: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/nguoi-dung/${id}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'NguoiDung', id }, { type: 'NguoiDung', id: 'LIST' }],
        }),
        khoaNguoiDung: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/nguoi-dung/${id}/khoa`, method: 'POST' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'NguoiDung', id }, { type: 'NguoiDung', id: 'LIST' }],
        }),
        moKhoaNguoiDung: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/nguoi-dung/${id}/mo-khoa`, method: 'POST' }),
            invalidatesTags: (_result, _error, id) => [{ type: 'NguoiDung', id }, { type: 'NguoiDung', id: 'LIST' }],
        }),
        capNhatVaiTroNguoiDung: builder.mutation<{ message: string }, { id: number; vaiTroIds: number[] }>({
            query: ({ id, vaiTroIds }) => ({ url: `/nguoi-dung/${id}/vai-tro`, method: 'PUT', body: { vaiTroIds } }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'NguoiDung', id }, { type: 'NguoiDung', id: 'LIST' }],
        }),
        resetMatKhauNguoiDung: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/nguoi-dung/${id}/reset-mat-khau`, method: 'POST' }),
        }),
        luongKyKhaDungNguoiDung: builder.query<MauLuongKyKhaDungModel[], number>({
            query: (id) => `/nguoi-dung/${id}/luong-ky-kha-dung`,
            providesTags: (_result, _error, id) => [{ type: 'NguoiDung', id: `LUONG_KY_${id}` }],
        }),
        capNhatLuongKyNguoiDung: builder.mutation<{ message: string }, { id: number; mauLuongKyIds: number[] }>({
            query: ({ id, mauLuongKyIds }) => ({ url: `/nguoi-dung/${id}/luong-ky`, method: 'PUT', body: { mauLuongKyIds } }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'NguoiDung', id },
                { type: 'NguoiDung', id: 'LIST' },
                { type: 'NguoiDung', id: `LUONG_KY_${id}` },
            ],
        }),
        capNhatPhieuQuyenNguoiDung: builder.mutation<{ message: string }, { id: number; danhSach: NguoiDungPhieuQuyenModel[] }>({
            query: ({ id, danhSach }) => ({ url: `/nguoi-dung/${id}/phieu-quyen`, method: 'PUT', body: { danhSach } }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'NguoiDung', id }, { type: 'NguoiDung', id: 'LIST' }],
        }),
    }),
});

export const {
    useDanhSachNguoiDungQuery,
    useChiTietNguoiDungQuery,
    useTaoNguoiDungMutation,
    useDuyetNguoiDungMutation,
    useTuChoiNguoiDungMutation,
    useXoaVinhVienNguoiDungMutation,
    useKhoaNguoiDungMutation,
    useMoKhoaNguoiDungMutation,
    useCapNhatVaiTroNguoiDungMutation,
    useResetMatKhauNguoiDungMutation,
    useDanhSachChuKyNguoiDungQuery,
    useUploadChuKyNguoiDungMutation,
    useKichHoatChuKyNguoiDungMutation,
    useXoaChuKyNguoiDungMutation,
    useLuongKyKhaDungNguoiDungQuery,
    useCapNhatLuongKyNguoiDungMutation,
    useCapNhatPhieuQuyenNguoiDungMutation,
} = nguoiDungApiV2;
