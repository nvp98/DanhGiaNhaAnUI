import React, { useEffect, useState } from "react";
import LayoutComponent from "../components/LayoutComponent";
import { Button, Input, Table, TableColumnsType, Form, Select, Spin, DatePicker, Tag } from "antd";
import { useForm } from "antd/es/form/Form";
import { useDispatch, useSelector } from "react-redux";
import { RootType } from "../store/types";
import { GrHistory } from "react-icons/gr";
import moment from 'moment';
import { IoSearchOutline } from "react-icons/io5";
import "dayjs/locale/en";
import KhaoSatModel from "../models/KhaoSatModel";
import GetKhaoSatAction from "../acctions/GetKhaoSatAction";
import LogoutAction from "../acctions/LogoutAction";
import { useNavigate } from "react-router-dom";
import NhaAnModel from "../models/NhaAnModel";
import GetNhaAnAction from "../acctions/GetNhaAnAction";
import { FaDownload } from "react-icons/fa";
import ExportExcel from "../configs/exportExcel";




const AdminPage: React.FC = () => {
    const auth = useSelector((state: RootType) => state.auth)
    const notify = useSelector((state: RootType) => state.notify)
    const [loading, setLoading] = useState(false);
    const [loadingFilter,] = useState(false);
    const [selectNhaAn, setSelectNhaAn] = useState(0);
    const [dataNhaAn, setDataNhaAn] = useState<NhaAnModel[]>([]);
    const { RangePicker } = DatePicker;
    const [formFilter] = useForm();
    const today2 = moment().startOf('day');
    const [searchText, setSearchText] = useState('');
    const dispatch = useDispatch()
    const navigator = useNavigate();
    const [data, setdata] = useState<KhaoSatModel[]>([]);

    const handleSearch = (e: any) => {
        const value = e.target.value.toLowerCase();
        setSearchText(value);
    };



    const today = new Date().toISOString().split('T')[0];

    const getHighlightedText = (text: String, highlight: String) => {
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
        await setDataNhaAn(listNhaAn)
        var dataBPa: KhaoSatModel[] = await GetKhaoSatAction(today, today + " 23:59")
        await setdata(dataBPa)


        setLoading(false)
    }
    useEffect(
        () => {
            getData()
        }, [notify.isNotify]
    )

    useEffect(() => {
        if(!auth.isAuthenticated){
            navigator("/login")
        }
        if (auth.user?.timesave) {
            const specificTime = new Date(auth.user.timesave);
            const now = new Date();
            const differenceInMilliseconds = now.getTime() - specificTime.getTime();

            const differenceInHours = differenceInMilliseconds / (1000 * 60 * 60);

            console.log(differenceInHours)

            if (differenceInHours >= 2) {
                LogoutAction(dispatch, navigator);
            }

        }
    }, [])
    const getDataFilter = async (startDate: string, endDate: string) => {
        setLoading(true)
        var dataBPa: KhaoSatModel[] = await GetKhaoSatAction(startDate, endDate)
        await setdata(dataBPa)
        setLoading(false)
    }

    const filteredData = data.filter((record: KhaoSatModel) => {
        if (selectNhaAn == 0) {
            return Object.keys(record).some((key: string) =>
                String((record as any)[key]).toLowerCase().includes(searchText)
            )
        } else {
            return Object.keys(record).some((key: string) =>
                String((record as any)[key]).toLowerCase().includes(searchText) &&
                record.diaDiem_ID == selectNhaAn

            )
        }

    }
    );

    return <>
        <LayoutComponent menuSelect="history">
            <>
                {
                    loading ? <>
                        <div className="!min-h-[100%] flex justify-center items-center">
                            <Spin />
                        </div>

                    </> :
                        <>
                            <div className="flex justify-between items-center gap-3 mb-10">
                                <div className="flex justify-start items-center gap-3 ">
                                    <div className="w-[60px] h-[60px] flex justify-center items-center bg-gray-100 rounded-md ">
                                        <GrHistory className="text-2xl text-black" />
                                    </div>
                                    <h2 className="font-bold text-xl text-zinc-700">LỊCH SỬ KHẢO SÁT</h2>



                                </div>

                                {/* <Button type="primary" onClick={} className="font-normal text-base"><BiDownload /> Export Excel</Button> */}
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
                            <div className="pb-5 flex justify-between">
                                <Form
                                    form={formFilter}
                                    name="form_add_role"
                                    className="flex justify-start items-center gap-3"
                                    initialValues={{ date: [today2, today2] }}
                                    onFinish={(values) => {
                                        const startDate = `${values.date[0].$y}-${values.date[0].$M + 1}-${values.date[0].$D} ${values.date[0].$H}:${values.date[0].$m}`
                                        const endDate = `${values.date[1].$y}-${values.date[1].$M + 1}-${values.date[1].$D} ${values.date[1].$H}:${values.date[1].$m}`
                                        getDataFilter(startDate, endDate)
                                    }}
                                >
                                    <Form.Item name="date"  >
                                        <RangePicker placeholder={['Từ ngày', 'đến']}
                                            className="text-lg p-2"
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
                                    <Select className="h-[40px]  w-[250px]  "
                                        showSearch
                                        optionFilterProp="children"
                                        defaultValue={selectNhaAn}
                                        onChange={async (e) => {
                                            await setSelectNhaAn(e);

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
                                    className="w-[300px]"
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

            </>


        </LayoutComponent>



    </>

}

export default AdminPage;