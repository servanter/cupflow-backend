# Cupflow Backend - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables (Optional)
Create a `.env.local` file:
```env
DB_HOST=101.96.207.88
DB_PORT=3306
DB_USER=root
DB_PASSWORD=HONGyan8158
DB_NAME=cupflow
JWT_SECRET=your_admin_secret_key
JWT_USER_SECRET=your_user_secret_key
```

**Note**: Default values are hardcoded in `src/lib/db.ts` if env vars not provided.

### 3. Initialize Database
```bash
npm run db:init
```
This will:
- Create the `cupflow` database
- Create all 13 tables
- Insert default admin account (admin/admin123)

### 4. Start Development Server
```bash
npm run dev
```
Server runs on: `http://localhost:3000`

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📚 Key Files to Know

| File | Purpose |
|------|---------|
| `src/lib/db.ts` | Database connection & query helpers |
| `src/lib/auth.ts` | JWT & password hashing |
| `src/middleware.ts` | CORS & route protection |
| `src/app/api/` | REST API endpoints |
| `src/app/admin/` | Admin dashboard pages |
| `next.config.js` | CORS configuration |

---

## 🔑 Default Credentials

**Admin**:
- Username: `admin`
- Password: `admin123`

---

## 📝 API Usage Examples

### Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Response:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "admin"
  }
}
```

### List Matches
```bash
curl http://localhost:3000/api/matches?status=未开始
```

### User Registration
```bash
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"player123","password":"pass123"}'
```

---

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/          ← REST API endpoints (41 routes)
│   ├── admin/        ← Admin dashboard pages
│   └── layout.tsx    ← Root layout
├── lib/
│   ├── db.ts         ← Database connection
│   ├── auth.ts       ← Authentication utils
│   └── utils.ts      ← CSS utilities
├── components/ui/    ← Reusable UI components
├── scripts/          ← Data initialization scripts
└── middleware.ts     ← CORS & route protection
```

---

## 🔍 Understanding the Architecture

### Request Flow
1. **Request** → Middleware (CORS, route protection)
2. **Route Handler** → Parse request body/params
3. **Auth Check** → Get admin/user from JWT token
4. **Business Logic** → Query database
5. **Response** → Standard JSON format

### Authentication Flow
1. **Login** → POST /api/auth/login (username/password)
2. **Token Generated** → JWT signed with secret key
3. **Token Stored** → Cookie (admin) or client storage (user)
4. **Protected Routes** → Extract token from Authorization header
5. **Token Verified** → Returns user/admin info or null

---

## 🛠️ Common Tasks

### Add a New API Endpoint

1. Create file: `src/app/api/resource/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth"; // if needed

export async function GET(request: NextRequest) {
  try {
    // Get auth if needed
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });

    // Query database
    const data = await query("SELECT * FROM table");
    
    return NextResponse.json({ code: 200, data });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### Create a Database Table
Edit `src/scripts/init-db.ts` and add to the `tables` array:
```typescript
`CREATE TABLE IF NOT EXISTS new_table (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ...
)`
```

### Add Admin Dashboard Page
Create: `src/app/admin/resource/page.tsx`
- Built with React
- Use Radix UI components
- Style with Tailwind CSS

---

## 🐛 Debugging Tips

### Check Environment
```bash
node -e "console.log(process.env)"
```

### Test Database Connection
```bash
npm run db:init
```

### View Logs
Check browser console (Chrome DevTools F12) for client-side errors.
Check terminal for server-side errors.

### Enable Debug Mode
```bash
DEBUG=* npm run dev
```

---

## 🚨 Security Reminders

⚠️ **Before Production**:
1. Move credentials to environment variables
2. Change default admin password
3. Use strong, random JWT secrets
4. Consider enabling CSRF protection
5. Add rate limiting to APIs
6. Enable HTTPS
7. Consider restricting CORS origins

---

## 📚 Documentation

For more details, see:
- **PROJECT_OVERVIEW.md** - Comprehensive architecture overview
- **API_REFERENCE.md** - All API endpoints
- **DATABASE_SCHEMA.md** - Database structure

---

## 🤔 FAQ

**Q: How do I change the database host?**
A: Update env vars or modify `DB_HOST` in `src/lib/db.ts`

**Q: Can I run this without a remote database?**
A: Yes, install MySQL locally and update DB_HOST to `localhost`

**Q: How are user rankings calculated?**
A: Real-time: COUNT users with points > current user's points

**Q: Can comments be anonymous?**
A: Yes, anyone can post with any nickname (no login required)

**Q: How do predictions work?**
A: Users guess match outcome before match starts, points awarded if correct

---

**Last Updated**: 2026-05-18
