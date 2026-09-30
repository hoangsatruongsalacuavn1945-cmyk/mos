/**
 * AI Fallback Knowledge Engine for MOS Master 365
 * Ensures zero downtime and uninterrupted student experience even when external Gemini API quota is exhausted.
 */

export function generateOfflineMosAnswer(query: string, subject?: string): string {
  const q = query.toLowerCase();

  // Excel: VLOOKUP / XLOOKUP / INDEX MATCH
  if (q.includes('vlookup') || q.includes('xlookup') || q.includes('hlookup') || q.includes('tra cứu')) {
    return `### 📊 Hướng Dẫn Kỹ Năng Tra Cứu (VLOOKUP & XLOOKUP) Chuẩn MOS Certiport

**1. Cú pháp chuẩn hàm VLOOKUP:**
\`\`\`excel
=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])
\`\`\`
- \`lookup_value\`: Giá trị đem đi tìm kiếm (ví dụ: ô \`A2\`).
- \`table_array\`: Bảng dữ liệu tra cứu (Nên cố định bằng phím **F4**, ví dụ: \`$F$2:$H$20\`).
- \`col_index_num\`: Số thứ tự cột chứa kết quả cần lấy (tính từ trái qua phải, cột 1 là cột tìm kiếm).
- \`range_lookup\`: Luôn nhập **0** (hoặc **FALSE**) trong bài thi MOS để tìm kiếm chính xác tuyệt đối.

**2. Bẫy phòng thi Certiport thường gặp:**
- Cột tìm kiếm bắt buộc phải nằm ở vị trí đầu tiên bên trái của \`table_array\`.
- Kết hợp với \`IFERROR\` để bắt lỗi nếu đề thi yêu cầu:
  \`=IFERROR(VLOOKUP(A2, $F$2:$H$20, 2, 0), "Không tìm thấy")\`
- Với Excel 365, hàm **XLOOKUP** vượt trội hơn vì không cần đếm số thứ tự cột và có thể tra cứu ngược từ phải sang trái.`;
  }

  // Excel: Freeze Panes / Cố định dòng cột
  if (q.includes('freeze') || q.includes('cố định') || q.includes('đóng băng') || q.includes('tiêu đề')) {
    return `### 📌 Kỹ Năng Cố Định Dòng & Cột (Freeze Panes)

**Đường dẫn Ribbon:**
> **Thẻ View > Nhóm Window > Lệnh Freeze Panes**

**3 Chế độ trong phòng thi:**
1. **Freeze Panes (Tự do):**
   - Đặt con trỏ ô tại ô bên dưới dòng muốn cố định và bên phải cột muốn cố định (Ví dụ: để cố định dòng 1 và cột A, hãy chọn ô **B2** trước khi bấm Freeze Panes).
2. **Freeze Top Row:** Cố định duy nhất dòng đầu tiên (Row 1).
3. **Freeze First Column:** Cố định duy nhất cột đầu tiên (Column A).

💡 *Mẹo Certiport:* Không chọn cả dòng hay cả cột khi dùng Freeze Panes tự do, hãy chọn đúng **1 ô giao điểm**.`;
  }

  // Word: Section Break vs Page Break
  if (q.includes('section') || q.includes('ngắt trang') || q.includes('page break') || q.includes('break')) {
    return `### 📑 Phân Biệt Page Break vs. Section Break trong Microsoft Word

**Đường dẫn Ribbon:**
> **Thẻ Layout > Nhóm Page Setup > Lệnh Breaks**

**1. Page Break (Ngắt trang thường - Phím tắt \`Ctrl + Enter\`):**
- Đẩy nội dung sau con trỏ sang trang mới nhưng **giữ nguyên toàn bộ định dạng** của văn bản (lề, hướng giấy dọc/ngang, Header/Footer).

**2. Section Break (Ngắt phân đoạn):**
- **Next Page:** Đẩy sang trang mới đồng thời tạo ra một phân đoạn độc lập. Cần dùng khi:
  - Xoay hướng giấy 1 trang nằm ngang (Landscape) giữa các trang đứng (Portrait).
  - Đánh số trang khác nhau (ví dụ: phần mở đầu đánh số La Mã i, ii, iii; phần thân đánh số 1, 2, 3).
  - Tạo Header/Footer riêng biệt (nhớ bỏ chọn **Link to Previous**).
- **Continuous:** Ngắt phân đoạn ngay tại vị trí con trỏ mà không sang trang mới (dùng khi chia cột báo chí Newspaper Columns).`;
  }

  // Word: Table of Contents / Mục lục tự động
  if (q.includes('mục lục') || q.includes('toc') || q.includes('table of contents')) {
    return `### 📖 Tạo Mục Lục Tự Động (Table of Contents) Chuẩn MOS Word

**1. Điều kiện tiên quyết:**
- Các tiêu đề trong tài liệu phải được áp dụng Style chuẩn: **Heading 1, Heading 2, Heading 3** (Thẻ *Home > Nhóm Styles*).

**2. Các bước chèn mục lục:**
> **Thẻ References > Nhóm Table of Contents > Table of Contents > Chọn mẫu đề bài yêu cầu (Automatic Table 1 hoặc 2)**

**3. Cập nhật mục lục sau khi sửa nội dung:**
- Chọn bảng mục lục > Bấm **Update Table** > Chọn **Update entire table** để đồng bộ lại cả tiêu đề và số trang.`;
  }

  // PowerPoint: Morph Transition
  if (q.includes('morph') || q.includes('chuyển slide') || q.includes('biến hình')) {
    return `### 🎬 Hiệu Ứng Chuyển Trang Morph (PowerPoint 365)

**Đường dẫn Ribbon:**
> **Thẻ Transitions > Nhóm Transition to This Slide > Lệnh Morph**

**Quy tắc vàng để Morph hoạt động hoàn hảo:**
1. Slide 2 phải là bản sao (Duplicate) của Slide 1.
2. Trên Slide 2, thay đổi kích thước, vị trí, màu sắc hoặc xoay các đối tượng.
3. Áp dụng hiệu ứng **Morph** cho Slide 2.
4. *Mẹo nâng cao:* Đặt tên đối tượng bắt đầu bằng hai dấu chấm than (ví dụ: \`!!Logo\`) trong **Selection Pane** để PowerPoint nhận diện và biến đổi mượt mà giữa 2 hình dạng khác nhau!`;
  }

  // PowerPoint: Slide Master
  if (q.includes('slide master') || q.includes('master') || q.includes('bản mẫu')) {
    return `### 🎨 Làm Chủ Slide Master Trong PowerPoint

**Đường dẫn Ribbon:**
> **Thẻ View > Nhóm Master Views > Lệnh Slide Master**

**Ứng dụng cốt lõi:**
- **Slide lớn nhất trên cùng (Master Layout):** Mọi thay đổi tại đây (chèn Logo, định dạng Font chữ, Footer, số trang) sẽ tự động áp dụng cho **toàn bộ các slide** trong bài thuyết trình.
- **Các slide con bên dưới:** Tùy biến riêng cho từng Layout cụ thể (Title Slide, Title and Content, Two Content...).
- Sau khi chỉnh sửa xong, bắt buộc bấm **Close Master View** trên thanh Ribbon để quay về chế độ soạn thảo thông thường.`;
  }

  // General MOS Advice
  return `### 💡 Hướng Dẫn Ôn Thi MOS Certiport Chuẩn Quốc Tế

Chào bạn! Câu hỏi của bạn về nội dung **${subject || 'MOS Master'}** rất thiết thực trong kỳ thi thực tế.

**3 Lưu ý sống còn khi làm bài thi MOS:**
1. **Thanh Ribbon là thước đo:** Khảo thí Certiport chấm điểm dựa trên đúng đường dẫn lệnh trên Ribbon. Tránh dùng chuột phải trừ khi đề bài yêu cầu cụ thể.
2. **Quản lý thời gian 50 phút:**
   - Mỗi bài thi có từ 5-7 Dự án (Projects), mỗi Dự án có 4-7 Tasks.
   - Dành tối đa **1 - 1.5 phút cho mỗi Task**.
   - Nếu gặp câu khó, hãy bấm **Mark for Review** và làm các câu tiếp theo trước!
3. **Phím tắt Certiport chuẩn:**
   - \`Ctrl + S\`: Lưu bài làm.
   - \`Ctrl + Z\`: Hoàn tác lệnh sai trước khi chuyển Task.
   - \`F4\`: Cố định ô trong Excel hoặc lặp lại thao tác cuối cùng trong Word.`;
}
