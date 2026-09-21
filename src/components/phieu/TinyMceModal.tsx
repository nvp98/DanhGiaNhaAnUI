import { Button, Modal, message } from "antd";
import React, { useRef, useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import LinkServerV2, { ApiRootV2 } from "../../services/LinkServerV2";
import { dinhDangDungLuong, nenAnhTruocKhiUpload } from "./nenAnhUpload";

export interface TinyMceModalProps {
    open: boolean;
    title?: string;
    subtitle?: string;
    initialValue?: string;
    onSave: (content: string) => void;
    onCancel: () => void;
}

export const TinyMceModal: React.FC<TinyMceModalProps> = ({
    open,
    title = "Soạn ghi chú / Chèn hình ảnh minh chứng",
    subtitle,
    initialValue = "",
    onSave,
    onCancel,
}) => {
    const editorRef = useRef<any>(null);
    const [content, setContent] = useState(initialValue);

    useEffect(() => {
        setContent(initialValue || "");
    }, [initialValue, open]);

    const handleSave = () => {
        const value = editorRef.current ? editorRef.current.getContent() : content;
        onSave(value);
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

    return (
        <Modal
            title={
                <div>
                    <div className="font-bold text-base text-zinc-800">{title}</div>
                    {subtitle && <div className="text-xs text-gray-500 font-normal mt-0.5">{subtitle}</div>}
                </div>
            }
            open={open}
            width={780}
            destroyOnClose
            maskClosable={false}
            keyboard={false}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Hủy
                </Button>,
                <Button key="save" type="primary" onClick={handleSave}>
                    Xác nhận & Lưu ghi chú
                </Button>,
            ]}
        >
            <div className="py-2">
                <Editor
                    tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js"
                    onInit={(_evt: any, editor: any) => (editorRef.current = editor)}
                    initialValue={initialValue}
                    init={{
                        height: 350,
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
                            "bullist numlist | image link table | removeformat | code",
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
                <div className="text-xs text-gray-400 mt-2">
                    💡 Mẹo: Bạn có thể sao chép ảnh từ Clipboard rồi nhấn <strong>Ctrl + V</strong> trực tiếp vào khung soạn thảo để chèn ảnh.
                </div>
            </div>
        </Modal>
    );
};

export default TinyMceModal;
