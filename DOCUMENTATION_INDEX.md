# Cupflow Backend - Documentation Index

Welcome to the Cupflow Backend documentation! This index will help you navigate all available resources.

---

## 📚 Documentation Files

### 1. **QUICK_START.md** ⭐ START HERE
**Size**: 5.5 KB | **5 min read**

For developers who want to get up and running quickly:
- Installation & setup steps
- Running the development server
- Default credentials
- API usage examples
- Common tasks and debugging tips
- FAQ section

👉 **Read this first** if you're new to the project.

---

### 2. **PROJECT_OVERVIEW.md** 📖 COMPREHENSIVE GUIDE
**Size**: 20 KB | **20 min read**

Complete deep-dive into the project architecture:
- Full directory structure
- Technology stack breakdown
- Configuration files explained
- All 41 API endpoints documented
- Complete database schema (13 tables)
- Authentication & authorization patterns
- Business logic & services explanation
- Code patterns & conventions
- Security observations
- Deployment instructions

👉 **Read this** when you need complete understanding of the project.

---

### 3. **API_REFERENCE.md** 🔌 QUICK LOOKUP
**Size**: 6.2 KB | **8 min read**

Quick reference for all API operations:
- Organized by feature (Auth, Matches, Teams, Players, etc.)
- All 41 endpoints with:
  - HTTP method & path
  - Request body format
  - Response structure
  - Auth requirements
- Response codes & formats
- Default test credentials
- Common query parameters

👉 **Use this** when making API calls or integrating endpoints.

---

### 4. **DATABASE_SCHEMA.md** 🗄️ DATA MODEL
**Size**: 9.2 KB | **12 min read**

Detailed database documentation:
- All 13 table structures with fields
- Table relationships diagram
- Field data types & constraints
- Sample data examples
- Query patterns for common operations
- Unique constraints & indexes
- Performance recommendations
- Backup considerations

👉 **Use this** when working with data or writing queries.

---

## 🎯 Quick Navigation by Task

### "I'm new to this project"
1. Read **QUICK_START.md** (5 min)
2. Read **PROJECT_OVERVIEW.md** (20 min)
3. Explore the codebase
4. Reference **API_REFERENCE.md** when needed

### "I need to build a new API endpoint"
1. Check **API_REFERENCE.md** for similar endpoints
2. Review **PROJECT_OVERVIEW.md** → Section 8 (Code Patterns)
3. Look at **DATABASE_SCHEMA.md** for data model
4. Use **QUICK_START.md** → "Add a New API Endpoint"

### "I need to query the database"
1. Check **DATABASE_SCHEMA.md** for table structures
2. Review query patterns section
3. Look at existing API endpoints in `src/app/api/`
4. Reference **PROJECT_OVERVIEW.md** for business logic

### "I need to understand authentication"
1. Read **PROJECT_OVERVIEW.md** → Section 6 (Auth)
2. Check `src/lib/auth.ts` source code
3. Review **API_REFERENCE.md** → Authentication APIs section
4. Look at example endpoints in `src/app/api/admin/`

### "I need to set up the project locally"
1. Follow **QUICK_START.md** → "Getting Started"
2. Check environment variables section
3. Run database initialization
4. Start development server

### "I need to add a new database table"
1. Review **DATABASE_SCHEMA.md** for existing schema
2. Edit `src/scripts/init-db.ts`
3. Follow the existing pattern
4. Run `npm run db:init`

---

## 📊 Project Statistics at a Glance

| Metric | Value |
|--------|-------|
| **Framework** | Next.js 14.2.15 |
| **Language** | TypeScript 5.6.2 |
| **Database** | MySQL (Remote) |
| **Total Files** | 67 TypeScript files |
| **API Endpoints** | 41 routes |
| **Database Tables** | 13 tables |
| **Lines of API Code** | 1,184+ |
| **Dependencies** | 38 packages |

---

## 🔑 Key Endpoints by Category

### Authentication (4 endpoints)
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `POST /api/user/login` - User login
- `POST /api/user/register` - User registration

### Matches (7 endpoints)
- `GET /api/matches` - List matches
- `GET /api/matches/[id]` - Match details
- `GET /api/matches/today` - Today's matches
- `GET /api/matches/standings` - Group standings
- `POST /api/admin/matches` - Create match
- `PUT /api/admin/matches/[id]` - Update match
- `DELETE /api/admin/matches/[id]` - Delete match

### User Features (5 endpoints)
- `GET /api/user/profile` - User profile
- `GET/POST /api/user/follows` - Manage follows
- `GET /api/rank` - Rankings
- + more in API_REFERENCE.md

### Gamification (3 endpoints)
- `GET/POST /api/guess/[matchId]` - Predictions
- `POST /api/vote/champion` - Champion voting
- `GET /api/rank` - User rankings

---

## 🛠️ Development Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MySQL database access

### Quick Setup
```bash
# 1. Install dependencies
npm install

# 2. Initialize database
npm run db:init

# 3. Start development server
npm run dev

# 4. Access application
# http://localhost:3000
# Admin: admin / admin123
```

For detailed setup, see **QUICK_START.md**.

---

## 🔐 Security at a Glance

### What's Secure ✅
- Parameterized SQL queries (SQL injection protected)
- Password hashing with bcryptjs
- JWT token validation
- CORS enabled for frontend

### What Needs Attention ⚠️
- Credentials in code (move to env vars)
- Default JWT secrets (randomize)
- CORS wide open (restrict origins)
- No rate limiting (add)
- No CSRF protection (consider adding)

See **PROJECT_OVERVIEW.md** → Section 10 for details.

---

## 📖 File Structure Reference

```
cupflow-backend/
├── 📄 QUICK_START.md              ← Start here
├── 📄 PROJECT_OVERVIEW.md         ← Deep dive
├── 📄 API_REFERENCE.md            ← API lookup
├── 📄 DATABASE_SCHEMA.md          ← Data model
├── 📄 DOCUMENTATION_INDEX.md      ← You are here
│
├── src/
│   ├── app/
│   │   ├── api/                   ← 41 API routes
│   │   ├── admin/                 ← Admin dashboard
│   │   ├── layout.tsx             ← Root layout
│   │   └── page.tsx               ← Home page
│   │
│   ├── lib/
│   │   ├── db.ts                  ← Database layer
│   │   ├── auth.ts                ← Auth utilities
│   │   └── utils.ts               ← CSS utilities
│   │
│   ├── components/ui/             ← Reusable components
│   ├── scripts/                   ← Data scripts
│   └── middleware.ts              ← CORS & protection
│
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── postcss.config.js
```

---

## 🎓 Learning Path

### Beginner
1. Read **QUICK_START.md**
2. Run the project locally
3. Test some API endpoints using Postman/curl
4. Explore the admin dashboard

### Intermediate
1. Read **PROJECT_OVERVIEW.md**
2. Read **DATABASE_SCHEMA.md**
3. Review existing API endpoints
4. Try modifying an existing endpoint

### Advanced
1. Read **API_REFERENCE.md** for all endpoints
2. Study the authentication system
3. Implement a new API feature
4. Optimize database queries

---

## 🆘 Troubleshooting

### "I can't connect to the database"
- Check **DATABASE_SCHEMA.md** for connection details
- Verify database credentials in `src/lib/db.ts`
- See **QUICK_START.md** → Debugging section

### "I don't understand the API response format"
- See **API_REFERENCE.md** → Response Codes & Format
- Check **PROJECT_OVERVIEW.md** → Section 8 (Code Patterns)

### "How do I add a new endpoint?"
- See **QUICK_START.md** → Common Tasks
- Review similar endpoints in `src/app/api/`
- Check **PROJECT_OVERVIEW.md** → Section 4

### "The authentication isn't working"
- See **PROJECT_OVERVIEW.md** → Section 6
- Check **API_REFERENCE.md** → Authentication APIs
- Review `src/lib/auth.ts` source code

---

## 📞 Quick Reference

### Default Credentials
- **Admin Username**: `admin`
- **Admin Password**: `admin123`

### Important URLs
- **API Base**: `http://localhost:3000/api`
- **Database**: `101.96.207.88:3306`
- **Admin Dashboard**: `http://localhost:3000/admin`

### Important Files
- Database config: `src/lib/db.ts`
- Auth config: `src/lib/auth.ts`
- CORS config: `next.config.js`
- Database init: `src/scripts/init-db.ts`

---

## 🔍 Documentation Search

**Looking for information about:**

- **Match management?** → API_REFERENCE.md, Match Endpoints
- **User authentication?** → PROJECT_OVERVIEW.md Section 6
- **Database structure?** → DATABASE_SCHEMA.md
- **How to get started?** → QUICK_START.md
- **Complete architecture?** → PROJECT_OVERVIEW.md
- **All API endpoints?** → API_REFERENCE.md
- **Specific table structure?** → DATABASE_SCHEMA.md

---

## 📝 Documentation Version

- **Created**: 2026-05-18
- **Project Version**: 1.0.0
- **Framework**: Next.js 14.2.15
- **Updated for**: Latest codebase

---

## 💡 Tips for Success

1. **Keep these docs nearby** - Reference them frequently
2. **Read in order** - QUICK_START → PROJECT_OVERVIEW → Specific docs
3. **Check the code** - Documentation + source code = best understanding
4. **Run the project** - Hands-on experience is invaluable
5. **Ask questions** - Document your findings for team

---

**🎉 Ready to start? Begin with QUICK_START.md!**

---

*Last Updated: 2026-05-18*
