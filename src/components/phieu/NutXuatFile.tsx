import { Capacitor } from "@capacitor/core";
import { Button } from "antd";
import React, { useState } from "react";
import { FaFilePdf, FaFileWord } from "react-icons/fa";
import { useDispatch } from "react-redux";

import { setNotify } from "../../store/notifycationSlide";

// App Android (Capacitor) không hỗ trợ tải file blob (saveAs) trong WebView
// — chỉ cho xuất Word/PDF khi chạy trên web.
const LA_APP_NATIVE = Capacitor.isNativePlatform();

export interface NutXuatFileProps {
    // Nơi gọi nên import ĐỘNG module xuất file bên trong hàm (await
    // import("../../utils/xuatWordPhieuX")) để thư viện docx/pdfmake chỉ tải
    // khi người dùng bấm nút, không nằm trong bundle của trang phiếu.
    xuatWord: () => Promise<void>;
    xuatPdf?: () => Promise<void>; // không truyền -> không hiện nút PDF
}

type LoaiFile = "word" | "pdf";

export const NutXuatFile: React.FC<NutXuatFileProps> = ({ xuatWord, xuatPdf }) => {
    const dispatch = useDispatch();
    const [dangXuat, setDangXuat] = useState<LoaiFile | null>(null);

    if (LA_APP_NATIVE) return null;

    const xuLyXuat = async (loai: LoaiFile, xuat: () => Promise<void>) => {
        setDangXuat(loai);
        try {
            await xuat();
        } catch (error) {
            console.error(`[NutXuatFile] Xuất ${loai} thất bại`, error);
            dispatch(
                setNotify({
                    typeNotify: "error",
                    titleNotify: loai === "word" ? "Xuất Word thất bại" : "Xuất PDF thất bại",
                    messageNotify: "",
                })
            );
        } finally {
            setDangXuat(null);
        }
    };

    return (
        <>
            <Button
                className="no-print"
                icon={<FaFileWord />}
                loading={dangXuat === "word"}
                disabled={dangXuat === "pdf"}
                onClick={() => xuLyXuat("word", xuatWord)}
            >
                Xuất Word
            </Button>
            {xuatPdf && (
                <Button
                    className="no-print"
                    icon={<FaFilePdf />}
                    loading={dangXuat === "pdf"}
                    disabled={dangXuat === "word"}
                    onClick={() => xuLyXuat("pdf", xuatPdf)}
                >
                    Xuất PDF
                </Button>
            )}
        </>
    );
};

export default NutXuatFile;
