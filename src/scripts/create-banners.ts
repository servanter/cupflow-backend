import { execute, query } from "@/lib/db";

async function createBannersTable() {
  console.log("创建 banners 表...");

  await execute(`
    CREATE TABLE IF NOT EXISTS banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(100) DEFAULT '',
      image_url VARCHAR(500) NOT NULL,
      link_url VARCHAR(500) DEFAULT '',
      sort_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✅ banners 表创建成功");

  // 检查是否已有数据
  const rows: any = await query("SELECT COUNT(*) as cnt FROM banners");
  if (rows[0].cnt > 0) {
    console.log("已有数据，跳过种子插入");
    process.exit(0);
  }

  console.log("插入默认 Banner...");
  const defaultBanners = [
    {
      title: "2026 FIFA 世界杯",
      image_url: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=750&q=80",
      link_url: "/pages/schedule/index",
      sort_order: 1,
    },
    {
      title: "精彩进球回放",
      image_url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=750&q=80",
      link_url: "/pages/highlights/index",
      sort_order: 2,
    },
    {
      title: "冠军竞猜开启",
      image_url: "https://images.unsplash.com/photo-1551854838-212c9a8e7af0?w=750&q=80",
      link_url: "/pages/champion/index",
      sort_order: 3,
    },
    {
      title: "球队资讯速递",
      image_url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=750&q=80",
      link_url: "/pages/news/index",
      sort_order: 4,
    },
  ];

  for (const b of defaultBanners) {
    await execute(
      "INSERT INTO banners (title, image_url, link_url, sort_order, is_active) VALUES (?, ?, ?, ?, 1)",
      [b.title, b.image_url, b.link_url, b.sort_order]
    );
    console.log(`  ✅ ${b.title}`);
  }

  console.log("🎉 完成！");
  process.exit(0);
}

createBannersTable().catch((e) => {
  console.error(e);
  process.exit(1);
});
