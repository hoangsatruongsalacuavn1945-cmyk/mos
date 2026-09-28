# KIẾN TRÚC CƠ SỞ DỮ LIỆU & BẢO MẬT DỰ ÁN MOS MASTER

Tài liệu này định nghĩa cấu trúc cơ sở dữ liệu chuyên nghiệp (**PostgreSQL** & **MongoDB**) thay thế toàn diện thư mục tĩnh `src/data/` nhằm giải quyết triệt để vấn đề lộ đáp án phía Client, kiểm soát quyền truy cập (RBAC) và bảo đảm tính toàn vẹn dữ liệu cho kỳ thi chứng chỉ quốc tế MOS.

---

## 1. CÁC THỰC THỂ CỐT LÕI (CORE ENTITIES)

### 1.1. `user_profiles` (Hồ Sơ Người Dùng & Phân Quyền RBAC)
* **Mục đích:** Quản lý tài khoản, vai trò (`student`, `teacher`, `admin`), lớp học, chuỗi ngày học (`streak_days`), giáo viên phụ trách và trạng thái chuyên cần.
* **Các trường chính:**
  * `id`: Khóa chính (UUID / ObjectId)
  * `auth_user_id`: Định danh từ nhà cung cấp xác thực (Firebase Auth / OAuth / JWT)
  * `email`, `full_name`: Thông tin định danh duy nhất
  * `role`: Enum `student` | `teacher` | `admin`
  * `student_code`: Mã học viên (Unique, ví dụ: `K24-CNTT-089`)
  * `classroom`: Tên lớp học (ví dụ: `Lớp MOS-TinHoc01`)
  * `assigned_teacher_id`: Khóa ngoại trỏ đến `user_profiles(id)` của giảng viên phụ trách
  * `student_tag`: Phân loại học lực (`excellent`, `good`, `needs-attention`, `at-risk`)
  * `streak_days`: Số ngày học liên tiếp

### 1.2. `questions` (Ngân Hàng Câu Hỏi Khảo Thí Tối Mật)
* **Mục đích:** Lưu trữ câu hỏi thi chuẩn Certiport cho các môn MOS Word (MO-100), Excel (MO-200), PowerPoint (MO-300).
* **Cơ chế bảo mật chí mạng:**
  * Các trường nhạy cảm: `correct_answer`, `official_ribbon_path`, `explanation`, `shortcut_tip`.
  * **Chính sách phân quyền (RLS / Projection Guard):** Học sinh khi truy vấn danh sách câu hỏi làm bài **KHÔNG BAO GIỜ** được đọc các trường này. Chỉ có server-side engine hoặc teacher/admin mới được phép truy cập.
* **Các trường chính:**
  * `id`: Mã câu hỏi (ví dụ: `excel-th-001`)
  * `subject`: Môn thi (`word`, `excel`, `powerpoint`)
  * `domain_id`: Mã nhóm kiến thức (ví dụ: `excel-dom-1`)
  * `title`: Tiêu đề câu hỏi
  * `scenario`: Bối cảnh bài thi thực tế
  * `difficulty`: Độ khó (`easy`, `medium`, `hard`)
  * `options`: Mảng JSON chứa các lựa chọn `[{"id": "a", "text": "..."}, ...]`
  * `correct_answer`: Đáp án chuẩn (`a`, `b`, `c`, `d` hoặc lệnh Ribbon)
  * `official_ribbon_path`: Đường dẫn chuẩn trên thanh Ribbon (`Home > Font > Bold`)
  * `explanation`: Lời giải thích chuyên sâu

### 1.3. `exam_sessions` (Phiên Thi Chống Gian Lận & Bộ Đếm Thời Gian Server)
* **Mục đích:** Quản lý trạng thái bài thi đang diễn ra. Chống hack thời gian bằng Server-Side Timer và ghi nhận vết vi phạm Anti-Cheat.
* **Các trường chính:**
  * `id`: Khóa chính phiên thi
  * `session_token`: Token ngẫu nhiên cấp cho client khi bắt đầu làm bài
  * `student_id`: Khóa ngoại trỏ về `user_profiles`
  * `started_at`, `expires_at`: Thời gian bắt đầu và kết thúc do Server ấn định (ví dụ: 50 phút). Hết giờ server tự động đóng phiên và chấm điểm dù học sinh tắt trình duyệt.
  * `assigned_question_ids`: Danh sách ID câu hỏi ngẫu nhiên được Server chọn riêng cho thí sinh này.
  * `violations_count`: Tổng số lần vi phạm (chuyển tab, mất fullscreen, rời khỏi màn hình thi).
  * `anti_cheat_logs`: Mảng nhật ký chi tiết các mốc thời gian vi phạm.
  * `draft_answers`: Bộ nhớ đệm lưu câu trả lời nháp tạm thời (Auto-Save 30 giây/lần), phòng khi mất điện/rớt mạng vẫn khôi phục được.

### 1.4. `exam_results` (Kết Quả Điểm Số & Sổ Điểm Giáo Viên)
* **Mục đích:** Lưu trữ kết quả chính thức sau khi Server chấm điểm theo barem chuẩn Certiport (thang 1000, điểm đạt 700).
* **Các trường chính:**
  * `id`: Khóa chính kết quả
  * `session_id`: Khóa ngoại tham chiếu đến `exam_sessions`
  * `student_id`: Khóa ngoại tham chiếu học viên
  * `assigned_teacher_id`: Khóa ngoại giảng viên nhận báo cáo
  * `score`: Điểm số chuẩn (0 - 1000)
  * `passed`: Trạng thái đạt (`score >= 700`)
  * `time_spent_seconds`: Thời gian hoàn thành thực tế
  * `total_questions`, `correct_count`: Số câu hỏi và số câu làm đúng
  * `domain_scores`: Điểm chi tiết từng kỹ năng (JSON)
  * `wrong_questions`: Danh sách các câu làm sai kèm đối chiếu đáp án học sinh chọn vs đáp án đúng
  * `teacher_feedback`, `teacher_rating`: Nhận xét và đánh giá của giảng viên

### 1.5. `student_question_attempts` (Lịch Sử Từng Câu Hỏi Độc Lập)
* **Mục đích:** Ghi nhận từng lần học sinh trả lời một câu hỏi lý thuyết hoặc thực hành, phục vụ thuật toán phân tích điểm yếu (Weakness Analysis) và biểu đồ kỹ năng (Skill Radar Chart).

---

## 2. FILE ĐỊNH NGHĨA SẴN CÓ TRONG DỰ ÁN

1. **PostgreSQL DDL & Row Level Security:** Được viết chi tiết tại `/schema.sql`.
   - Có đầy đủ các bảng, ràng buộc `CHECK`, `FOREIGN KEY`, `INDEX`, view an toàn `v_student_sanitized_questions`, trigger tự động cập nhật thời gian và chính sách RLS.
2. **MongoDB Native Collection Schema:** Được định nghĩa tại `/mongo_schema.ts`.
   - Có đầy đủ kiểu dữ liệu, JSON Schema Validation và Projection Filter `STUDENT_QUESTION_PROJECTION` bảo vệ đáp án.
3. **TypeScript Database Types:** Được định nghĩa tại `/src/types/db_schema.ts`.
   - Cung cấp type-safety đồng bộ giữa Backend API Express và Client React.

---

## 3. LỘ TRÌNH CHUYỂN ĐỔI (MIGRATION ROADMAP)

1. **Bước 1 (Database Provisioning):** Khởi tạo PostgreSQL hoặc MongoDB instance.
2. **Bước 2 (Data Seeding):** Chạy script nhập liệu từ dữ liệu mẫu vào bảng `questions` và `knowledge_domains` trên server.
3. **Bước 3 (Remove Client Bank):** Xóa các import trực tiếp từ `src/data/` ở Frontend.
4. **Bước 4 (API-Only Consumption):**
   - Học sinh gọi `POST /api/exam/start` -> Server lấy câu hỏi, lọc bỏ `correct_answer`, trả về câu hỏi an toàn.
   - Học sinh gọi `POST /api/exam/submit` -> Server đối chiếu với database và trả về kết quả đã chấm.
