# Cupflow Backend - Comprehensive Project Overview

## 1. PROJECT STRUCTURE & DIRECTORY LAYOUT

```
cupflow-backend/
├── src/
│   ├── app/
│   │   ├── api/                 # REST API endpoints (41 route files)
│   │   │   ├── admin/           # Admin-only endpoints
│   │   │   ├── auth/            # Authentication endpoints (login/logout)
│   │   │   ├── user/            # User endpoints (login, register, profile, follows)
│   │   │   ├── matches/         # Match data endpoints
│   │   │   ├── teams/           # Team data endpoints
│   │   │   ├── players/         # Player data endpoints
│   │   │   ├── news/            # News/article endpoints
│   │   │   ├── highlights/      # Match highlights endpoints
│   │   │   ├── live/            # Live commentary endpoints
│   │   │   ├── comments/        # Comment endpoints
│   │   │   ├── guess/           # User prediction/guessing endpoints
│   │   │   ├── vote/            # Voting endpoints
│   │   │   ├── rank/            # Rankings endpoint
│   │   │   └── comment-like/    # Comment like functionality
│   │   ├── admin/               # Admin dashboard pages
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── matches/
│   │   │   ├── teams/
│   │   │   ├── players/
│   │   │   ├── news/
│   │   │   ├── highlights/
│   │   │   ├── live/
│   │   │   ├── users/
│   │   │   └── comments/
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Home page
│   ├── components/
│   │   └── ui/                  # Reusable UI components (Radix UI based)
│   ├── lib/
│   │   ├── db.ts                # Database connection pool & query functions
│   │   ├── auth.ts              # JWT authentication & password hashing
│   │   └── utils.ts             # CSS utility functions (cn)
│   ├── scripts/
│   │   ├── init-db.ts           # Database initialization script
│   │   ├── seed-data.ts         # Data seeding scripts
│   │   ├── seed-news.ts
│   │   ├── seed-players.ts
│   │   └── update-real-draw.ts
│   └── middleware.ts            # CORS & route protection middleware
├── package.json
├── tsconfig.json
├── next.config.js               # CORS configuration
├── tailwind.config.ts           # TailwindCSS configuration
├── postcss.config.js
└── .gitignore
```

## 2. FRAMEWORK & LANGUAGE STACK

- **Framework**: Next.js 14.2.15 (Full-stack React framework)
- **Language**: TypeScript 5.6.2
- **Runtime**: Node.js
- **Package Manager**: npm

### Key Dependencies:
- **Database**: MySQL (mysql2/promise v3.11.0)
- **Authentication**: JWT (jsonwebtoken v9.0.2), bcryptjs v2.4.3
- **UI Library**: React 18.3.1, Radix UI components
- **Styling**: TailwindCSS 3.4.13
- **Build Tools**: PostCSS, Tailwind Merge, Class Variance Authority

## 3. KEY CONFIGURATION FILES

### next.config.js
- Enables CORS for API endpoints
- Allows requests from any origin (frontend: UniApp)
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization

### tsconfig.json
- Path alias: `@/*` → `./src/*`
- Strict type checking enabled
- DOM libraries included

### Environment Variables (from db.ts)
```
DB_HOST: "101.96.207.88" (default)
DB_PORT: 3306 (default)
DB_USER: "root" (default)
DB_PASSWORD: "HONGyan8158" (default)
DB_NAME: "cupflow" (default)
JWT_SECRET: "cupflow_admin_secret_key_2026"
JWT_USER_SECRET: "cupflow_user_secret_key_2026"
```

## 4. API ENDPOINTS & ROUTING

### Architecture Pattern
- File-based routing using Next.js App Router
- RESTful endpoints following `/api/resource/[id]` pattern
- Dynamic routes using `[paramName]` convention

### Authentication Endpoints
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/auth/login` | Admin login | None |
| POST | `/api/auth/logout` | Admin logout | Admin |
| POST | `/api/user/login` | User login | None |
| POST | `/api/user/register` | User registration | None |

### User Endpoints
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/user/profile` | Get user profile with stats | User |
| GET/POST | `/api/user/follows` | Manage followed teams | User |

### Match Endpoints
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/matches` | List matches (filterable) | None |
| GET | `/api/matches/[id]` | Get match details | None |
| GET | `/api/matches/today` | Get today's matches | None |
| GET | `/api/matches/standings` | Get group standings | None |
| POST | `/api/admin/matches` | Create match | Admin |
| PUT | `/api/admin/matches/[id]` | Update match | Admin |
| DELETE | `/api/admin/matches/[id]` | Delete match | Admin |

### Team Endpoints
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/teams` | List all teams | None |
| GET | `/api/teams/[id]` | Get team details | None |
| POST | `/api/admin/teams` | Create team | Admin |
| PUT | `/api/admin/teams/[id]` | Update team | Admin |
| DELETE | `/api/admin/teams/[id]` | Delete team | Admin |

### Player Endpoints
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/players/top-scorers` | Get top scorers | None |
| GET | `/api/players/[id]` | Get player details | None |
| POST | `/api/admin/players` | Create player | Admin |
| PUT | `/api/admin/players/[id]` | Update player | Admin |
| DELETE | `/api/admin/players/[id]` | Delete player | Admin |

### News/Content Endpoints
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/news` | List articles | None |
| GET | `/api/news/[id]` | Get article details | None |
| POST | `/api/admin/news` | Create article | Admin |
| PUT | `/api/admin/news/[id]` | Update article | Admin |
| DELETE | `/api/admin/news/[id]` | Delete article | Admin |

### Live & Commentary Endpoints
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/live/[matchId]` | Get live messages | None |
| POST | `/api/admin/live` | Create live message | Admin |
| PUT | `/api/admin/live/[id]` | Update live message | Admin |
| DELETE | `/api/admin/live/[id]` | Delete live message | Admin |

### Comment Endpoints
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/comments/[matchId]` | Get match comments | None |
| POST | `/api/comments/[matchId]` | Post comment | None |
| GET/POST | `/api/comment-like/[id]` | Like comment | None |
| GET | `/api/admin/comments` | List all comments | Admin |
| DELETE | `/api/admin/comments/[id]` | Delete comment | Admin |

### Gamification Endpoints
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET/POST | `/api/guess/[matchId]` | Submit/get predictions | User |
| POST | `/api/vote/champion` | Vote for champion | None |
| GET | `/api/rank` | Get user rankings | None |

### Highlights Endpoints
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/highlights` | List match highlights | None |
| GET | `/api/highlights/[id]` | Get highlight details | None |
| POST | `/api/admin/highlights` | Create highlight | Admin |
| PUT | `/api/admin/highlights/[id]` | Update highlight | Admin |
| DELETE | `/api/admin/highlights/[id]` | Delete highlight | Admin |

### Admin Users Endpoint
| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/admin/users` | List users | Admin |
| DELETE | `/api/admin/users/[id]` | Delete user | Admin |

## 5. DATABASE SCHEMA & MODELS

Database: MySQL (utf8mb4)
Character Set: utf8mb4_unicode_ci

### Table: `teams`
```sql
- id: INT (AUTO_INCREMENT) - Team ID
- name: VARCHAR(50) - Team name (Chinese)
- flag_url: VARCHAR(255) - Team flag image URL
- continent: VARCHAR(20) - Continent
- world_cup_appearances: INT - World Cup appearances count
- best_result: VARCHAR(100) - Best historical result
- coach: VARCHAR(50) - Current coach name
```

### Table: `players`
```sql
- id: INT (AUTO_INCREMENT) - Player ID
- name: VARCHAR(50) - Player name
- photo_url: VARCHAR(255) - Player photo URL
- team_id: INT - Foreign key to teams
- birth_date: DATE - Birth date
- height: VARCHAR(10) - Height
- position: VARCHAR(20) - Position (前锋/中场/后卫/门将)
- club: VARCHAR(50) - Current club
- goals: INT (default 0) - Goals in tournament
- assists: INT (default 0) - Assists in tournament
```

### Table: `matches_`
```sql
- id: INT (AUTO_INCREMENT) - Match ID
- home_team_id: INT - Home team FK
- away_team_id: INT - Away team FK
- home_score: INT - Home team score
- away_score: INT - Away team score
- status: VARCHAR(20) - Status (未开始/进行中/已结束)
- match_time: VARCHAR(20) - Match time (HH:MM)
- match_date: DATE - Match date
- stage: VARCHAR(50) - Stage (小组赛/1/8决赛/半决赛/决赛)
- group_name: VARCHAR(10) - Group (A/B/C..., only for group stage)
```

### Table: `live_messages`
```sql
- id: INT (AUTO_INCREMENT) - Message ID
- match_id: INT - FK to matches_
- time: VARCHAR(20) - In-game time
- type: VARCHAR(20) - Type (普通/进球/黄牌/红牌/换人)
- content: TEXT - Message content
- created_at: TIMESTAMP - System time
```

### Table: `comments`
```sql
- id: INT (AUTO_INCREMENT) - Comment ID
- match_id: INT - FK to matches_
- nickname: VARCHAR(50) - Commenter nickname
- content: TEXT - Comment content
- likes: INT - Like count
- created_at: TIMESTAMP - Comment time
```

### Table: `highlights`
```sql
- id: INT (AUTO_INCREMENT) - Highlight ID
- match_id: INT - FK to matches_
- title: VARCHAR(100) - Highlight title
- type: VARCHAR(20) - Type (进球/扑救/红牌/点球)
- occur_time: VARCHAR(20) - In-game time
- description: TEXT - Description
- video_url: VARCHAR(255) - Video link
- created_at: TIMESTAMP - System time
```

### Table: `users`
```sql
- id: INT (AUTO_INCREMENT) - User ID
- nickname: VARCHAR(50) UNIQUE - User nickname
- password: VARCHAR(255) - Hashed password
- points: INT (default 0) - Prediction points
- created_at: TIMESTAMP - Registration time
```

### Table: `match_vote`
```sql
- id: INT (AUTO_INCREMENT) - Vote record ID
- match_id: INT - FK to matches_
- vote_home: INT - Votes for home win
- vote_draw: INT - Votes for draw
- vote_away: INT - Votes for away win
- final_result: VARCHAR(20) - Actual result (主胜/平局/客胜)
```

### Table: `user_guess`
```sql
- id: INT (AUTO_INCREMENT) - Prediction record ID
- match_id: INT - FK to matches_
- user_id: INT - FK to users
- user_choose: VARCHAR(20) - User's prediction (主胜/平局/客胜)
- is_right: TINYINT - Result (1=correct, 0=incorrect, NULL=pending)
- create_time: TIMESTAMP - Submission time
```

### Table: `champion_predictions`
```sql
- id: INT (AUTO_INCREMENT) - Vote record ID
- team_id: INT - FK to teams
- votes: INT - Vote count
```

### Table: `user_follows`
```sql
- id: INT (AUTO_INCREMENT) - Follow record ID
- user_id: INT - FK to users
- team_id: INT - FK to teams
- created_at: TIMESTAMP - Follow time
```

### Table: `admins`
```sql
- id: INT (AUTO_INCREMENT) - Admin ID
- username: VARCHAR(50) UNIQUE - Admin username
- password: VARCHAR(255) - Hashed password
- created_at: TIMESTAMP - Creation time
```

### Table: `football_news`
```sql
- id: INT (AUTO_INCREMENT) - Article ID
- title: VARCHAR(200) - Article title
- tag: VARCHAR(30) - Tag (经典回顾/球星故事/历届盘点/转会动态/战术解析)
- cover_url: VARCHAR(500) - Cover image URL
- video_url: VARCHAR(500) - Video URL
- summary: TEXT - Summary
- content: TEXT - Full content
- created_at: TIMESTAMP - Publication time
```

## 6. AUTHENTICATION & AUTHORIZATION

### Authentication Strategy
- **JWT (JSON Web Tokens)** for stateless authentication
- **Two separate secret keys**: Admin & User tokens
- **bcryptjs**: Password hashing (salt rounds: 10)

### Admin Authentication
```typescript
// Token generation
signAdminToken(payload: { id, username }) 
// Expires in: 24 hours
// Secret: process.env.JWT_SECRET || "cupflow_admin_secret_key_2026"

// Token verification
verifyAdminToken(token: string)
// Returns: { id, username } or null
```

### User Authentication
```typescript
// Token generation
signUserToken(payload: { id, nickname })
// Expires in: 7 days
// Secret: process.env.JWT_USER_SECRET || "cupflow_user_secret_key_2026"

// Token verification
verifyUserToken(token: string)
// Returns: { id, nickname } or null
```

### Token Handling
- **Extraction**: Bearer token from Authorization header
- **Format**: "Authorization: Bearer <token>"
- **Admin Cookie**: Stored as `admin_token` (httpOnly, 24h max age)
- **User Token**: Returned in response, stored client-side

### Authorization Patterns

**Admin-only endpoints**:
- Extract admin from request: `getAdminFromRequest(request)`
- Check if null → return 401
- Example: POST `/api/admin/matches`

**User-required endpoints**:
- Extract user from request: `getUserFromRequest(request)`
- Check if null → return 401
- Example: POST `/api/guess/[matchId]`

**Public endpoints**:
- No authentication required
- Example: GET `/api/matches`

### Middleware Protection
```typescript
// Routes protected by middleware:
- /admin/* (except /admin/login)
- /api/*

// Protection level:
- Checks admin_token cookie existence for /admin routes
- Actual token validation happens in individual API handlers
```

## 7. KEY SERVICES & BUSINESS LOGIC

### 1. **Match Management Service**
- **Filtering**: By status, stage, date
- **Status tracking**: 未开始 (Not started), 进行中 (Ongoing), 已结束 (Ended)
- **Stages**: 小组赛 (Group stage), 1/8决赛, 半决赛 (Semis), 决赛 (Final)
- **Group tracking**: A-H groups for group stage

### 2. **Standings Calculator** (`/api/matches/standings`)
**Logic**:
- Fetches all completed group stage matches
- Calculates points: Win=3, Draw=1, Loss=0
- Tracks: Played, Won, Drawn, Lost, Goals For/Against, Goal Difference
- **Sorting criteria** (per group):
  1. Points (descending)
  2. Goal difference (descending)
  3. Goals scored (descending)

### 3. **Prediction/Guessing System**
**Features**:
- Users predict match outcomes: 主胜/平局/客胜 (Home Win/Draw/Away Win)
- **Constraints**: Only before match starts
- **One submission per user per match**
- **Automatic vote tracking**: Updates match_vote table
- **Result settlement**: is_right field (NULL → 1/0 after match)
- **Points system**: Awards points to correct predictions

### 4. **User Profile & Rankings**
- **Real-time ranking**: Calculated by comparing user points
- **Profile includes**:
  - User stats (nickname, points, registration date)
  - Current rank (calculated, not stored)
  - Prediction history (with match details)
  - Followed teams
- **Joined tables**: Matches 3 tables to fetch complete prediction data

### 5. **Live Commentary System**
- **Types**: 普通/进球/黄牌/红牌/换人 (Normal/Goal/Yellow/Red/Substitution)
- **Storage**: Match ID, game time, content, system timestamp
- **Admin control**: CRUD operations

### 6. **News/Content Management**
- **Tags**: 经典回顾/球星故事/历届盘点/转会动态/战术解析
- **Fields**: Title, tag, cover image, video link, summary, full content
- **Admin controlled**: Full CRUD

### 7. **Gamification Features**
- **Champion Voting**: Vote for predicted world cup winner
- **Comment System**: Match-specific comments with likes
- **User Points**: Earned from correct predictions
- **Follow System**: Follow favorite teams

### 8. **Comment Interaction**
- **Features**: Post anonymous comments, like comments
- **Match-scoped**: Comments tied to specific matches
- **Admin moderation**: Delete inappropriate comments

## 8. NOTABLE PATTERNS & CONVENTIONS

### Code Patterns

1. **API Response Format** (Standard across all endpoints)
```typescript
{
  code: 200,        // HTTP-like status code
  message?: string, // Optional message
  data?: any        // Response data
}
```

2. **Error Handling**
- Try-catch in all API routes
- Consistent error responses: `{ code: 500, message: "服务器内部错误" }`
- Specific error messages for business logic failures
- HTTP status codes: 400 (bad req), 401 (unauth), 404 (not found), 500 (server)

3. **Database Query Pattern**
```typescript
// Generic typed queries
const result = await query<T>(sql, params);

// Generic execute for mutations
const result = await execute(sql, params);
```

4. **Route Protection Pattern**
```typescript
// Admin routes
const admin = getAdminFromRequest(request);
if (!admin) return NextResponse.json({ code: 401, ... }, { status: 401 });

// User routes
const user = getUserFromRequest(request);
if (!user) return NextResponse.json({ code: 401, ... }, { status: 401 });
```

5. **Dynamic Routes**
- Single files handle multiple resource IDs
- Parameters extracted from `params` prop
- Example: `src/app/api/matches/[id]/route.ts`

### Naming Conventions

- **Chinese comments**: All code comments in Chinese (Chinese project)
- **Table naming**: Plural lowercase (teams, players, matches_)
- **Field naming**: Snake_case (match_date, home_team_id)
- **Database names**: lowercase (cupflow)
- **API naming**: English paths (/api/matches, /api/user/profile)

### Project Metadata
- **Version**: 1.0.0
- **Language**: Chinese (comments, user-facing text)
- **Encoding**: UTF-8 with Unicode collation
- **Default Admin**: username=admin, password=admin123 (created at init)

### CSS & UI Patterns
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Headless component library for dialogs, dropdowns, tabs, etc.
- **Component structure**: UI components in `src/components/ui/`
- **Admin dashboard**: Built with Next.js pages in `src/app/admin/`

### Frontend Considerations
- **CORS enabled**: Allows UniApp frontend (mobile app)
- **Access-Control headers**: Set globally in next.config.js
- **Client-side route protection**: Based on cookie presence (actual validation server-side)

## 9. DEPLOYMENT & RUNNING

### Scripts
```bash
npm run dev      # Development server (hot reload)
npm run build    # Production build
npm start        # Production server
npm run lint     # ESLint
npm run db:init  # Initialize database
```

### Database Initialization
```bash
npx tsx src/scripts/init-db.ts
# Creates: Database, all tables, default admin account
```

### Port & Connection
- **Default port**: 3000 (Next.js)
- **Database**: Remote MySQL @ 101.96.207.88:3306
- **CORS**: All origins allowed

## 10. SECURITY OBSERVATIONS

⚠️ **Security Notes**:
1. **Credentials in code**: Database credentials hardcoded in db.ts (should use env vars)
2. **Weak defaults**: Secret keys are predictable strings (should be random)
3. **Admin token in cookie**: May be vulnerable to CSRF (no CSRF tokens visible)
4. **CORS wide open**: All origins allowed (consider restricting)
5. **No rate limiting**: APIs vulnerable to brute force
6. **No input validation framework**: SQL injection risk if queries not properly parameterized (appears safe with parameterized queries used)
7. **Timestamps only on server**: Could be manipulated

## 11. KEY FEATURES SUMMARY

✅ **Core Features**:
- World Cup match tracking with live scores
- Group standings calculations
- User predictions/guesses with points system
- User rankings based on prediction accuracy
- Live match commentary
- Match highlights/video compilation
- News/articles with categories
- User authentication & profiles
- Follow favorite teams
- Comment on matches
- Vote for predicted champion
- Admin dashboard for content management
- Admin authentication with JWT

---

**Total Files**: 67 TypeScript files
**Total API Routes**: 41 endpoint files
**Database Tables**: 12 main tables
**Language**: TypeScript/JavaScript
**Framework**: Next.js 14 + React 18
**UI Library**: Radix UI + TailwindCSS
