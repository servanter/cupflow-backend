import mysql from "mysql2/promise";

async function seedNews() {
  const connection = await mysql.createConnection({
    host: "101.96.207.88",
    port: 3306,
    user: "root",
    password: "HONGyan8158",
    database: "cupflow",
    connectTimeout: 30000,
  });

  console.log("✅ 数据库连接成功");

  // 先建表（如果不存在）
  await connection.query(`
    CREATE TABLE IF NOT EXISTS football_news (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '资讯唯一ID',
      title VARCHAR(200) NOT NULL COMMENT '资讯标题',
      tag VARCHAR(30) NOT NULL COMMENT '标签分类',
      cover_url VARCHAR(500) DEFAULT NULL COMMENT '封面图片链接',
      video_url VARCHAR(500) DEFAULT NULL COMMENT '视频链接',
      summary TEXT COMMENT '简要摘要',
      content TEXT COMMENT '详细内容',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间'
    ) COMMENT='往届足球赛事资讯内容表'
  `);
  console.log("✅ football_news 表创建成功");

  const newsList = [
    {
      title: "2022卡塔尔世界杯决赛：阿根廷点球大战夺冠",
      tag: "经典回顾",
      cover_url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600",
      video_url: "https://www.bilibili.com/video/BV1fD4y1P7Ak",
      summary: "梅西圆梦！阿根廷在卡塔尔世界杯决赛中经过点球大战击败法国，第三次捧起大力神杯。",
      content: "2022年12月18日，卡塔尔卢塞尔球场见证了一场载入史册的世界杯决赛。阿根廷与法国在120分钟内战成3-3平，最终阿根廷在点球大战中以4-2获胜。梅西在比赛中打入两球，姆巴佩上演帽子戏法。这场比赛被广泛认为是世界杯历史上最伟大的决赛之一。梅西终于在35岁的年纪圆了自己的世界杯冠军梦。",
    },
    {
      title: "梅西：从罗萨里奥到世界之巅",
      tag: "球星故事",
      cover_url: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600",
      video_url: "https://www.bilibili.com/video/BV1uG411A7kx",
      summary: "回顾梅西从阿根廷罗萨里奥的少年到世界杯冠军的传奇旅程。",
      content: "里奥内尔·梅西，1987年出生于阿根廷罗萨里奥，13岁时加入巴塞罗那青训营。从2006年首次参加世界杯到2022年终于捧杯，梅西的世界杯之旅走过了漫长的16年。四届世界杯、26场比赛、13粒进球，梅西用自己的方式书写了足球史上最伟大的篇章之一。",
    },
    {
      title: "世界杯历史：从1930到2022的演变",
      tag: "历届盘点",
      cover_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600",
      video_url: "",
      summary: "从首届乌拉圭世界杯到卡塔尔世界杯，回顾92年来世界杯的发展历程。",
      content: "1930年，首届世界杯在乌拉圭举办，仅有13支球队参赛。东道主乌拉圭在决赛中击败阿根廷夺冠。此后世界杯逐渐扩大规模，从16队到24队再到32队。巴西是夺冠次数最多的球队（5次），德国和意大利各4次。2026年世界杯将首次由三国联合举办（美国、加拿大、墨西哥），参赛球队扩大至48队。",
    },
    {
      title: "C罗：五届世界杯的传奇之旅",
      tag: "球星故事",
      cover_url: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=600",
      video_url: "https://www.bilibili.com/video/BV1Ss4y1b7nZ",
      summary: "克里斯蒂亚诺·罗纳尔多五次征战世界杯，从青涩少年到不老传奇。",
      content: "C罗在2006年德国世界杯首次亮相，此后连续参加了2010、2014、2018和2022年世界杯。世界杯赛场上共打入8粒进球。2018年对阵西班牙的帽子戏法是他世界杯生涯的巅峰时刻。如今41岁的他即将在2026年迎来第六次世界杯之旅，这将创造世界杯参赛纪录。",
    },
    {
      title: "2026世界杯扩军至48队：赛制详解",
      tag: "历届盘点",
      cover_url: "https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=600",
      video_url: "",
      summary: "2026年世界杯将采用全新赛制，48支球队分为12个小组进行角逐。",
      content: "2026年美加墨世界杯将成为历史上规模最大的一届。48支球队分为12个小组，每组4队，小组前两名和成绩最好的8个第三名晋级32强淘汰赛。总比赛场次从64场增加到104场，赛期也将延长至近40天。这一变革旨在让更多国家有机会参与世界杯。",
    },
    {
      title: "姆巴佩：法国足球的未来之星",
      tag: "球星故事",
      cover_url: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600",
      video_url: "https://www.bilibili.com/video/BV1hN4y1w7Gt",
      summary: "基利安·姆巴佩如何成为当今足坛最闪耀的新星。",
      content: "姆巴佩在2018年世界杯上一战成名，以19岁的年龄在决赛中破门，帮助法国队夺冠。2022年世界杯决赛他上演帽子戏法，虽然法国队最终点球惜败，但他获得了金靴奖。2024年加盟皇家马德里后，姆巴佩将以更成熟的姿态迎接2026年世界杯的挑战。",
    },
    {
      title: "2014巴西世界杯：德国7-1横扫东道主",
      tag: "经典回顾",
      cover_url: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600",
      video_url: "https://www.bilibili.com/video/BV1xs411Q7cT",
      summary: "世界杯历史上最令人震惊的半决赛，德国在巴西主场7-1大胜东道主。",
      content: "2014年7月8日，米内罗球场见证了世界杯历史上最不可思议的一幕。德国队在半决赛中以7-1横扫东道主巴西。上半场德国在短短6分钟内连入4球，全场巴西球迷泪如雨下。这场比赛也被称为'米内罗惨案'，至今仍是世界杯最经典的比赛之一。最终德国队在决赛中击败阿根廷夺冠。",
    },
    {
      title: "哈兰德能否在世界杯舞台绽放？",
      tag: "转会动态",
      cover_url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600",
      video_url: "",
      summary: "挪威神锋哈兰德首次踏上世界杯赛场，能否延续俱乐部的恐怖进球效率？",
      content: "厄林·哈兰德在曼城的表现令人叹为观止，但他从未在世界杯上亮相。2026年将是挪威时隔28年重返世界杯决赛圈，哈兰德的表现将是最大看点之一。在俱乐部赛事中场均接近1球的进球率能否延续到国家队层面？这是全世界球迷都在期待的答案。",
    },
    {
      title: "战术演变：从catenaccio到tiki-taka",
      tag: "战术解析",
      cover_url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600",
      video_url: "",
      summary: "世界杯历史上最具影响力的战术体系演变。",
      content: "世界杯是战术创新的最大舞台。1960年代意大利的防守反击体系catenaccio统治了欧洲足坛；1970年荷兰全攻全守震撼世界；2010年西班牙的tiki-taka传控打法夺冠，改变了现代足球的方向。2022年摩洛哥的高位逼抢和反击体系也给世界留下深刻印象。2026年世界杯将见证怎样的战术革新？",
    },
    {
      title: "2010南非世界杯：西班牙首夺世界杯",
      tag: "经典回顾",
      cover_url: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=600",
      video_url: "https://www.bilibili.com/video/BV1cW411A7qK",
      summary: "伊涅斯塔加时赛绝杀荷兰，西班牙历史性首夺世界杯冠军。",
      content: "2010年南非世界杯决赛，西班牙与荷兰鏖战至加时赛。第116分钟，伊涅斯塔接法布雷加斯传球，一脚抽射破门，帮助西班牙1-0绝杀荷兰。这支以哈维、伊涅斯塔为核心的西班牙队将tiki-taka传控足球推向了巅峰。西班牙也成为首支在欧洲以外的大陆夺得世界杯的欧洲球队。",
    },
    {
      title: "2018俄罗斯世界杯：法国时隔20年再夺冠",
      tag: "经典回顾",
      cover_url: "https://images.unsplash.com/photo-1530259152377-3a014354da94?w=600",
      video_url: "https://www.bilibili.com/video/BV1G4411V7hT",
      summary: "以姆巴佩为代表的法国新生代力量，帮助高卢雄鸡第二次登顶世界之巅。",
      content: "2018年俄罗斯世界杯，法国队以华丽的阵容和高效的进攻夺冠。决赛4-2击败克罗地亚，姆巴佩成为继贝利之后第二位在世界杯决赛中进球的20岁以下球员。格列兹曼获得金球奖，19岁的姆巴佩获得最佳新秀。这届世界杯也因VAR技术的首次使用而载入史册。",
    },
    {
      title: "世界杯金靴奖历届得主盘点",
      tag: "历届盘点",
      cover_url: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600",
      video_url: "",
      summary: "从方丹的13球纪录到姆巴佩的2022金靴，回顾世界杯射手王的传奇。",
      content: "世界杯金靴奖颁发给每届进球最多的球员。1958年法国球员方丹单届打入13球的纪录至今无人打破。近年来的金靴得主包括：2010年的托马斯·穆勒（5球）、2014年的J·罗德里格斯（6球）、2018年的哈里·凯恩（6球）和2022年的姆巴佩（8球）。2026年谁将成为新的金靴得主？",
    },
  ];

  console.log("⏳ 插入足球资讯数据...");
  for (const news of newsList) {
    await connection.execute(
      "INSERT INTO football_news (title, tag, cover_url, video_url, summary, content) VALUES (?, ?, ?, ?, ?, ?)",
      [news.title, news.tag, news.cover_url, news.video_url, news.summary, news.content]
    );
  }
  console.log(`✅ 已插入 ${newsList.length} 条足球资讯`);

  await connection.end();
  console.log("🎉 足球资讯数据初始化完成！");
}

seedNews().catch((err) => {
  console.error("❌ 数据初始化失败:", err);
  process.exit(1);
});
