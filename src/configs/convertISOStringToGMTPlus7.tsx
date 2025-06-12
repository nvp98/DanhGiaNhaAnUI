export default function convertISOStringToGMTPlus7(isoString: string) {
    // Tạo đối tượng Date từ chuỗi ISO 8601
    const utcDate = new Date(isoString);

    // Tính toán sự chênh lệch 7 giờ (7 giờ = 7 * 60 * 60 * 1000 mili giây)
 

    // Cộng thêm offset vào thời gian UTC để chuyển đổi sang GMT+0700
    const localDate = new Date(utcDate.getTime());

    // Lấy các thành phần ngày, giờ, phút, giây và mili giây
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0'); // Tháng từ 0 đến 11, nên cộng thêm 1
    const day = String(localDate.getDate()).padStart(2, '0');
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    const seconds = String(localDate.getSeconds()).padStart(2, '0');
    const milliseconds = String(localDate.getMilliseconds()).padStart(3, '0');

    // Tạo chuỗi theo định dạng YYYY-MM-DDTHH:mm:ss.sssZ
    const result = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;

    return result;
}