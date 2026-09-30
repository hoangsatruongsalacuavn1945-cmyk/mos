# MOS Master - Nền Tảng Luyện Thi & Khảo Thí MOS Chuẩn Certiport Quốc Tế

Hệ thống luyện thi và khảo thí chứng chỉ tin học văn phòng quốc tế **Microsoft Office Specialist (MOS Word, Excel, PowerPoint)** với công nghệ phòng thi ảo, giám sát chống gian lận (Anti-Cheat) theo thời gian thực và trợ lý gia sư trí tuệ nhân tạo (AI Tutor).

---

## 🏛️ Kiến Trúc Hệ Thống (Architecture Overview)

```
├── client (src/)
│   ├── components/       # Giao diện thi (QuizEngine, ExamRoom, Dashboard, AuthModal, OwnerPortal)
│   ├── pages/            # Tuyến trang (StudentRegister, UserManagement, AuditLogs, SystemConfig)
│   ├── routes/           # Bảo vệ phân quyền truy cập theo vai trò (ProtectedRoute)
│   └── utils/            # Quản lý trạng thái Zustand (userStore, themeStore, languageStore)
├── server/
│   ├── config/           # Cấu hình bảo mật JWT, Winston Logger, Database connection
│   ├── constants/        # Prompt AI tập trung (aiPrompts.ts)
│   ├── middleware/       # Xử lý lỗi tập trung (errorHandler.ts), AI Rate Limiter, Auth Middleware
│   ├── models/           # Mô hình dữ liệu người dùng (User.ts)
│   ├── routes/           # Tuyến API chuyên biệt (aiRoutes.ts, adminRoutes.ts, auth.js)
│   ├── services/         # Dịch vụ hàng đợi chấm bài nền (fileGraderQueue.ts), AI Fallback, UserService
│   └── types/            # Mô hình dữ liệu chuyên sâu (dataModels.ts)
└── server.ts             # Entrypoint máy chủ tích hợp Express & Vite Middleware
```

---

## 🔒 Tính Năng Bảo Mật & Xác Thực (Security Hardening)

1. **Authoritative Server Grading**:
   - Máy chủ giữ quyền quyết định tuyệt đối trong việc chấm điểm và xác định đáp án đúng.
   - Các trường nhạy cảm như `correctAnswer`, `explanation`, `officialRibbonPath` bị loại bỏ hoàn toàn khỏi API trước khi gửi xuống client cho học sinh.
2. **Giám Sát Chống Gian Lận Độc Quyền (Anti-Cheat Engine)**:
   - Theo dõi sự kiện chuyển tab (`blur`), mở DevTools (`resize`), phím tắt sao chép và chụp màn hình.
   - Điểm vi phạm `violationsCount` và `antiCheatLogs` được ghi nhận trên máy chủ; client không thể giả mạo hoặc ghi đè.
3. **Mã Hóa & Quản Lý Phiên**:
   - Mật khẩu mã hóa 100% bằng muối bcrypt (`bcrypt.hash`), không lưu trữ bất kỳ mật khẩu plaintext nào.
   - Thống nhất cơ chế xác thực JWT với thời hạn an toàn, blacklist thu hồi token khi người dùng đăng xuất (`/api/auth/logout`).
   - Khóa tài khoản tự động trong 30 phút khi nhập sai mật khẩu 5 lần liên tiếp.
4. **Ghi Log Tập Trung & Tránh Lộ Dữ Liệu**:
   - Mỗi yêu cầu được cấp một mã truy vết `requestId` (`X-Request-Id`).
   - Middleware xử lý lỗi tập trung ngăn chặn rò rỉ stack trace ra phía client, chỉ ghi chi tiết vào logger nội bộ `winston`.

---

## 🚀 Cài Đặt & Chạy Ứng Dụng (Quick Start)

### Yêu Cầu Môi Trường
- **Node.js**: >= 20.x
- **NPM**: >= 10.x

### Các Lệnh Thực Thi
```bash
# Cài đặt toàn bộ thư viện phụ thuộc
npm install

# Khởi động máy chủ phát triển (Full-stack Express + Vite)
npm run dev

# Kiểm tra cú pháp và kiểu dữ liệu (TypeScript)
npm run lint

# Đóng gói sản phẩm biên dịch cho môi trường Production
npm run build

# Khởi động phiên bản Production
npm start
```

---

## 📡 Danh Mục Tuyến API Chính (Core REST Endpoints)

| Phương Thức | Tuyến Đường (Endpoint) | Quyền Hạn | Mô Tả |
|-------------|-----------------------|-----------|-------|
| `GET` | `/api/health` | Public | Kiểm tra trạng thái hệ thống, bộ nhớ, cơ sở dữ liệu và AI |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản học viên (có validate mật khẩu & email) |
| `POST` | `/api/auth/login` | Public | Đăng nhập tài khoản & nhận JWT token |
| `POST` | `/api/auth/logout` | Authenticated | Đăng xuất và thu hồi token vào blacklist |
| `POST` | `/api/exam/start` | Student / Guest | Bắt đầu ca thi với bộ câu hỏi đã làm sạch đáp án |
| `POST` | `/api/exam/violation` | Student | Ghi nhận sự kiện vi phạm chống gian lận |
| `POST` | `/api/exam/submit` | Student | Nộp bài và chấm điểm chính thức chuẩn Certiport 0-1000 |
| `POST` | `/api/gemini/chat` | Authenticated | Hỏi đáp trực tiếp cùng trợ lý gia sư MOS Master AI |

*Tài liệu OpenAPI 3.0 chi tiết được lưu trữ tại `docs/openapi.json`.*
