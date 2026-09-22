// Ghép đường dẫn tới file tĩnh trong thư mục public/ với base path hiện tại
// (import.meta.env.BASE_URL do Vite tự set theo `base` trong vite.config.ts,
// ứng với VITE_BASE_PATH trong .env.development / .env.production).
// Dùng thay cho việc gõ cứng "/assets/..." để chạy đúng cả khi local lẫn khi
// deploy sau gateway nginx (vd: /hpdq/nhaan/).
export const publicAsset = (path: string) =>
    `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
