import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import KhaoSatModel from '../models/KhaoSatModel';


const ExportExcel = async (data: KhaoSatModel[]) => {
  // Tạo workbook và worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  // Định dạng tiêu đề cột
  worksheet.columns = [
    { header: 'STT', key: 'stt', width: 5 },
    { header: 'Vị trí nhà ăn', key: 'tenDiaDiem', width: 40 },
    { header: 'Thời gian', key: 'thoiGianDanhGia', width: 20 },
    { header: 'Đánh giá', key: 'diemDanhGia', width: 20 },
    
  ];

  // Định dạng màu và đường viền cho các ô header
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { bold: true }; // Làm đậm văn bản trong header
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF00' } // Màu nền vàng
    };
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } }
    };
  });

  // Thêm dữ liệu vào worksheet
  worksheet.addRows(data);

  // Định dạng đường viền cho tất cả các ô dữ liệu, bao gồm các hàng mới thêm vào
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF' } // Màu nền cho các ô dữ liệu
      };
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      };
    });
  });

  // Thiết lập kích thước trang A4
  worksheet.pageSetup.paperSize = 9; // 9 corresponds to A4 paper size
  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 0;

  // Tạo file và lưu
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'Lịch sử khảo sát.xlsx');
};

export default ExportExcel;
