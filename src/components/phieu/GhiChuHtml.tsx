import { Modal } from "antd";
import React, { useState } from "react";

export interface GhiChuHtmlProps {
    html: string;
    className?: string;
}

// Render nội dung ghi chú HTML (soạn từ TinyMCE, có thể chứa ảnh nhúng nhỏ).
// Bấm vào ảnh sẽ phóng to xem toàn màn hình thay vì chỉ thấy ảnh thu nhỏ.
export const GhiChuHtml: React.FC<GhiChuHtmlProps> = ({ html, className }) => {
    const [anhPhongTo, setAnhPhongTo] = useState<string | null>(null);

    const xuLyClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "IMG") {
            setAnhPhongTo((target as HTMLImageElement).src);
        }
    };

    return (
        <>
            <div
                className={className}
                onClick={xuLyClick}
                dangerouslySetInnerHTML={{ __html: html }}
            />

            <Modal
                open={!!anhPhongTo}
                onCancel={() => setAnhPhongTo(null)}
                footer={null}
                centered
                width="auto"
                className="modal-phong-to-anh no-print"
                destroyOnClose
            >
                {anhPhongTo && (
                    <img src={anhPhongTo} alt="" className="anh-phong-to" />
                )}
            </Modal>
        </>
    );
};

export default GhiChuHtml;
