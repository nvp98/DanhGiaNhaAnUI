function convertToISOMonth(input: string): string {
    // Tách tháng và năm từ chuỗi "6/2024"
    const [month, year] = input.split("-").map(Number);

    // Tạo đối tượng Date với giờ UTC
    const date = new Date(Date.UTC(year, month - 1, 1));

    // Trả về định dạng ISO
    return date.toISOString();
}

export default convertToISOMonth;