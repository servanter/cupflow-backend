# CupFlow 世界杯赛事网站 - 后端

## 技术栈
Next.js 14 + React 18 + Shadcn/ui + Tailwind + MySQL（端口3000）

## 数据库
- 地址: 101.96.207.88:3306
- 库名: cupflow
- 用户: root / HONGyan8158
- 管理员账号: admin / admin123

## 启动命令
```bash
npm run dev

# 数据库初始化（已执行过）
npx tsx src/scripts/init-db.ts
npx tsx src/scripts/seed-data.ts
npx tsx src/scripts/seed-players.ts
npx tsx src/scripts/seed-news.ts
```

## 数据库表
- `teams` - 48支参赛球队（国旗/大洲/教练/历史战绩）
- `players` - 128名核心球员
- `matches_` - 72场小组赛赛程（12组 A-L）**注意带下划线，避免MySQL保留字**
- `live_messages` - 文字直播消息
- `comments` - 用户评论（点赞路径 `/api/comment-like/[id]`，非嵌套）
- `highlights` - 精彩回放（进球/扑救/红牌/点球）
- `football_news` - 足球资讯（标题/标签/封面/视频/摘要/正文）
- `users` - 前台用户
- `match_vote` - 赛事投票
- `user_guess` - 竞猜记录（有唯一索引防重复）
- `champion_predictions` - 冠军预测
- `user_follows` - 用户关注球队
- `admins` - 后台管理员

## API 路由
### 用户端
- `GET /api/teams` - 球队列表
- `GET /api/teams/[id]` - 球队详情
- `GET /api/players/[id]` - 球员详情
- `GET /api/players/top-scorers` - 射手榜
- `GET /api/matches` - 全部赛程
- `GET /api/matches/today` - 最近赛程（从今天起未来5场，跨天）
- `GET /api/matches/[id]` - 比赛详情
- `GET /api/matches/standings` - 积分榜
- `GET /api/highlights` - 精彩回放（支持?type筛选）
- `GET /api/highlights/[id]` - 回放详情
- `GET /api/news` - 足球资讯列表（支持?tag筛选）
- `GET /api/news/[id]` - 资讯详情
- `GET /api/live/[matchId]` - 文字直播
- `GET /api/comments/[matchId]` - 评论列表
- `POST /api/comment-like/[id]` - 评论点赞
- `GET /api/rank` - 积分排行
- `GET /api/guess/[matchId]` - 竞猜投票
- `POST /api/vote/champion` - 冠军预测
- `POST /api/user/login` - 用户登录
- `POST /api/user/register` - 用户注册
- `GET /api/user/profile` - 个人资料
- `GET /api/user/follows` - 关注列表

### 管理端（/api/admin/*）
- 球队/球员/赛事/直播/精彩回放/足球资讯/评论/用户 的增删改查
- 所有管理接口使用 `getAdminFromRequest()` JWT鉴权

## 管理后台页面（/admin）
- 仪表盘/球队/球员/赛事/文字直播/精彩回放/足球资讯/评论/用户管理
- 赛事管理：小组字段为A-L组下拉选择（非手动输入），仅小组赛阶段显示

## 已完成的安全优化
- SQL注入修复（竞猜投票参数化查询）
- 35个API隐藏内部错误信息
- 竞猜唯一索引防重复提交
- 评论分页支持
- 密码强度验证（至少6位）
- .gitignore 保护敏感文件

## 注意事项
- next.config 用 `.js` 格式（14.2.15不支持.ts）
- `.env.local` 在根目录，含DB和JWT配置
- 前端仓库: https://github.com/servanter/cupflow-frontend
