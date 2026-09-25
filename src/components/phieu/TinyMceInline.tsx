import { Button, message } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { FaSave } from "react-icons/fa";
import LinkServerV2, { ApiRootV2 } from "../../services/LinkServerV2";
import { dinhDangDungLuong, nenAnhTruocKhiUpload } from "./nenAnhUpload";
import { dangKyNutChenAnh } from "./nutChenAnh";

export interface TinyMceInlineProps {
    value: string;
    // Bắn lên mỗi khi nội dung soạn thảo đổi — để trang cha giữ state đồng bộ
    // và lưu chung với nút "Lưu thay đổi" của cả phiếu (không có nút Lưu
    // riêng ở đây, xem "3. Ý kiến của BP.QLTT" ở Phieu3FormPage.tsx).
    onChange: (content: string) => void;
    // Chỉ truyền onSave khi muốn khung này có nút Lưu riêng (dùng độc lập,
    // không nằm trong luồng Lưu chung của phiếu).
    onSave?: (content: string) => void;
    dangLuu?: boolean;
    height?: number;
    saveLabel?: string;
    className?: string;
}

// Khung soạn thảo TinyMCE hiện thẳng trên trang (khác TinyMceModal — mở qua nút
// bấm trong popup).
export const TinyMceInline: React.FC<TinyMceInlineProps> = ({
    value,
    onChange,
    onSave,
    dangLuu = false,
    height = 250,
    saveLabel = "Lưu ý kiến",
    className,
}) => {
    const editorRef = useRef<any>(null);

    // TinyMCE (@tinymce/tinymce-react) coi mỗi lần prop `initialValue` đổi là
    // một lệnh reset nội dung: nó gọi editor.setContent(...) và xoá undo
    // manager, đưa con trỏ về vị trí không xác định. Nếu truyền thẳng `value`
    // (state ở trang cha) vào `initialValue`, thì MỖI LẦN gõ một ký tự —
    // onEditorChange bắn lên → cha setState → value đổi → editor bị reset
    // ngay giữa lúc đang gõ — con trỏ nhảy lung tung, gõ tiếng Việt (ghép
    // nhiều phím cho 1 ký tự có dấu) bị lỗi/nhảy chữ. Để tránh vòng lặp reset
    // này, chỉ đồng bộ `value` từ cha xuống editor khi đó là thay đổi TỪ BÊN
    // NGOÀI (ví dụ tải phiếu từ server xong mới set), không phải echo lại
    // đúng nội dung mà editor vừa tự bắn lên.
    const lastEmittedRef = useRef(value);
    const [editorInitialValue, setEditorInitialValue] = useState(value);

    useEffect(() => {
        if (value !== lastEmittedRef.current) {
            lastEmittedRef.current = value;
            setEditorInitialValue(value);
        }
    }, [value]);

    const handleEditorChange = (content: string) => {
        lastEmittedRef.current = content;
        onChange(content);
    };

    const imagesUploadHandler = (blobInfo: any, progress: (percent: number) => void): Promise<string> => {
        return nenAnhTruocKhiUpload(blobInfo.blob(), blobInfo.filename()).then((ketQuaNen) => {
            const { blob, tenFile, daNen, kichThuocGoc, kichThuocSauNen } = ketQuaNen;
            if (daNen) {
                message.info(
                    `Đã nén ảnh từ ${dinhDangDungLuong(kichThuocGoc)} xuống ${dinhDangDungLuong(kichThuocSauNen)} trước khi tải lên.`
                );
            }

            return new Promise<string>((resolve, reject) => {
                const formData = new FormData();
                formData.append("upload", blob, tenFile);

                const token = localStorage.getItem("token");
                const xhr = new XMLHttpRequest();
                xhr.withCredentials = false;
                xhr.open("POST", `${LinkServerV2}/tep-dinh-kem/ckeditor`);

                if (token) {
                    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
                }

                xhr.upload.onprogress = (e) => {
                    if (e.total > 0) {
                        progress((e.loaded / e.total) * 100);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status < 200 || xhr.status >= 300) {
                        reject(`Upload thất bại với mã lỗi HTTP: ${xhr.status}`);
                        return;
                    }

                    try {
                        const json = JSON.parse(xhr.responseText);
                        if (!json || typeof json.url !== "string") {
                            reject(`Phản hồi từ server không hợp lệ: ${xhr.responseText}`);
                            return;
                        }
                        // json.url là đường dẫn tương đối (vd /uploads/dinh-kem/xxx.png) —
                        // ghép ApiRootV2 (suy ra từ VITE_BASE_API) để ra URL tuyệt đối nhúng
                        // vào nội dung, tương tự cách hiển thị ảnh chữ ký ở ProfilePageV2.tsx.
                        resolve(`${ApiRootV2}${json.url}`);
                    } catch (e: any) {
                        reject(`Lỗi phân tích phản hồi upload: ${e.message}`);
                    }
                };

                xhr.onerror = () => {
                    reject("Lỗi mạng khi thực hiện tải hình ảnh lên server");
                };

                xhr.send(formData);
            });
        });
    };

    const handleSave = () => {
        const content = editorRef.current ? editorRef.current.getContent() : value;
        onSave?.(content);
    };

    return (
        <div className={className}>
            <Editor
                tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js"
                onInit={(_evt: any, editor: any) => (editorRef.current = editor)}
                initialValue={editorInitialValue}
                onEditorChange={handleEditorChange}
                init={{
                    height,
                    menubar: false,
                    plugins: [
                        "advlist",
                        "autolink",
                        "lists",
                        "link",
                        "image",
                        "charmap",
                        "preview",
                        "searchreplace",
                        "visualblocks",
                        "code",
                        "fullscreen",
                        "insertdatetime",
                        "table",
                        "help",
                        "wordcount",
                    ],
                    toolbar:
                        "undo redo | blocks | bold italic underline | " +
                        "bullist numlist | chenanh link table | removeformat | code",
                    setup: dangKyNutChenAnh,
                    content_style:
                        "body { font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.4; } img { max-width: 100%; height: auto; border-radius: 4px; margin: 4px 0; }",
                    images_upload_handler: imagesUploadHandler,
                    automatic_uploads: true,
                    paste_data_images: true,
                    file_picker_types: "image",
                    branding: false,
                    promotion: false,
                }}
            />
            <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-400">
                    💡 Mẹo: Bạn có thể sao chép ảnh từ Clipboard rồi nhấn <strong>Ctrl + V</strong> trực tiếp vào khung soạn thảo để chèn ảnh.
                </div>
                {onSave && (
                    <Button type="primary" size="small" icon={<FaSave />} loading={dangLuu} onClick={handleSave}>
                        {saveLabel}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default TinyMceInline;
