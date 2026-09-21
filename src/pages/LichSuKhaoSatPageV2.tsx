import React, { useEffect, useState } from "react";
import LayoutV2Component from "../components/LayoutV2Component";
import { Button, Input, Table, TableColumnsType, Form, Select, Spin, DatePicker, Tag } from "antd";
import { useForm } from "antd/es/form/Form";
import { useSelector } from "react-redux";
import { RootType } from "../store/types";
import { GrHistory } from "react-icons/gr";
import moment from 'moment';
import { IoSearchOutline } from "react-icons/io5";
import "dayjs/locale/en";
import KhaoSatModel from "../models/KhaoSatModel";
import GetKhaoSatAction from "../acctions/GetKhaoSatAction";
import { useNavigate } from "react-router-dom";
import NhaAnModel from "../models/NhaAnModel";
import GetNhaAnAction from "../acctions/GetNhaAnAction";
import { FaDownload } from "react-icons/fa";
import ExportExcel from "../configs/exportExcel";

// Module "Lịch sử khảo sát" — chuyển từ AdminPage.tsx (hệ v1 cũ, đăng nhập
// bằng tài khoản hardcode) sang quản lý trong TrangChuV2Page, dùng chung
// authV2. Nguồn dữ liệu (GetKhaoSatAction/GetNhaAnAction, API cũ ở LinkServer)
// giữ nguyên — chỉ đổi lớp xác thực/layout, không đổi nguồn dữ liệu.
const LichSuKhaoSatPageV2: React.FC = () => {
    const authV2 = useSelector((state: RootType) => state.authV2);
    const navigator = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingFilter,] = useState(false);
    const [selectNhaAn, setSelectNhaAn] = useState(0);
    const [dataNhaAn, setDataNhaAn] = useState<NhaAnModel[]>([]);
    const { RangePicker } = DatePicker;
    const [formFilter] = useForm();
    const today2 = moment().startOf('day');
    const [searchText, setSearchText] = useState('');
    const [data, setdata] = useState<KhaoSatModel[]>([]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase();
        setSearchText(value);
    };

    const today = new Date().toISOString().split('T')[0];

    const getHighlightedText = (text: string, highlight: string) => {
        if (!highlight.trim()) {
            return text;
        }
        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, index) =>
            part.toLowerCase() === highlight.toLowerCase() ? (
                <span key={index} style={{ backgroundColor: 'yellow' }}>
                    {part}
                </span>
            ) : (
                part
            )
        );
    };

    const columns: TableColumnsType<KhaoSatModel> = [
        {
            title: 'STT',
            width: 100,
            dataIndex: 'stt',
            key: 'stt',
            fixed: 'left',
            sorter: {
                compare: (a, b) => Number(a.stt) - Number(b.stt),
                multiple: 1,
            },
            render: (text) => getHighlightedText(String(text), searchText),
        },
        {
            title: 'Vị trí nhà ăn',
            width: 250,
            dataIndex: 'tenDiaDiem',
            key: 'tenDiaDiem',
            fixed: 'left',
            sorter: {
                compare: (a, b) => a.tenDiaDiem.localeCompare(b.tenDiaDiem),
                multiple: 1,
            },
            render: (text) => getHighlightedText(String(text), searchText),
        },
        {
            title: 'Thời gian ',
            width: 200,
            dataIndex: 'thoiGianDanhGia',
            key: 'thoiGianDanhGia',
            fixed: 'left',
            sorter: {
                compare: (a, b) => a.thoiGianDanhGia.localeCompare(b.thoiGianDanhGia),
                multiple: 1,
            },
            render: (text) => getHighlightedText(String(text), searchText),
        },
        {
            title: 'Đánh giá',
            width: 250,
            dataIndex: 'diemDanhGia',
            key: 'diemDanhGia',
            fixed: 'left',
            sorter: {
                compare: (a, b) => a.diemDanhGia.localeCompare(b.diemDanhGia),
                multiple: 1,
            },
            render: (text) =>
                text == "Rất hài lòng" ?
                    <Tag color="success">{getHighlightedText(String(text), searchText)}</Tag>
                    :
                    text == "Hài lòng" ?
                        <Tag color="success">{getHighlightedText(String(text), searchText)}</Tag>
                        :
                        text == "Bình thường" ?
                            <Tag color="default">{getHighlightedText(String(text), searchText)}</Tag>
                            :
                            text == "Không hài lòng" ?
                                <Tag color="warning">{getHighlightedText(String(text), searchText)}</Tag>
                                :

                                <Tag color="error">{getHighlightedText(String(text), searchText)}</Tag>
        },
    ];

    const getData = async () => {
        setLoading(true)
        const listNhaAn = await GetNhaAnAction()
        setDataNhaAn(listNhaAn)
        const dataBPa: KhaoSatModel[] = await GetKhaoSatAction(today, today + " 23:59")
        setdata(dataBPa)
        setLoading(false)
    }

    useEffect(() => {
        if (!authV2.isAuthenticated) {
            navigator("/v2/dang-nhap");
        } else if (!authV2.nguoiDung?.laAdmin) {
            navigator("/v2");
        }
    }, []);

    useEffect(() => {
        if (authV2.isAuthenticated) {
            getData()
        }
    }, [authV2.isAuthenticated]);

    if (!authV2.isAuthenticated || !authV2.nguoiDung?.laAdmin) {
        return null;
    }

    const getDataFilter = async (startDate: string, endDate: string) => {
        setLoading(true)
        const dataBPa: KhaoSatModel[] = await GetKhaoSatAction(startDate, endDate)
        setdata(dataBPa)
        setLoading(false)
    }

    const filteredData = data.filter((record: KhaoSatModel) => {
        if (selectNhaAn == 0) {
            return Object.keys(record).some((key) =>
                String(record[key as keyof KhaoSatModel]).toLowerCase().includes(searchText)
            )
        } else {
            return Object.keys(record).some((key) =>
                String(record[key as keyof KhaoSatModel]).toLowerCase().includes(searchText) &&
                record.diaDiem_ID == selectNhaAn

            )
        }
    });

    return <LayoutV2Component>
        {
            loading ? <>
                <div className="!min-h-[100%] flex justify-center items-center">
                    <Spin />
                </div>
            </> :
                <>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-10">
                        <div className="flex justify-start items-center gap-3 ">
                            <div className="w-[60px] h-[60px] flex justify-center items-center bg-gray-100 rounded-md shrink-0">
                                <GrHistory className="text-2xl text-black" />
                            </div>
                            <h2 className="font-bold text-xl text-zinc-700">LỊCH SỬ KHẢO SÁT</h2>
                        </div>

                        <Button disabled={data.length <= 0} type="primary" onClick={async () => {
                            if (data.length == 0) {
                                return
                            } else {
                                await ExportExcel(data)
                            }
                        }}>
                            <FaDownload />
                            Export Excel
                        </Button>
                    </div>
                    <div className="pb-5 flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-3">
                        <Form
                            form={formFilter}
                            name="form_add_role"
                            className="flex flex-wrap justify-start items-center gap-3"
                            initialValues={{ date: [today2, today2] }}
                            onFinish={(values) => {
                                const startDate = `${values.date[0].$y}-${values.date[0].$M + 1}-${values.date[0].$D} ${values.date[0].$H}:${values.date[0].$m}`
                                const endDate = `${values.date[1].$y}-${values.date[1].$M + 1}-${values.date[1].$D} ${values.date[1].$H}:${values.date[1].$m}`
                                getDataFilter(startDate, endDate)
                            }}
                        >
                            <Form.Item name="date" className="w-full sm:w-auto mb-0">
                                <RangePicker placeholder={['Từ ngày', 'đến']}
                                    className="text-lg p-2 w-full sm:w-auto"
                                    showTime={{
                                        hideDisabledOptions: true,
                                    }}
                                    showNow format={"YYYY-MM-DD HH:mm"}
                                />
                            </Form.Item>
                            <Button type="default" htmlType="submit" className="px-5 py-5 text-base text-blue-600 border-blue-600">
                                Tìm kiếm
                            </Button>
                        </Form>
                        <div className="gap-3 flex">
                            <Select className="h-[40px] w-full sm:w-[250px]"
                                showSearch
                                optionFilterProp="children"
                                defaultValue={selectNhaAn}
                                onChange={async (e) => {
                                    setSelectNhaAn(e);
                                }}
                            >
                                <Select.Option className="!py-2" value={0}>--Chọn nhà ăn--</Select.Option>
                                {
                                    dataNhaAn.length == 0 ? <></> :
                                        <>
                                            {
                                                dataNhaAn.map((nhaAn: NhaAnModel) => {
                                                    if (nhaAn.isActive) {
                                                        return <Select.Option className="!py-2" value={nhaAn.id}>{nhaAn.diaDiem}</Select.Option>
                                                    }
                                                })
                                            }
                                        </>
                                }
                            </Select>
                        </div>

                        <Input
                            className="w-full sm:w-[300px]"
                            type="search"
                            placeholder="Tìm kiếm"
                            value={searchText}
                            onChange={handleSearch}
                            prefix={<IoSearchOutline className="text-gray-400 text-lg" />} />
                    </div>
                    <Table
                        loading={loadingFilter}
                        columns={columns}
                        dataSource={filteredData}
                        scroll={{ x: 1000, y: "52vh" }}
                    />
                </>
        }
    </LayoutV2Component>
}

export default LichSuKhaoSatPageV2;
