import { Question, PracticalTask, MOSDomain } from '../types/mos';
import { THEORY_QUESTIONS } from './theoryQuestions';

export interface MassivePracticalTask extends PracticalTask {
  subject: 'word' | 'excel' | 'powerpoint';
  domainName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  officialRibbonPath: string;
  category: string;
  scenarioDoc?: string;
}

// =========================================================================
// 1. GENERATOR FOR 1,000 WORD & 1,000 EXCEL THEORY QUESTIONS
// =========================================================================

// High-fidelity domain parameters for Word
const WORD_DOMAINS_CONFIG = [
  {
    id: 'w1',
    name: 'Quản lý tài liệu & Thiết lập trang',
    topics: [
      {
        feature: 'Lề trang (Margins)',
        variants: ['Narrow (0.5")', 'Normal (1")', 'Wide (2")', 'Moderate', 'Mirrored'],
        path: 'Layout > Page Setup > Margins',
        shortcut: 'Alt + P + M',
        scenario: 'Đề bài yêu cầu bạn thiết lập khoảng cách lề cho toàn bộ tài liệu thành định dạng',
        expl: 'Trong thẻ Layout, nhóm Page Setup cung cấp công cụ Margins với các mẫu lề chuẩn Certiport như Normal, Narrow, Wide.'
      },
      {
        feature: 'Ngắt phần & ngắt trang (Breaks)',
        variants: ['Next Page Section Break', 'Continuous Section Break', 'Even Page Break', 'Column Break', 'Page Break'],
        path: 'Layout > Page Setup > Breaks',
        shortcut: 'Ctrl + Enter (cho Page Break)',
        scenario: 'Yêu cầu chia nhỏ tài liệu để định dạng header khác biệt bằng cách chèn',
        expl: 'Section Break (ngắt phần) cho phép các trang sau có hướng giấy, lề và header/footer hoàn toàn độc lập với các trang trước.'
      },
      {
        feature: 'Hình mờ tài liệu (Watermark)',
        variants: ['DRAFT 1', 'CONFIDENTIAL', 'SAMPLE', 'DO NOT COPY', 'Custom Text Watermark'],
        path: 'Design > Page Background > Watermark',
        shortcut: 'Alt + G + P + W',
        scenario: 'Tài liệu cần được đánh dấu bảo mật bằng việc chèn hình mờ Watermark chữ',
        expl: 'Watermark nằm trong thẻ Design, nhóm Page Background, cho phép chọn mẫu có sẵn hoặc tùy biến chữ, màu xám mờ và độ xoay chéo.'
      },
      {
        feature: 'Hướng giấy (Orientation)',
        variants: ['Landscape (Khổ ngang)', 'Portrait (Khổ dọc)'],
        path: 'Layout > Page Setup > Orientation',
        shortcut: 'Alt + P + O',
        scenario: 'Chuyển đổi hướng trình bày của trang chứa bảng biểu rộng sang',
        expl: 'Orientation chuyển đổi giữa Portrait (khổ đứng chuẩn 8.5x11 hoặc A4) và Landscape (khổ ngang để chứa bảng biểu rộng).'
      },
      {
        feature: 'Tiêu đề đầu và chân trang (Header & Footer)',
        variants: ['Different First Page', 'Different Odd & Even Pages', 'Link to Previous (Tắt liên kết)', 'Page Number Bottom Right'],
        path: 'Insert > Header & Footer (hoặc Header & Footer Tools)',
        shortcut: 'Double click vào mép trên/dưới trang',
        scenario: 'Yêu cầu tùy biến trang bìa không hiển thị số trang và header bằng tùy chọn',
        expl: 'Khi chỉnh sửa Header/Footer, thẻ ngữ cảnh Header & Footer xuất hiện với tùy chọn Different First Page để ẩn header trên trang đầu tiên.'
      },
      {
        feature: 'Thuộc tính tài liệu & Kiểm tra (Inspect Document)',
        variants: ['Title Property', 'Subject Property', 'Remove Personal Information', 'Remove Hidden Data', 'Compatibility Checker'],
        path: 'File > Info > Inspect Document / Properties',
        shortcut: 'Alt + F + I',
        scenario: 'Trước khi phân phối tài liệu cho khách hàng, yêu cầu xóa sạch thông tin cá nhân và thuộc tính ẩn bằng',
        expl: 'Tính năng Inspect Document (Kiểm tra tài liệu) trong File > Info giúp rà soát và loại bỏ metadata, ghi chú ẩn, dữ liệu tác giả.'
      }
    ]
  },
  {
    id: 'w2',
    name: 'Chèn & Định dạng văn bản, đoạn văn',
    topics: [
      {
        feature: 'Kiểu mẫu văn bản (Styles)',
        variants: ['Heading 1', 'Heading 2', 'Heading 3', 'Title', 'Subtitle', 'Intense Quote', 'Emphasis'],
        path: 'Home > Styles',
        shortcut: 'Ctrl + Alt + 1 (cho Heading 1)',
        scenario: 'Đề bài yêu cầu áp dụng định dạng tiêu đề cấp độ chuẩn Certiport kiểu',
        expl: 'Áp dụng Styles từ thẻ Home không chỉ chuẩn hóa giao diện mà còn là điều kiện bắt buộc để tự động tạo Mục lục (Table of Contents).'
      },
      {
        feature: 'Khoảng cách dòng & đoạn (Line & Paragraph Spacing)',
        variants: ['1.15 lines', '1.5 lines', 'Double (2.0)', 'Exactly 14 pt', 'Add Space Before Paragraph', 'Remove Space After Paragraph'],
        path: 'Home > Paragraph > Line and Paragraph Spacing',
        shortcut: 'Ctrl + 1 (đơn), Ctrl + 2 (đôi), Ctrl + 5 (1.5)',
        scenario: 'Thiết lập độ giãn khoảng cách dòng cho toàn bộ phần thân bài viết thành',
        expl: 'Trong nhóm Paragraph thẻ Home, công cụ Line and Paragraph Spacing điều khiển khoảng cách giữa các dòng và giãn cách đoạn văn bản.'
      },
      {
        feature: 'Chia cột báo chí (Columns)',
        variants: ['Two Columns', 'Three Columns', 'Left Column with Line Between', 'Right Column', 'Equal column width'],
        path: 'Layout > Page Setup > Columns',
        shortcut: 'Alt + P + J',
        scenario: 'Định dạng các đoạn văn được chọn thành bố cục chia cột dạng',
        expl: 'Columns trong Layout > Page Setup cho phép chia văn bản thành nhiều cột song song và thêm đường kẻ phân cách Line Between.'
      },
      {
        feature: 'Tìm kiếm & Thay thế nâng cao (Find & Replace)',
        variants: ['Replace font formatting', 'Match Case', 'Special character: Manual Line Break', 'Replace all instances', 'Find Styles'],
        path: 'Home > Editing > Replace',
        shortcut: 'Ctrl + H',
        scenario: 'Yêu cầu thay thế toàn bộ từ viết tắt hoặc ký tự đặc biệt trong tài liệu bằng',
        expl: 'Hộp thoại Find and Replace (Ctrl+H) hỗ trợ thay thế hàng loạt từ ngữ, ký tự ngắt dòng hoặc định dạng phông chữ tự động.'
      },
      {
        feature: 'Chữ hoa đầu đoạn lớn (Drop Cap)',
        variants: ['Dropped (chữ chìm 3 dòng)', 'In Margin (chữ nằm ngoài lề)', 'Drop Cap Options: Lines to drop = 4'],
        path: 'Insert > Text > Drop Cap',
        shortcut: 'Alt + N + R + C',
        scenario: 'Tạo điểm nhấn nghệ thuật cho ký tự đầu tiên của bài báo bằng',
        expl: 'Drop Cap trong thẻ Insert > nhóm Text biến chữ cái đầu đoạn thành khối chữ lớn chìm trong đoạn văn (Dropped) hoặc nằm ngoài lề (In Margin).'
      }
    ]
  },
  {
    id: 'w3',
    name: 'Quản lý bảng biểu & danh sách',
    topics: [
      {
        feature: 'Định dạng bảng (Table Styles)',
        variants: ['Grid Table 4 - Accent 1', 'List Table 3 - Accent 2', 'Table Style Light 15', 'Grid Table 2', 'Plain Table 3'],
        path: 'Table Design > Table Styles',
        shortcut: 'Alt + J + T',
        scenario: 'Định dạng bảng số liệu tài chính sử dụng mẫu giao diện chuẩn',
        expl: 'Khi chọn bảng, thẻ ngữ cảnh Table Design hiển thị bộ sưu tập Table Styles với các màu sắc và đường viền phối sẵn chuyên nghiệp.'
      },
      {
        feature: 'Tự động lặp lại dòng tiêu đề (Repeat Header Rows)',
        variants: ['Repeat as header row at top of each page', 'Header Row checkbox', 'First Column checkbox', 'Total Row'],
        path: 'Layout (Table Tools) > Data > Repeat Header Rows',
        shortcut: 'Alt + J + L + V',
        scenario: 'Bảng số liệu kéo dài qua nhiều trang, yêu cầu dòng tiêu đề tự động xuất hiện ở đầu mỗi trang mới bằng',
        expl: 'Tính năng Repeat Header Rows trong Layout (Table Tools) đảm bảo người đọc luôn nhìn thấy tiêu đề cột khi bảng kéo dài qua nhiều trang giấy.'
      },
      {
        feature: 'Chuyển đổi văn bản thành bảng (Convert Text to Table)',
        variants: ['Separate text at Tabs', 'Separate text at Commas', 'AutoFit to contents', 'Separate text at Paragraphs'],
        path: 'Insert > Table > Convert Text to Table',
        shortcut: 'Alt + N + T + V',
        scenario: 'Chuyển danh sách dữ liệu đang ngăn cách nhau bằng dấu Tab thành bảng có kích thước',
        expl: 'Convert Text to Table tự động phân tích dấu phân tách (Tabs, dấu phẩy, dấu chấm phẩy) để tách dòng chữ thành các cột ô bảng tương ứng.'
      },
      {
        feature: 'Sắp xếp dữ liệu trong bảng (Sort Table)',
        variants: ['Sort by Column 1 Ascending', 'Sort by Column 2 Descending', 'Sort with Header row', 'Case sensitive sort'],
        path: 'Layout (Table Tools) > Data > Sort',
        shortcut: 'Alt + J + L + S',
        scenario: 'Sắp xếp các dòng trong bảng theo thứ tự bảng chữ cái hoặc số liệu tại cột chỉ định bằng',
        expl: 'Nút Sort trong nhóm Data của thẻ Layout Table Tools cho phép sắp xếp theo tối đa 3 cấp độ (Sort by, Then by).'
      }
    ]
  },
  {
    id: 'w4',
    name: 'Tạo & Quản lý tài liệu tham khảo',
    topics: [
      {
        feature: 'Mục lục tự động (Table of Contents)',
        variants: ['Automatic Table 1', 'Automatic Table 2', 'Custom Table of Contents: 3 levels', 'Update entire table'],
        path: 'References > Table of Contents',
        shortcut: 'Alt + S + T',
        scenario: 'Chèn bảng mục lục tự động ở đầu tài liệu tổng hợp từ các cấp Heading bằng',
        expl: 'Table of Contents trong thẻ References tự động quét toàn bộ Heading 1, 2, 3 và số trang tương ứng để dựng mục lục chuẩn xác.'
      },
      {
        feature: 'Ghi chú cuối trang & cuối tài liệu (Footnote & Endnote)',
        variants: ['Insert Footnote', 'Insert Endnote', 'Footnote Numbering: Continuous', 'Convert Footnote to Endnote'],
        path: 'References > Footnotes > Insert Footnote',
        shortcut: 'Alt + Ctrl + F (Footnote), Alt + Ctrl + D (Endnote)',
        scenario: 'Giải thích thuật ngữ chuyên ngành tại chân trang đang đọc bằng cách chèn',
        expl: 'Footnote xuất hiện ở chân của chính trang đó, còn Endnote tập hợp tất cả ghi chú ở trang cuối cùng của tài liệu.'
      },
      {
        feature: 'Trích dẫn nguồn & Thư mục (Citations & Bibliography)',
        variants: ['APA Style', 'MLA Style', 'Chicago Style', 'Insert Citation: Add New Source', 'Insert Bibliography'],
        path: 'References > Citations & Bibliography',
        shortcut: 'Alt + S + C',
        scenario: 'Đề tài nghiên cứu yêu cầu trích dẫn tài liệu tham khảo theo quy chuẩn quốc tế',
        expl: 'References > Citations & Bibliography quản lý cơ sở dữ liệu tác giả, năm xuất bản và xuất ra danh mục Bibliography tự động.'
      }
    ]
  },
  {
    id: 'w5',
    name: 'Chèn & Định dạng đối tượng đồ họa',
    topics: [
      {
        feature: 'Bố cục dòng chữ quanh hình ảnh (Wrap Text)',
        variants: ['Square', 'Tight', 'Top and Bottom', 'Behind Text', 'In Front of Text', 'In Line with Text'],
        path: 'Picture Format > Arrange > Wrap Text',
        shortcut: 'Alt + J + P + T + W',
        scenario: 'Yêu cầu định dạng hình ảnh chèn vào sao cho chữ bao bọc ôm sát viền hình ảnh bằng kiểu',
        expl: 'Wrap Text xác định mối quan hệ không gian giữa hình ảnh và chữ xung quanh. Tight ôm sát viền, Square tạo khung chữ nhật quanh hình.'
      },
      {
        feature: 'Sơ đồ thông minh (SmartArt)',
        variants: ['Basic Process', 'Hierarchy', 'Cycle Matrix', 'Continuous Block Process', 'Convert Text to SmartArt'],
        path: 'Insert > Illustrations > SmartArt',
        shortcut: 'Alt + N + M',
        scenario: 'Minh họa quy trình 5 bước sản xuất trực quan bằng sơ đồ SmartArt dạng',
        expl: 'SmartArt trực quan hóa thông tin dạng quy trình (Process), cấp bậc (Hierarchy), chu trình (Cycle) với màu sắc và hiệu ứng 3D sẵn có.'
      },
      {
        feature: 'Văn bản thay thế hỗ trợ người khiếm thị (Alt Text)',
        variants: ['Alt Text Title & Description', 'Mark as decorative', 'Set object Alt Text'],
        path: 'Picture Format > Accessibility > Alt Text',
        shortcut: 'Nhấp chuột phải vào ảnh > Edit Alt Text',
        scenario: 'Chuẩn hóa tài liệu theo tiêu chuẩn tiếp cận khuyết tật bằng việc bổ sung cho hình ảnh mục',
        expl: 'Alt Text (Alternative Text) mô tả nội dung hình ảnh bằng chữ để các phần mềm đọc màn hình (Screen Reader) hỗ trợ người khiếm thị.'
      }
    ]
  }
];

// High-fidelity domain parameters for Excel
const EXCEL_DOMAINS_CONFIG = [
  {
    id: 'e1',
    name: 'Quản lý trang tính & Sổ làm việc',
    topics: [
      {
        feature: 'Cố định hàng/cột tiêu đề (Freeze Panes)',
        variants: ['Freeze Top Row', 'Freeze First Column', 'Freeze Panes (Ô chọn B3)', 'Unfreeze Panes'],
        path: 'View > Window > Freeze Panes',
        shortcut: 'Alt + W + F + F',
        scenario: 'Yêu cầu cố định hàng tiêu đề phía trên để khi cuộn dữ liệu xuống dưới tiêu đề vẫn luôn hiển thị bằng',
        expl: 'Freeze Panes trong thẻ View khóa các hàng hoặc cột chỉ định, giúp việc đối soát bảng tính nhiều ngàn dòng thuận tiện.'
      },
      {
        feature: 'Thiết lập vùng in (Print Area)',
        variants: ['Set Print Area (A1:G25)', 'Clear Print Area', 'Add to Print Area', 'Fit to 1 page wide'],
        path: 'Page Layout > Page Setup > Print Area',
        shortcut: 'Alt + P + R + S',
        scenario: 'Đề bài yêu cầu chỉ in riêng bảng số liệu trong vùng được chọn mà không in phần còn lại bằng',
        expl: 'Set Print Area giới hạn chính xác vùng bảng tính sẽ được gửi đến máy in hoặc xuất ra PDF.'
      },
      {
        feature: 'Thao tác trang tính (Worksheet Operations)',
        variants: ['Move or Copy sheet to end', 'Tab Color: Blue Accent 1', 'Hide Worksheet', 'Unhide Worksheet', 'Rename Sheet'],
        path: 'Home > Cells > Format (hoặc chuột phải vào tên Sheet)',
        shortcut: 'Alt + H + O + M',
        scenario: 'Nhân bản một trang tính sang vị trí cuối cùng của sổ làm việc và đổi màu thẻ sheet thành',
        expl: 'Chuột phải vào tab sheet chọn Move or Copy > tích Create a copy để nhân bản nguyên vẹn công thức và định dạng.'
      }
    ]
  },
  {
    id: 'e2',
    name: 'Quản lý ô dữ liệu & Dải ô',
    topics: [
      {
        feature: 'Điền dữ liệu thông minh (Flash Fill)',
        variants: ['Tách họ và tên', 'Ghép mã nhân viên và năm sinh', 'Chuẩn hóa định dạng số điện thoại', 'Tách tên miền Email'],
        path: 'Data > Data Tools > Flash Fill',
        shortcut: 'Ctrl + E',
        scenario: 'Tự động nhận diện quy luật trích xuất chuỗi ký tự từ cột liền kề mà không cần dùng hàm bằng công cụ',
        expl: 'Flash Fill (Ctrl+E) là tính năng AI thông minh tự động đoán mẫu trích xuất hoặc kết hợp văn bản từ ví dụ đầu tiên bạn gõ.'
      },
      {
        feature: 'Dán đặc biệt (Paste Special)',
        variants: ['Paste Values (chỉ lấy giá trị)', 'Paste Transpose (chuyển dòng thành cột)', 'Paste Formulas', 'Paste Formats'],
        path: 'Home > Clipboard > Paste Special',
        shortcut: 'Ctrl + Alt + V',
        scenario: 'Sao chép kết quả tính toán của công thức và chỉ giữ lại số liệu cố định mà không lưu công thức bằng',
        expl: 'Paste Special > Values (V) loại bỏ công thức liên kết, chỉ giữ lại số kết quả tĩnh, tránh lỗi #REF khi di chuyển ô.'
      },
      {
        feature: 'Định dạng có điều kiện (Conditional Formatting)',
        variants: ['Highlight Cells: Greater Than 500', 'Top 10% Items', 'Data Bars - Gradient Fill', 'Color Scales: Green-Yellow-Red', 'Icon Sets: 3 Flags'],
        path: 'Home > Styles > Conditional Formatting',
        shortcut: 'Alt + H + L',
        scenario: 'Tự động tô màu đỏ các ô có doanh số thấp hơn chỉ tiêu và màu xanh các ô vượt chỉ tiêu bằng',
        expl: 'Conditional Formatting trực quan hóa biến động số liệu tự động theo các quy tắc toán học (lớn hơn, nhỏ hơn, top % hoặc trùng lặp).'
      },
      {
        feature: 'Định dạng số hiển thị (Number Formatting)',
        variants: ['Currency: VND không số lẻ', 'Accounting Format', 'Short Date: DD/MM/YYYY', 'Percentage: 2 decimal places', 'Custom: #,##0 "cái"'],
        path: 'Home > Number > Number Format dropdown',
        shortcut: 'Ctrl + Shift + 4 (Tiền tệ), Ctrl + Shift + 5 (Phần trăm)',
        scenario: 'Quy định các giá trị tiền tệ trong dải ô hiển thị dấu phân cách hàng nghìn và đơn vị bằng định dạng',
        expl: 'Number Format quy định cách hiển thị giá trị số mà không làm thay đổi giá trị gốc được lưu trong ô tính.'
      }
    ]
  },
  {
    id: 'e3',
    name: 'Quản lý bảng tính (Tables)',
    topics: [
      {
        feature: 'Chuyển đổi thành Bảng Excel (Format as Table)',
        variants: ['Table Style Light 9', 'Table Style Medium 2', 'Table Style Dark 3', 'Table with Headers'],
        path: 'Home > Styles > Format as Table (hoặc Insert > Table)',
        shortcut: 'Ctrl + T',
        scenario: 'Biến dải ô dữ liệu thô thành bảng cấu trúc thông minh với tính năng lọc và định dạng tự động kiểu',
        expl: 'Bảng Excel (Ctrl+T) cung cấp khả năng tự động mở rộng vùng dữ liệu, áp dụng style đồng bộ và hỗ trợ công thức có cấu trúc (Structured References).'
      },
      {
        feature: 'Hàng tổng cộng của bảng (Total Row)',
        variants: ['Calculate SUM for Total column', 'Calculate AVERAGE for Price', 'Calculate COUNT for Items', 'Toggle Total Row on/off'],
        path: 'Table Design > Table Style Options > Total Row',
        shortcut: 'Alt + J + T + T',
        scenario: 'Bật dòng tính toán tổng kết ở cuối bảng và áp dụng hàm tính trung bình tự động bằng',
        expl: 'Checkbox Total Row tạo hàng cuối cùng với các menu con tích hợp sẵn hàm SUBTOTAL (SUM, AVERAGE, MAX, MIN...).'
      },
      {
        feature: 'Chuyển bảng thành dải ô thông thường (Convert to Range)',
        variants: ['Convert Table to Normal Range', 'Remove table formatting but keep values', 'Keep style, remove Table structure'],
        path: 'Table Design > Tools > Convert to Range',
        shortcut: 'Alt + J + T + G',
        scenario: 'Hủy cấu trúc bảng thông minh để trở lại dải ô thông thường nhưng vẫn giữ nguyên màu sắc định dạng bằng',
        expl: 'Convert to Range giữ lại toàn bộ dữ liệu và màu sắc hiển thị nhưng loại bỏ các tính năng Table như mũi tên lọc hay công thức @column.'
      },
      {
        feature: 'Lọc & Sắp xếp dữ liệu (Sort & Filter)',
        variants: ['Filter by Color', 'Custom Sort by multiple levels (Department then Salary)', 'Number Filter: Between', 'Text Filter: Begins With'],
        path: 'Data > Sort & Filter > Sort',
        shortcut: 'Ctrl + Shift + L (Bật/tắt Filter)',
        scenario: 'Sắp xếp danh sách nhân viên ưu tiên theo Phòng ban (A-Z) rồi đến Lương giảm dần bằng',
        expl: 'Công cụ Sort trong thẻ Data cho phép thêm nhiều tầng điều kiện (Add Level) để sắp xếp thứ tự đa tiêu chí.'
      }
    ]
  },
  {
    id: 'e4',
    name: 'Thực hiện phép tính với công thức & hàm',
    topics: [
      {
        feature: 'Hàm tính toán điều kiện (SUMIF, COUNTIF, AVERAGEIF)',
        variants: ['=SUMIF(Range, ">1000", Sum_Range)', '=COUNTIF(Range, "Hà Nội")', '=AVERAGEIF(Range, "<50")', '=COUNTIFS(nhiều điều kiện)'],
        path: 'Formulas > Function Library > Math & Trig / Statistical',
        shortcut: 'Gõ trực tiếp vào thanh Formula Bar fx',
        scenario: 'Tính tổng doanh thu của riêng các đơn hàng thuộc khu vực "Miền Bắc" bằng công thức hàm',
        expl: 'Hàm SUMIF tính tổng các ô thỏa mãn một tiêu chí cụ thể. Cú pháp: =SUMIF(vùng_kiểm_tra, điều_kiện, vùng_tính_tổng).'
      },
      {
        feature: 'Hàm logic (IF, AND, OR)',
        variants: ['=IF(Score>=700, "ĐẠT", "HỌC LẠI")', '=IF(AND(A1>0, B1>0), "HỢP LỆ", "LỖI")', '=IF(OR(Role="Admin", Role="GV"), "Cho phép", "Cấm")'],
        path: 'Formulas > Function Library > Logical > IF',
        shortcut: 'Gõ =IF(...)',
        scenario: 'Xác định kết quả đỗ trượt: nếu điểm từ 700 trở lên ghi "ĐẠT", ngược lại ghi "CHƯA ĐẠT" bằng hàm',
        expl: 'Hàm IF kiểm tra điều kiện logic và trả về giá trị thứ nhất nếu đúng, giá trị thứ hai nếu sai. Cú pháp: =IF(logical_test, value_if_true, value_if_false).'
      },
      {
        feature: 'Hàm tìm kiếm tra cứu (VLOOKUP, XLOOKUP, INDEX/MATCH)',
        variants: ['=VLOOKUP(Lookup_Value, Table_Array, Col_Index, FALSE)', '=XLOOKUP(Lookup, Lookup_Array, Return_Array)', '=INDEX(Array, MATCH(...))'],
        path: 'Formulas > Function Library > Lookup & Reference',
        shortcut: 'Gõ =VLOOKUP(...)',
        scenario: 'Dò tìm đơn giá sản phẩm từ bảng danh mục sang bảng hóa đơn dựa trên Mã Hàng bằng',
        expl: 'VLOOKUP dò tìm giá trị ở cột đầu tiên bên trái của bảng tham chiếu và trả về giá trị tại cột chỉ định. Luôn dùng đối số FALSE để dò tìm chính xác tuyệt đối.'
      },
      {
        feature: 'Hàm xử lý chuỗi văn bản (CONCAT, TEXTJOIN, LEFT, RIGHT, UPPER, TRIM)',
        variants: ['=CONCAT(Họ, " ", Tên)', '=TEXTJOIN(", ", TRUE, Range)', '=PROPER(Text) viết hoa chữ cái đầu', '=TRIM(Text) xóa khoảng trắng thừa'],
        path: 'Formulas > Function Library > Text',
        shortcut: 'Gõ =CONCAT(...) hoặc =TEXTJOIN(...)',
        scenario: 'Ghép cột Họ đệm và cột Tên thành cột Họ Và Tên đầy đủ có dấu cách ở giữa bằng',
        expl: 'Hàm CONCAT hoặc toán tử & giúp nối các chuỗi văn bản lại với nhau. TEXTJOIN hỗ trợ phân cách bằng dấu phẩy và tự động bỏ qua ô rỗng.'
      },
      {
        feature: 'Tham chiếu ô tuyệt đối & tương đối ($A$1 vs A1)',
        variants: ['Khóa cả hàng và cột ($A$1)', 'Khóa cột, thả hàng ($A1)', 'Khóa hàng, thả cột (A$1)', 'Phím F4 để chuyển đổi'],
        path: 'Bấm phím F4 khi đang chọn địa chỉ ô trong công thức',
        shortcut: 'Phím F4',
        scenario: 'Cố định ô chứa tỷ giá USD khi sao chép công thức nhân tiền sang toàn bộ các dòng khác bằng',
        expl: 'Thêm dấu $ trước chữ cái cột và số hàng (ví dụ $B$1) biến địa chỉ thành tham chiếu tuyệt đối, giúp địa chỉ không bị trôi khi sao chép công thức.'
      }
    ]
  },
  {
    id: 'e5',
    name: 'Quản lý biểu đồ (Charts)',
    topics: [
      {
        feature: 'Tạo loại biểu đồ chuẩn Certiport',
        variants: ['Clustered Column (Cột cụm)', 'Stacked Column (Cột chồng)', 'Line with Markers (Đường có điểm mốc)', 'Pie 3D (Tròn 3D)', 'Combo Chart (Cột kết hợp Đường)'],
        path: 'Insert > Charts > Insert Column or Bar Chart',
        shortcut: 'Alt + F1 (Tạo biểu đồ nhanh vào sheet hiện tại)',
        scenario: 'Trực quan hóa sự tăng trưởng doanh thu 4 quý của các chi nhánh bằng biểu đồ',
        expl: 'Thẻ Insert > nhóm Charts cung cấp đa dạng biểu đồ. Biểu đồ Clustered Column là dạng phổ biến nhất trong bài thi MOS Excel.'
      },
      {
        feature: 'Thêm và định dạng thành phần biểu đồ (Chart Elements)',
        variants: ['Data Labels: Outside End', 'Chart Title: Above Chart', 'Axis Titles: Primary Vertical', 'Legend: Top Right', 'Data Table with Legend Keys'],
        path: 'Chart Design > Chart Elements (hoặc dấu cộng xanh cạnh biểu đồ)',
        shortcut: 'Bấm nút dấu cộng (+) ở góc trên bên phải biểu đồ',
        scenario: 'Hiển thị chính xác con số doanh thu trực tiếp lên đỉnh của từng cột biểu đồ bằng tùy chọn',
        expl: 'Nút dấu cộng Chart Elements cho phép tích chọn hiển thị Data Labels (nhãn dữ liệu), Chart Title (tiêu đề), Legend (chú giải).'
      },
      {
        feature: 'Di chuyển vị trí biểu đồ (Move Chart)',
        variants: ['Move to New Sheet named "DoanhThu_Chart"', 'As Object in Sheet "BaoCao"'],
        path: 'Chart Design > Location > Move Chart',
        shortcut: 'Alt + J + C + V',
        scenario: 'Đưa biểu đồ sang một trang tính riêng biệt mới có tên chỉ định bằng công cụ',
        expl: 'Move Chart trong thẻ Chart Design cho phép chuyển biểu đồ thành một Chart Sheet độc lập chiếm toàn màn hình.'
      }
    ]
  }
];

// Seeded pseudorandom number generator for deterministic stability
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate exactly 1,000 Questions for a given subject
export function generateMassiveTheoryQuestions(subject: 'word' | 'excel', totalCount: number = 1000): Question[] {
  const config = subject === 'word' ? WORD_DOMAINS_CONFIG : EXCEL_DOMAINS_CONFIG;
  const questions: Question[] = [];
  const rng = createSeededRandom(subject === 'word' ? 10101 : 20202);

  for (let i = 1; i <= totalCount; i++) {
    // Select domain cyclically to ensure even distribution
    const domainIdx = (i - 1) % config.length;
    const domain = config[domainIdx];
    const topicIdx = Math.floor(rng() * domain.topics.length);
    const topic = domain.topics[topicIdx];
    const variantIdx = Math.floor(rng() * topic.variants.length);
    const variant = topic.variants[variantIdx];

    // Difficulty pattern: 40% easy, 40% medium, 20% hard
    const diffRoll = rng();
    const difficulty: 'easy' | 'medium' | 'hard' = diffRoll < 0.4 ? 'easy' : diffRoll < 0.8 ? 'medium' : 'hard';

    // Distractor generation
    const isWord = subject === 'word';
    const correctPath = `${topic.path} > ${variant}`;
    const title = `[MOS ${subject.toUpperCase()} #${i}] Thao tác thiết lập: ${topic.feature} (${variant})`;
    const scenario = `${topic.scenario} "${variant}". Bạn cần thực hiện thao tác nào trên thanh Ribbon của Microsoft ${isWord ? 'Word' : 'Excel'}?`;

    // 4 realistic options
    const optA = { id: 'a', text: `${topic.path} > chọn "${variant}"` };
    const optB = { 
      id: 'b', 
      text: isWord 
        ? 'Thẻ Home > nhóm Editing > chọn Format Options' 
        : 'Thẻ Data > nhóm Connections > chọn Properties' 
    };
    const optC = { 
      id: 'c', 
      text: isWord 
        ? 'Thẻ Insert > nhóm Links > chọn Bookmark' 
        : 'Thẻ Review > nhóm Protect > chọn Protect Sheet' 
    };
    const optD = { 
      id: 'd', 
      text: isWord 
        ? 'Thẻ View > nhóm Zoom > chọn One Page' 
        : 'Thẻ Page Layout > nhóm Sheet Options > chọn Gridlines View' 
    };

    // Shuffle options deterministically
    const rawOptions = [optA, optB, optC, optD];
    const permuteSeed = (i * 7) % 4;
    const correctLetter = ['a', 'b', 'c', 'd'][permuteSeed];
    
    // Swap correct answer to the target letter
    const options = [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' }
    ];
    let otherIdx = 1;
    for (let o = 0; o < 4; o++) {
      const letter = ['a', 'b', 'c', 'd'][o];
      if (letter === correctLetter) {
        options[o].text = optA.text;
      } else {
        options[o].text = rawOptions[otherIdx].text;
        otherIdx++;
      }
    }

    questions.push({
      id: `${subject[0]}-q-${i}`,
      subject,
      domainId: domain.id,
      domainName: domain.name,
      difficulty,
      type: 'multiple-choice',
      title,
      scenario,
      options,
      correctAnswer: correctLetter,
      explanation: `${topic.expl} Quy trình chuẩn Certiport: ${correctPath}.`,
      officialRibbonPath: correctPath,
      shortcutTip: topic.shortcut,
      points: difficulty === 'hard' ? 30 : difficulty === 'medium' ? 25 : 20
    });
  }

  return questions;
}

// =========================================================================
// 2. GENERATOR FOR 1,000 WORD & 1,000 EXCEL PRACTICAL TASKS
// =========================================================================

export function generateMassivePracticalTasks(subject: 'word' | 'excel' | 'powerpoint', totalCount: number = 1000): MassivePracticalTask[] {
  const tasks: MassivePracticalTask[] = [];
  const rng = createSeededRandom(subject === 'word' ? 30303 : subject === 'excel' ? 40404 : 50505);

  const wordActions = [
    { cmd: 'Margins', tab: 'Layout' as const, param: 'Narrow', hint: 'Thẻ Layout > nhóm Page Setup > Margins > chọn Narrow (0.5 inch).', cat: 'Thiết Lập Trang', domain: 'Quản lý tài liệu & Thiết lập trang' },
    { cmd: 'Margins', tab: 'Layout' as const, param: 'Wide', hint: 'Thẻ Layout > nhóm Page Setup > Margins > chọn Wide (Lề rộng).', cat: 'Thiết Lập Trang', domain: 'Quản lý tài liệu & Thiết lập trang' },
    { cmd: 'Orientation', tab: 'Layout' as const, param: 'Landscape', hint: 'Thẻ Layout > nhóm Page Setup > Orientation > Landscape.', cat: 'Thiết Lập Trang', domain: 'Quản lý tài liệu & Thiết lập trang' },
    { cmd: 'Breaks', tab: 'Layout' as const, param: 'Next Page Section Break', hint: 'Thẻ Layout > Page Setup > Breaks > Section Breaks: Next Page.', cat: 'Ngắt Trang', domain: 'Quản lý tài liệu & Thiết lập trang' },
    { cmd: 'Watermark', tab: 'Design' as const, param: 'DRAFT 1', hint: 'Thẻ Design > nhóm Page Background > Watermark > DRAFT 1.', cat: 'Bảo Mật', domain: 'Quản lý tài liệu & Thiết lập trang' },
    { cmd: 'Page Borders', tab: 'Design' as const, param: 'Box Border 1.5pt', hint: 'Thẻ Design > Page Background > Page Borders > chọn kiểu Box.', cat: 'Định Dạng Trang', domain: 'Quản lý tài liệu & Thiết lập trang' },
    { cmd: 'Styles', tab: 'Home' as const, param: 'Heading 1', hint: 'Bôi đen dòng tiêu đề > Thẻ Home > nhóm Styles > chọn Heading 1.', cat: 'Kiểu Chữ Styles', domain: 'Chèn & Định dạng văn bản, đoạn văn' },
    { cmd: 'Styles', tab: 'Home' as const, param: 'Heading 2', hint: 'Thẻ Home > nhóm Styles > nhấp chọn Heading 2.', cat: 'Kiểu Chữ Styles', domain: 'Chèn & Định dạng văn bản, đoạn văn' },
    { cmd: 'Line Spacing', tab: 'Home' as const, param: '1.5 lines', hint: 'Thẻ Home > nhóm Paragraph > Line Spacing > chọn 1.5.', cat: 'Đoạn Văn', domain: 'Chèn & Định dạng văn bản, đoạn văn' },
    { cmd: 'Columns', tab: 'Layout' as const, param: 'Two Columns', hint: 'Thẻ Layout > Page Setup > Columns > chọn Two.', cat: 'Bố Cục Cột', domain: 'Chèn & Định dạng văn bản, đoạn văn' },
    { cmd: 'Drop Cap', tab: 'Insert' as const, param: 'Dropped', hint: 'Thẻ Insert > nhóm Text > Drop Cap > Dropped.', cat: 'Chữ Nghệ Thuật', domain: 'Chèn & Định dạng văn bản, đoạn văn' },
    { cmd: 'Format as Table', tab: 'Insert' as const, param: 'Table 4x4', hint: 'Thẻ Insert > nhóm Tables > Table > chèn bảng 4 dòng 4 cột.', cat: 'Bảng Biểu', domain: 'Quản lý bảng biểu & danh sách' },
    { cmd: 'Table Style', tab: 'Design' as const, param: 'Grid Table 4 - Accent 1', hint: 'Chọn bảng > Thẻ Table Design > chọn Grid Table 4 - Accent 1.', cat: 'Bảng Biểu', domain: 'Quản lý bảng biểu & danh sách' },
    { cmd: 'Repeat Header Rows', tab: 'Layout' as const, param: 'Enabled', hint: 'Chọn hàng đầu tiên của bảng > Thẻ Table Layout > Data > Repeat Header Rows.', cat: 'Bảng Biểu', domain: 'Quản lý bảng biểu & danh sách' },
    { cmd: 'Table of Contents', tab: 'References' as const, param: 'Automatic Table 1', hint: 'Đặt con trỏ ở đầu văn bản > Thẻ References > Table of Contents > Automatic Table 1.', cat: 'Mục Lục', domain: 'Tạo & Quản lý tài liệu tham khảo' },
    { cmd: 'Footnote', tab: 'References' as const, param: 'Insert Footnote', hint: 'Đặt con trỏ sau từ cần chú thích > Thẻ References > Insert Footnote.', cat: 'Ghi Chú', domain: 'Tạo & Quản lý tài liệu tham khảo' },
    { cmd: 'Wrap Text', tab: 'Layout' as const, param: 'Tight', hint: 'Chọn hình ảnh > Thẻ Picture Format > Arrange > Wrap Text > Tight.', cat: 'Đồ Họa', domain: 'Chèn & Định dạng đối tượng đồ họa' },
    { cmd: 'SmartArt', tab: 'Insert' as const, param: 'Basic Process', hint: 'Thẻ Insert > Illustrations > SmartArt > Process > Basic Process.', cat: 'Sơ Đồ', domain: 'Chèn & Định dạng đối tượng đồ họa' },
    { cmd: 'Alt Text', tab: 'Review' as const, param: 'Add Description', hint: 'Chuột phải vào hình ảnh > Edit Alt Text > điền phần mô tả.', cat: 'Tiếp Cận', domain: 'Chèn & Định dạng đối tượng đồ họa' }
  ];

  const excelActions = [
    { cmd: 'Freeze Panes', tab: 'View' as const, param: 'Freeze Top Row', hint: 'Thẻ View > nhóm Window > Freeze Panes > Freeze Top Row.', cat: 'Trang Tính', domain: 'Quản lý trang tính & Sổ làm việc' },
    { cmd: 'Freeze Panes', tab: 'View' as const, param: 'Freeze First Column', hint: 'Thẻ View > nhóm Window > Freeze Panes > Freeze First Column.', cat: 'Trang Tính', domain: 'Quản lý trang tính & Sổ làm việc' },
    { cmd: 'Print Area', tab: 'Page Layout' as const, param: 'Set Print Area A1:F20', hint: 'Quét chọn vùng A1:F20 > Thẻ Page Layout > Print Area > Set Print Area.', cat: 'In Ấn', domain: 'Quản lý trang tính & Sổ làm việc' },
    { cmd: 'Flash Fill', tab: 'Data' as const, param: 'Ctrl + E', hint: 'Nhập giá trị mẫu ô đầu > Thẻ Data > Flash Fill (hoặc ấn Ctrl + E).', cat: 'Điền Dữ Liệu', domain: 'Quản lý ô dữ liệu & Dải ô' },
    { cmd: 'Paste Special', tab: 'Home' as const, param: 'Values Only', hint: 'Copy dải ô > Chuột phải vào ô đích > Paste Special > chọn Values.', cat: 'Ô Dữ Liệu', domain: 'Quản lý ô dữ liệu & Dải ô' },
    { cmd: 'Conditional Formatting', tab: 'Home' as const, param: 'Highlight > 500', hint: 'Thẻ Home > Styles > Conditional Formatting > Highlight Cells Rules > Greater Than 500.', cat: 'Định Dạng Có Điều Kiện', domain: 'Quản lý ô dữ liệu & Dải ô' },
    { cmd: 'Conditional Formatting', tab: 'Home' as const, param: 'Data Bars Gradient', hint: 'Thẻ Home > Conditional Formatting > Data Bars > Gradient Fill Blue.', cat: 'Định Dạng Có Điều Kiện', domain: 'Quản lý ô dữ liệu & Dải ô' },
    { cmd: 'Number Format', tab: 'Home' as const, param: 'Currency VND', hint: 'Bôi đen số liệu > Thẻ Home > nhóm Number > chọn Currency (Tiền tệ).', cat: 'Định Dạng Số', domain: 'Quản lý ô dữ liệu & Dải ô' },
    { cmd: 'Format as Table', tab: 'Home' as const, param: 'Table Style Medium 2', hint: 'Chọn bảng > Thẻ Home > Styles > Format as Table > Table Style Medium 2.', cat: 'Bảng Dữ Liệu', domain: 'Quản lý bảng tính (Tables)' },
    { cmd: 'Total Row', tab: 'Home' as const, param: 'Enable Total Row', hint: 'Nhấp vào bảng > Thẻ Table Design > tích chọn Total Row.', cat: 'Bảng Dữ Liệu', domain: 'Quản lý bảng tính (Tables)' },
    { cmd: 'Convert to Range', tab: 'Home' as const, param: 'Convert to Normal Range', hint: 'Thẻ Table Design > nhóm Tools > chọn Convert to Range > xác nhận Yes.', cat: 'Bảng Dữ Liệu', domain: 'Quản lý bảng tính (Tables)' },
    { cmd: 'AutoSum', tab: 'Formulas' as const, param: '=SUM(C2:C20)', hint: 'Đặt con trỏ ở ô tổng > Thẻ Formulas > chọn AutoSum (hoặc gõ =SUM(...)).', cat: 'Hàm Tính Toán', domain: 'Thực hiện phép tính với công thức & hàm' },
    { cmd: 'Formula IF', tab: 'Formulas' as const, param: '=IF(Score>=700,"Pass","Fail")', hint: 'Nhập công thức =IF(điều_kiện, "Đạt", "Chưa Đạt") tại ô kết quả.', cat: 'Hàm Logic', domain: 'Thực hiện phép tính với công thức & hàm' },
    { cmd: 'Formula VLOOKUP', tab: 'Formulas' as const, param: '=VLOOKUP(A2,$E$2:$G$10,2,FALSE)', hint: 'Sử dụng hàm =VLOOKUP với đối số thứ 4 là FALSE để dò tìm chính xác.', cat: 'Hàm Tra Cứu', domain: 'Thực hiện phép tính với công thức & hàm' },
    { cmd: 'Formula COUNTIF', tab: 'Formulas' as const, param: '=COUNTIF(B2:B30, "Hoàn Thành")', hint: 'Thẻ Formulas > Insert Function > chọn COUNTIF với tiêu chí đếm chỉ định.', cat: 'Hàm Đếm', domain: 'Thực hiện phép tính với công thức & hàm' },
    { cmd: 'Insert Column Chart', tab: 'Insert' as const, param: 'Clustered Column', hint: 'Thẻ Insert > nhóm Charts > Insert Column or Bar Chart > Clustered Column.', cat: 'Biểu Đồ', domain: 'Quản lý biểu đồ (Charts)' },
    { cmd: 'Chart Title', tab: 'Insert' as const, param: 'Báo Cáo Doanh Thu 2026', hint: 'Chọn biểu đồ > Chart Elements (+) > Chart Title > nhập tên tiêu đề.', cat: 'Biểu Đồ', domain: 'Quản lý biểu đồ (Charts)' },
    { cmd: 'Move Chart', tab: 'Insert' as const, param: 'New Sheet named "Charts"', hint: 'Chọn biểu đồ > Thẻ Chart Design > Location > Move Chart > New sheet.', cat: 'Biểu Đồ', domain: 'Quản lý biểu đồ (Charts)' }
  ];

  const powerpointActions = [
    { cmd: 'Slide Size', tab: 'Design' as const, param: 'Widescreen (16:9)', hint: 'Thẻ Design > nhóm Customize > Slide Size > chọn Widescreen (16:9).', cat: 'Thiết Kế Slide', domain: 'Quản lý bài thuyết trình' },
    { cmd: 'Slide Master', tab: 'View' as const, param: 'Slide Master View', hint: 'Thẻ View > nhóm Master Views > nhấp chọn Slide Master.', cat: 'Slide Master', domain: 'Quản lý bài thuyết trình' },
    { cmd: 'New Slide', tab: 'Home' as const, param: 'Title and Content', hint: 'Thẻ Home > nhóm Slides > New Slide > chọn bố cục Title and Content.', cat: 'Trang Chiếu', domain: 'Quản lý trang chiếu' },
    { cmd: 'Section', tab: 'Home' as const, param: 'Add Section', hint: 'Thẻ Home > Slides > Section > Add Section để phân chia các phần trình chiếu.', cat: 'Phân Đoạn', domain: 'Quản lý trang chiếu' },
    { cmd: 'Transitions', tab: 'Transitions' as const, param: 'Morph', hint: 'Thẻ Transitions > nhóm Transition to This Slide > chọn hiệu ứng Morph.', cat: 'Chuyển Trang', domain: 'Hiệu ứng chuyển trang & Hoạt ảnh' },
    { cmd: 'Transitions', tab: 'Transitions' as const, param: 'Push', hint: 'Thẻ Transitions > chọn hiệu ứng Push với thời lượng Duration 1.5s.', cat: 'Chuyển Trang', domain: 'Hiệu ứng chuyển trang & Hoạt ảnh' },
    { cmd: 'Animations', tab: 'Animations' as const, param: 'Fly In', hint: 'Chọn đối tượng > Thẻ Animations > nhóm Animation > chọn Fly In.', cat: 'Hoạt Ảnh', domain: 'Hiệu ứng chuyển trang & Hoạt ảnh' },
    { cmd: 'Animation Pane', tab: 'Animations' as const, param: 'Open Pane', hint: 'Thẻ Animations > nhóm Advanced Animation > nhấp Animation Pane.', cat: 'Hoạt Ảnh', domain: 'Hiệu ứng chuyển trang & Hoạt ảnh' },
    { cmd: 'SmartArt', tab: 'Insert' as const, param: 'Hierarchy', hint: 'Thẻ Insert > nhóm Illustrations > SmartArt > Hierarchy > Organization Chart.', cat: 'Sơ Đồ', domain: 'Chèn & Định dạng hình khối, đồ họa' },
    { cmd: 'Audio', tab: 'Insert' as const, param: 'Audio on My PC', hint: 'Thẻ Insert > nhóm Media > Audio > chọn Audio on My PC.', cat: 'Đa Phương Tiện', domain: 'Chèn phương tiện & Đa truyền thông' },
    { cmd: 'Video', tab: 'Insert' as const, param: 'Online Video', hint: 'Thẻ Insert > nhóm Media > Video > chèn video từ liên kết trực tuyến.', cat: 'Đa Phương Tiện', domain: 'Chèn phương tiện & Đa truyền thông' }
  ];

  const pool = subject === 'word' ? wordActions : subject === 'excel' ? excelActions : powerpointActions;

  for (let i = 1; i <= totalCount; i++) {
    const actIdx = (i - 1) % pool.length;
    const act = pool[actIdx];
    const diffRoll = rng();
    const difficulty: 'easy' | 'medium' | 'hard' = diffRoll < 0.4 ? 'easy' : diffRoll < 0.75 ? 'medium' : 'hard';

    const cellRef = subject === 'word' 
      ? `đoạn văn bản số ${((i % 8) + 1)}` 
      : subject === 'excel' 
      ? `dải ô A${(i % 10) + 1}:F${(i % 10) + 15}`
      : `trang chiếu số ${((i % 5) + 1)}`;

    const instruction = subject === 'word'
      ? `Trên tài liệu hiện tại, thực hiện thao tác "${act.cmd}" với tham số "${act.param}" áp dụng cho ${cellRef}.`
      : subject === 'excel'
      ? `Trên trang tính hiện hành, áp dụng tính năng "${act.cmd}" (${act.param}) cho ${cellRef}.`
      : `Trên bài thuyết trình hiện hành, áp dụng thiết lập "${act.cmd}" với giá trị "${act.param}" cho ${cellRef}.`;

    tasks.push({
      id: `p-${subject[0]}-${i}`,
      taskNumber: i,
      subject,
      domainName: act.domain,
      difficulty,
      instruction,
      targetTab: act.tab,
      targetCommand: act.cmd,
      expectedParam: act.param,
      hint: act.hint,
      officialRibbonPath: `${act.tab} > ${act.cmd} > ${act.param}`,
      category: act.cat,
      completed: false,
      markedForReview: false
    });
  }

  return tasks;
}

// Global cached singletons to ensure super-fast performance and persistent references
let cachedWordTheory: Question[] | null = null;
let cachedExcelTheory: Question[] | null = null;
let cachedWordPractical: MassivePracticalTask[] | null = null;
let cachedExcelPractical: MassivePracticalTask[] | null = null;
let cachedPowerPointPractical: MassivePracticalTask[] | null = null;

export function getWordTheoryBank(): Question[] {
  if (!cachedWordTheory) {
    cachedWordTheory = generateMassiveTheoryQuestions('word', 1000);
  }
  return cachedWordTheory;
}

export function getExcelTheoryBank(): Question[] {
  if (!cachedExcelTheory) {
    cachedExcelTheory = generateMassiveTheoryQuestions('excel', 1000);
  }
  return cachedExcelTheory;
}

export function getWordPracticalBank(): MassivePracticalTask[] {
  if (!cachedWordPractical) {
    cachedWordPractical = generateMassivePracticalTasks('word', 1000);
  }
  return cachedWordPractical;
}

export function getExcelPracticalBank(): MassivePracticalTask[] {
  if (!cachedExcelPractical) {
    cachedExcelPractical = generateMassivePracticalTasks('excel', 1000);
  }
  return cachedExcelPractical;
}

export function getPowerPointPracticalBank(): MassivePracticalTask[] {
  if (!cachedPowerPointPractical) {
    cachedPowerPointPractical = generateMassivePracticalTasks('powerpoint', 1000);
  }
  return cachedPowerPointPractical;
}

// Combined Theory Question Bank combining static master questions + 1000 Word + 1000 Excel
export function getAllTheoryQuestions(): Question[] {
  const word = getWordTheoryBank();
  const excel = getExcelTheoryBank();
  return [...THEORY_QUESTIONS, ...word, ...excel];
}
