import { query } from "../lib/db";

async function updateNewsContent() {
  const richNews = [
    {
      id: 1,
      content: `2022年12月18日，卡塔尔卢塞尔球场见证了一场载入史册的世界杯决赛。阿根廷与法国在120分钟内战成3-3平，最终阿根廷在点球大战中以4-2获胜。

[img]https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80[/img]

梅西在比赛中打入两球，包括一粒精彩的点球和一粒近射，全场贡献了无可挑剔的表现。姆巴佩则上演帽子戏法，其中包括一粒世界波，几乎独自将法国从绝境中拯救出来。

[img]https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80[/img]

这场比赛被广泛认为是世界杯历史上最伟大的决赛之一。赛后，泪流满面的梅西高举金杯，终于在35岁的年纪圆了自己的世界杯冠军梦。整个阿根廷陷入狂欢，布宜诺斯艾利斯街头百万球迷彻夜庆祝。`,
    },
    {
      id: 2,
      content: `莱昂内尔·梅西，1987年6月24日出生于阿根廷罗萨里奥。13岁时，他因患有生长激素缺乏症，只身前往西班牙，加盟巴塞罗那青训营。正是这段背井离乡的岁月，铸就了他无与伦比的意志品质。

[img]https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80[/img]

在巴萨一线队的21年生涯里，梅西拿下8次西甲冠军、4次欧冠冠军，10次荣膺世界足球先生，成为足球史上最具统治力的球员之一。然而，世界杯冠军这块拼图，始终是他心中的遗憾。

[img]https://images.unsplash.com/photo-1551958219-acbc595b4d12?w=800&q=80[/img]

2022年卡塔尔，梅西率领阿根廷一路披荆斩棘，决赛击败法国，终于站上世界之巅。他用35岁的身躯诠释了什么叫做永不放弃，也让无数球迷与他一同落泪。`,
    },
    {
      id: 7,
      content: `2014年7月8日，贝洛奥里藏特世界杯半决赛，德国队对阵东道主巴西，上演了世界杯历史上最令人瞠目结舌的比分——7:1。

[img]https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80[/img]

比赛仅开场25分钟，德国便以5:0领先。穆勒梅开二度，克洛泽、克罗斯、赫迪拉相继破门，整个马拉卡纳球场陷入一片死寂。巴西球迷难以置信地捂住脸，泪水顺颊而下。

[img]https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80[/img]

这场比赛被称为"贝洛惨案"（Mineirazo），成为巴西足球史上最黑暗的一夜。而对德国而言，这是技术足球与整体战术的完美展示，最终他们在决赛击败阿根廷，时隔24年再度问鼎世界杯。`,
    },
    {
      id: 6,
      content: `基利安·姆巴佩，1998年12月20日出生于巴黎郊区邦迪。他的名字在沃洛夫语中意为"我选择了你"，而足球，也选择了他。

[img]https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&q=80[/img]

2018年俄罗斯世界杯，年仅19岁的姆巴佩横空出世，成为继贝利之后首位在世界杯决赛阶段打进2球的青少年球员。那一年，他带领法国夺冠，并荣获最佳年轻球员奖。

[img]https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=800&q=80[/img]

2022年卡塔尔决赛，姆巴佩上演帽子戏法，最终仍败于命运。但他的时代才刚刚开始——速度、技术、嗅觉，他拥有成为史上最伟大球员的一切条件。法国足球的未来，就系于他脚下。`,
    },
  ];

  for (const n of richNews) {
    const rows = await query<any>("SELECT id FROM football_news WHERE id = ?", [n.id]);
    if (rows.length === 0) {
      console.log(`ID ${n.id} 不存在，跳过`);
      continue;
    }
    await query("UPDATE football_news SET content=? WHERE id=?", [n.content, n.id]);
    console.log(`✅ 已更新资讯 ID ${n.id}`);
  }

  console.log("\n全部完成！");
  process.exit(0);
}

updateNewsContent().catch((e) => {
  console.error(e);
  process.exit(1);
});
