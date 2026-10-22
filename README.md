# MES Survey System

Hệ thống quản lý, thiết kế và thu thập ý kiến khảo sát nội bộ (Survey Management Platform).

---

## 📑 Mục Lục
1. [Công nghệ sử dụng](#1-công-nghệ-sử-dụng)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Chạy môi trường Development](#3-chạy-môi-trường-development)
4. [Hướng dẫn triển khai Production (Nội bộ HTTP)](#4-hướng-dẫn-triển-khai-production-nội-bộ-http)
   - [4.1 Cấu hình biến môi trường (`backend/.env`)](#41-cấu-hình-biến-môi-trường-backendenv)
   - [4.2 Cấu hình OIDC / SSO Callback](#42-cấu-hình-oidc--sso-callback)
   - [4.3 Build Frontend](#43-build-frontend)
   - [4.4 File cấu hình Nginx hoàn chỉnh](#44-file-cấu-hình-nginx-hoàn-chỉnh)
   - [4.5 Chạy Backend với PM2](#45-chạy-backend-với-pm2)
5. [Tính năng phân quyền & Quản trị](#5-tính-năng-phân-quyền--quản-trị)

---

## 1. Công nghệ sử dụng

- **Frontend**:
  - Vue 3 (Composition API) + Vite
  - Pinia (Quản lý State) + Vue Router 4 (HTML5 Web History)
  - Vue I18n (Đa ngôn ngữ Tiếng Việt - Tiếng Anh)
  - SurveyJS Core, SurveyJS Creator, SurveyJS Dashboard
  - Lucide Vue Next (Bộ icon chuẩn)
  - Vanilla CSS (Glassmorphism, Dark/Light theme tokens, Responsive)
- **Backend**:
  - Node.js + Express
  - Passport.js (Google OIDC & WSO2 / SDV SSO)
  - Session Store: SQLite (`connect-sqlite3`), cookie xác thực
  - Database: SQLite (`node:sqlite` tích hợp sẵn trong Node.js), migrate và seed dữ liệu tự động

---

## 2. Cấu trúc thư mục

```text
survey-pjt/
├── backend/
│   ├── config/          # Cấu hình OIDC (Google, SDV/WSO2)
│   ├── data/            # Thư mục chứa survey.db & sessions.db
│   ├── db/              # Schema SQLite & seed dữ liệu khởi tạo
│   ├── middleware/      # Auth, Role-based guard, Error handlers
│   ├── models/          # User, Survey, Response, Department
│   ├── routes/          # API Auth, Surveys, Responses, Admin
│   ├── server.js        # Khởi chạy Express server
│   ├── .env.example     # File mẫu cấu hình biến môi trường
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # AppShell, Topbar, Sidebar, Dialogs
│   │   ├── i18n/        # Từ điển song ngữ VI / EN
│   │   ├── lib/         # Axios instance, utils định dạng ngày giờ
│   │   ├── pages/       # Home, TakeSurvey, Login, Admin Dashboard/Surveys/Users
│   │   ├── router/      # Vue Router config (Prefix: /survey)
│   │   └── stores/      # Auth & Survey Pinia stores
│   ├── vite.config.js   # Cấu hình Vite & API Proxy
│   └── package.json
└── README.md
```

---

## 3. Chạy môi trường Development

### Bước 1: Khởi động Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
# Backend chạy tại http://localhost:3000
```

### Bước 2: Khởi động Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend chạy tại http://localhost:5173
```
Truy cập: `http://localhost:5173/survey`

---

## 4. Hướng dẫn triển khai Production (Nội bộ HTTP)

Khi triển khai trên máy chủ nội bộ qua domain (ví dụ `http://mydomain.com/survey` hoặc `http://10.x.x.x/survey`) qua cổng **80**:

### 4.1 Cấu hình biến môi trường (`backend/.env`)

Tạo hoặc chỉnh sửa file `backend/.env`:

```ini
# Server & Environment
PORT=3000
NODE_ENV=production
SESSION_SECRET=nhap-mot-chuoi-bi-mat-ngau-nhien-dai-tai-day

# URL gốc của Frontend khi người dùng truy cập từ trình duyệt (Cổng 80 không cần ghi port)
FRONTEND_URL=http://mydomain.com

# BẮT BUỘC KHI CHẠY HTTP NỘI BỘ (Không có SSL):
# Đặt false để trình duyệt không chặn session cookie qua kết nối HTTP
COOKIE_SECURE=false

# Demo Login: true nếu muốn hiển thị nút login nhanh tài khoản mẫu; false khi tắt
ENABLE_DEMO_LOGIN=false

# OIDC Providers Toggle (true: bật; false: tắt)
ENABLE_GOOGLE_AUTH=true
ENABLE_SDV_AUTH=true

# Google OIDC Callback (Trỏ qua cổng 80 domain công khai, KHÔNG ghi port 3000)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://mydomain.com/api/auth/google/callback

# SDV / WSO2 OIDC Callback
OIDC_PROVIDER_NAME=SDV SSO
OIDC_DOMAIN=https://identity.yourcompany.com
OIDC_CLIENT_ID=your-oidc-client-id
OIDC_CLIENT_SECRET=your-oidc-client-secret
OIDC_CALLBACK_URL=http://mydomain.com/api/auth/sdv/callback

# Database & Admin
DB_PATH=./data/survey.db
ADMIN_EMAILS=admin@yourcompany.com
```

---

### 4.2 Cấu hình OIDC / SSO Callback

Khi cấu hình trên **Google Cloud Console** hoặc **WSO2 Identity Server**:
- **Không dùng cổng 3000 trong callback URL** vì toàn bộ traffic của người dùng đi qua Nginx cổng 80.
- **Authorized Redirect URIs**:
  - Google: `http://mydomain.com/api/auth/google/callback`
  - WSO2 / SDV: `http://mydomain.com/api/auth/sdv/callback`
- **Authorized JavaScript origins**:
  - `http://mydomain.com`

---

### 4.3 Build Frontend

Trên máy chủ hoặc máy build:
```bash
cd frontend
npm install
npm run build
```
Lệnh này sẽ sinh ra thư mục `frontend/dist/` chứa toàn bộ mã nguồn tĩnh đã được bundle và tối ưu.

---

### 4.4 File cấu hình Nginx hoàn chỉnh

Tạo file cấu hình trong Nginx (ví dụ: `/etc/nginx/conf.d/survey.conf` hoặc `/etc/nginx/sites-available/survey`):

#### Cách 1: Nginx phục vụ trực tiếp thư mục `frontend/dist` (Khuyên dùng - Hiệu năng cao nhất)

```nginx
server {
    listen 80;
    server_name mydomain.com; # Hoặc IP nội bộ: 192.168.x.x

    # Gzip nén dữ liệu giúp tải trang siêu nhanh
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 1. Định tuyến cho toàn bộ giao diện khảo sát /survey
    location /survey {
        alias /path/to/survey-pjt/frontend/dist;
        index index.html;
        try_files $uri $uri/ /survey/index.html;
    }

    # 2. Phục vụ các file assets (js, css, images, fonts)
    location /assets {
        alias /path/to/survey-pjt/frontend/dist/assets;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # 3. Phục vụ logo và favicon nếu có
    location /logo.svg {
        alias /path/to/survey-pjt/frontend/dist/logo.svg;
    }

    # 4. Proxy toàn bộ API & OIDC Callback về Express backend (Port 3000)
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # Truyền đúng thông tin Host, IP thật của Client và Protocol
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Hỗ trợ upload schema khảo sát lớn
        client_max_body_size 20M;
    }

    # Tùy chọn: Chuyển hướng trang chủ / về /survey
    location = / {
        return 301 http://$host/survey;
    }
}
```

#### Cách 2: Nếu bạn dùng Nginx Proxy ngược tới cả 2 cổng chạy ngầm (Vite 5173 và Node 3000)

```nginx
server {
    listen 80;
    server_name mydomain.com;

    # Proxy giao diện sang Vite dev/preview server
    location /survey {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Proxy API sang Backend Node.js
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Kiểm tra cú pháp và khởi động lại Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### 4.5 Chạy Backend với PM2

Để Backend Express luôn chạy ngầm và tự khởi động lại khi reboot máy chủ:

```bash
cd backend
npm install -g pm2
pm2 start server.js --name "survey-backend"
pm2 save
pm2 startup
```

Xem log backend:
```bash
pm2 logs survey-backend
```

---

## 5. Tính năng phân quyền & Quản trị

Hệ thống hỗ trợ 4 cấp độ quyền hạn (Role-based Access Control):
1. **Super Admin**: Quản trị toàn hệ thống, gán quyền cho người dùng, quản lý danh mục phòng ban.
2. **Admin**: Tạo, sửa, đóng/mở khảo sát, xem kết quả và xuất báo cáo.
3. **Manager**: Quản lý và xem kết quả khảo sát thuộc phạm vi các phòng ban được giao.
4. **User**: Tham gia trả lời các khảo sát đang mở theo phòng ban của mình, xem lại câu trả lời đã gửi.

---

## 6. Hỗ trợ & Khắc phục sự cố thường gặp (Troubleshooting)

- **Lỗi sau khi đăng nhập OIDC bị văng ra lại trang login**:
  - *Nguyên nhân*: Do biến `COOKIE_SECURE=true` khi chạy HTTP.
  - *Khắc phục*: Đặt `COOKIE_SECURE=false` trong `backend/.env` và khởi động lại backend.
- **Lỗi `404 Not Found` khi F5 (reload) lại trang con**:
  - *Nguyên nhân*: Nginx chưa cấu hình `try_files $uri $uri/ /survey/index.html;`.
  - *Khắc phục*: Kiểm tra lại block `location /survey` trong file Nginx.
