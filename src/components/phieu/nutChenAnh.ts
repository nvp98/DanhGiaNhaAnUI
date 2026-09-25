// Nút "Chèn ảnh" thay cho nút image mặc định của TinyMCE (TinyMceModal.tsx,
// TinyMceInline.tsx): hộp thoại Upload của plugin image chỉ nhận 1 file mỗi
// lần, nên bấm nút này mở thẳng hộp chọn file cho phép chọn NHIỀU ảnh cùng
// lúc. Ảnh được đưa vào blobCache của editor như khi kéo thả/dán ảnh, để
// images_upload_handler sẵn có (nén + upload từng ảnh) tự xử lý tiếp.
// Đang chọn sẵn 1 ảnh trong nội dung thì vẫn mở hộp thoại image gốc để sửa
// kích thước/mô tả như trước.
export function dangKyNutChenAnh(editor: any) {
    editor.ui.registry.addButton("chenanh", {
        icon: "image",
        tooltip: "Chèn ảnh (chọn được nhiều ảnh cùng lúc)",
        onAction: () => {
            if (editor.selection.getNode()?.nodeName === "IMG") {
                editor.execCommand("mceImage");
                return;
            }

            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.multiple = true;
            input.onchange = async () => {
                const danhSachFile = Array.from(input.files ?? []);
                if (!danhSachFile.length) return;

                const blobCache = editor.editorUpload.blobCache;
                const cacThe = await Promise.all(
                    danhSachFile.map(async (file, i) => {
                        const blobInfo = blobCache.create({
                            id: `chenanh${Date.now()}${i}`,
                            blob: file,
                            base64: await docBase64(file),
                            name: file.name.replace(/\.[^.]+$/, ""),
                            filename: file.name,
                        });
                        blobCache.add(blobInfo);
                        return `<p><img src="${blobInfo.blobUri()}" /></p>`;
                    })
                );

                editor.insertContent(cacThe.join(""));
                editor.uploadImages();
            };
            input.click();
        },
    });
}

function docBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}
