# 🚨 数据库表结构不一致问题修复

## 问题诊断

当前 `users` 表初始化脚本只定义了5个字段：
```sql
id, nickname, password, points, created_at
```

但实际业务代码使用了额外的字段，导致下列 API 会出现数据库错误：

| API | 涉及字段 | 文件 | 行号 |
|-----|--------|------|------|
| POST /api/user/wechat-login | openid, avatar_url | src/app/api/user/wechat-login/route.ts | 41, 79 |
| POST /api/user/profile/update | avatar_url | src/app/api/user/profile/update/route.ts | 33 |

---

## 💾 修复方案

### 方案 1: 直接在数据库执行 ALTER TABLE

```sql
-- 连接到数据库
mysql -h 101.96.207.88 -u root -p cupflow

-- 或在 MySQL Workbench 中执行以下 SQL：

-- 添加 openid 字段 (微信登录需要)
ALTER TABLE users ADD COLUMN openid VARCHAR(100) UNIQUE COMMENT '微信openid';

-- 添加 avatar_url 字段 (头像上传需要)
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT '' COMMENT '用户头像URL';

-- 验证修改
DESCRIBE users;
-- 应该看到：
-- | Field      | Type         | Null | Key | Default | Extra           |
-- | id         | int          | NO   | PRI | NULL    | auto_increment  |
-- | nickname   | varchar(50)  | NO   | UNI | NULL    |                 |
-- | password   | varchar(255) | NO   |     | NULL    |                 |
-- | points     | int          | YES  |     | 0       |                 |
-- | created_at | timestamp    | NO   |     | CURRENT_TIMESTAMP |  on update CURRENT_TIMESTAMP |
-- | openid     | varchar(100) | YES  | UNI | NULL    |                 |
-- | avatar_url | varchar(255) | YES  |     |         |                 |
```

### 方案 2: 更新初始化脚本后重建数据库

如果你想永久修复初始化脚本，让新项目部署时自动创建正确的表结构：

**编辑**: `src/scripts/init-db.ts`

将第 98-104 行的 users 表定义改为：

```typescript
`CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户唯一自增ID',
  nickname VARCHAR(50) NOT NULL UNIQUE COMMENT '用户专属昵称',
  password VARCHAR(255) NOT NULL COMMENT '用户密码',
  openid VARCHAR(100) UNIQUE COMMENT '微信openid，用于微信登录',
  avatar_url VARCHAR(255) DEFAULT '' COMMENT '用户头像URL',
  points INT DEFAULT 0 COMMENT '用户竞猜累计积分',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '用户账号注册时间'
) COMMENT='网站前台用户信息表'`,
```

然后重新初始化数据库：
```bash
npx tsx src/scripts/init-db.ts
```

⚠️ **注意**：这会删除所有用户数据，仅在开发环境使用

---

## 🔍 已确认的实际字段需求

### users 表完整字段表

| 字段 | 类型 | 是否必须 | 用途 | 代码位置 |
|------|------|--------|------|---------|
| id | INT | ✅ | 用户唯一ID | init-db.ts 99 |
| nickname | VARCHAR(50) | ✅ | 用户昵称 | init-db.ts 100 |
| password | VARCHAR(255) | ✅ | 密码hash | init-db.ts 101 |
| points | INT | ✅ | 竞猜积分 | init-db.ts 102 |
| created_at | TIMESTAMP | ✅ | 注册时间 | init-db.ts 103 |
| openid | VARCHAR(100) | ❌ | 微信登录标识 | wechat-login 35,67,79 |
| avatar_url | VARCHAR(255) | ❌ | 头像地址 | wechat-login 41,79; profile/update 33 |

---

## 📋 验证修复是否成功

修复后，执行以下测试确保一切正常：

### 1. 验证表结构

```bash
mysql -h 101.96.207.88 -u root -pHONGyan8158 cupflow -e "DESCRIBE users;"
```

应输出：
```
+------------+--------------+------+-----+-------------------+----------------+
| Field      | Type         | Null | Key | Default           | Extra          |
+------------+--------------+------+-----+-------------------+----------------+
| id         | int          | NO   | PRI | NULL              | auto_increment |
| nickname   | varchar(50)  | NO   | UNI | NULL              |                |
| password   | varchar(255) | NO   |     | NULL              |                |
| points     | int          | YES  |     | 0                 |                |
| created_at | timestamp    | NO   |     | CURRENT_TIMESTAMP |                |
| openid     | varchar(100) | YES  | UNI | NULL              |                |
| avatar_url | varchar(255) | YES  |     |                   |                |
+------------+--------------+------+-----+-------------------+----------------+
```

### 2. 测试 wechat-login API

```bash
curl -X POST http://localhost:3000/api/user/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code":"the code is a mock one"}' \
  | jq .
```

应返回 200 且不报错

### 3. 测试 profile/update API

```bash
# 先登录获取 token
TOKEN=$(curl -s -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"nickname":"test","password":"123456"}' \
  | jq -r '.data.token')

# 更新资料
curl -X POST http://localhost:3000/api/user/profile/update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nickname":"new_name","avatarUrl":"https://example.com/avatar.jpg"}' \
  | jq .
```

应返回 200 且不报错

---

## 🔧 可能遇到的问题

### 问题 1: "Unknown column 'openid' in 'ON clause'"

**原因**: wechat-login 代码在 INSERT 语句中使用了 openid，但表中没有这个字段

**解决**:
```sql
ALTER TABLE users ADD COLUMN openid VARCHAR(100) UNIQUE;
```

### 问题 2: "Unknown column 'avatar_url' in 'field list'"

**原因**: profile/update 代码在 UPDATE 语句中使用了 avatar_url，但表中没有这个字段

**解决**:
```sql
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT '';
```

### 问题 3: 修改后 wechat-login 仍然报错

**可能原因**:
1. 连接池缓存问题 - 需要重启 Node.js 服务器
2. 字段名拼写错误（区分大小写）
3. 使用了错误的数据库

**解决**:
```bash
# 重启开发服务器
npm run dev

# 再次验证表结构
mysql -h 101.96.207.88 -u root -pHONGyan8158 cupflow -e "DESCRIBE users;"
```

---

## 📝 完整修复步骤 (推荐)

### 步骤 1: 备份现有用户数据（如有重要数据）

```bash
mysql -h 101.96.207.88 -u root -pHONGyan8158 cupflow \
  -e "SELECT * FROM users;" > users_backup.csv
```

### 步骤 2: 执行 ALTER TABLE

```sql
ALTER TABLE users ADD COLUMN openid VARCHAR(100) UNIQUE COMMENT '微信openid';
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT '' COMMENT '用户头像URL';
```

### 步骤 3: 验证修改

```sql
DESCRIBE users;
```

### 步骤 4: 重启应用服务

```bash
# 停止当前的 npm run dev
# Ctrl+C

# 重新启动
npm run dev
```

### 步骤 5: 测试 API

```bash
# 测试微信登录
curl -X POST http://localhost:3000/api/user/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code":"the code is a mock one"}' \
  | jq .

# 应该返回成功响应
```

---

## ❌ 不应该做的事

❌ **不要删除整个数据库重新初始化** (会丢失所有用户数据)
```bash
# ❌ 不要这样做 (如果已有用户数据)
npx tsx src/scripts/init-db.ts
```

✅ **应该只修改表结构**
```sql
-- ✅ 这样做是安全的 (保留现有数据)
ALTER TABLE users ADD COLUMN openid VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT '';
```

---

## 📌 后续建议

1. **更新初始化脚本** (`src/scripts/init-db.ts`) - 保证新部署时表结构正确

2. **添加迁移文件** - 创建 `src/scripts/migrations/001_add_user_fields.sql`：
   ```sql
   -- Migration: Add openid and avatar_url to users table
   -- Version: 001
   -- Date: 2026-05-20
   
   ALTER TABLE users ADD COLUMN IF NOT EXISTS openid VARCHAR(100) UNIQUE COMMENT '微信openid';
   ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) DEFAULT '' COMMENT '用户头像URL';
   ```

3. **在团队中通知** - 告知其他开发者需要执行此迁移

