import { query } from "../lib/db";

async function updateHighlights() {
  // 使用公共可访问的足球/体育图片（Unsplash / Picsum 占位图）
  // 格式：正文段落 + [img]url[/img] 交替出现，实现图文混排

  const richHighlights = [
    {
      id: 1,
      title: "开场闪击！禁区外远射划破长空",
      type: "进球",
      occur_time: "23分钟",
      description: `比赛第23分钟，全场爆发出震耳欲聋的欢呼声。10号球员在禁区外约25米处接到队友的转移球，趁对方防守阵型尚未稳固，果断起脚怒射。

[img]https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80[/img]

皮球划出一道完美弧线，直挂死角。门将虽然做出了扑救动作，但皮球的速度与角度均已超出其能力范围，无奈落网。

[img]https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80[/img]

这粒进球是本届世界杯至今最精彩的远射之一。赛后数据显示，皮球出脚速度达到了每小时112公里，全场观众起立鼓掌长达数分钟，评论员激动地连续高喊了三声"进了"。`,
    },
    {
      id: 2,
      title: "门将神扑！单刀球被扑出界外",
      type: "扑救",
      occur_time: "37分钟",
      description: `第37分钟，这是今晚最惊心动魄的一幕。对方前锋利用越位陷阱失效，单刀直入禁区，与门将形成一对一局面。所有人都以为进球已成定局。

[img]https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&q=80[/img]

然而门将展现了他世界级的反应速度。前锋选择推射远角，门将瞬间做出判断，身体向右侧飞扑，指尖将皮球拨出底线。

[img]https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80[/img]

全场为这次神级扑救发出阵阵惊叹，解说席一度陷入沉默，随后爆发出热烈赞美。这或许是本场比赛的最佳球员表现，赛后门将获得了全场最高评分9.4分。`,
    },
    {
      id: 3,
      title: "红牌判决！铲球动作过大被罚下",
      type: "红牌",
      occur_time: "55分钟",
      description: `第55分钟，比赛出现了重大转折点。5号防守球员在中场附近对持球对手进行了一次严重犯规，铲球时脚抬过高，直接铲中对手小腿。

[img]https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80[/img]

主裁判第一时间跑向事发地点，短暂观察后毫不犹豫地掏出红牌。现场哗然，红牌球员的队友纷纷上前理论，但裁判坚持判决。

[img]https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80[/img]

这次红牌的出现使该队以10人应战，大大影响了下半场的局势走向。被铲倒球员经过简单处理后坚持完成了比赛，赛后医疗报告显示其小腿有轻微淤伤。`,
    },
    {
      id: 4,
      title: "点球大战！主将一蹴而就锁定胜局",
      type: "点球",
      occur_time: "90+3分钟",
      description: `加时第3分钟，裁判指向了点球点，全场鸦雀无声。主队队长亲自操刀主罚这粒至关重要的点球。

[img]https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80[/img]

他冷静地将球放好，后退数步，深呼一口气。助跑、起脚，皮球以极快的速度射向球门右下角。对方门将方向判断正确，身体扑出，但皮球的力量与角度令其无能为力。

[img]https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80[/img]

进球！全场瞬间沸腾，这粒点球最终锁定了比赛的胜局，球队晋级下一轮。队长在庆祝后跑向看台，向远道而来的球迷深鞠一躬，那一幕令无数人动容。`,
    },
    {
      id: 5,
      title: "精妙助攻！妙传撕裂防线制造进球",
      type: "助攻",
      occur_time: "68分钟",
      description: `第68分钟，一次教科书级别的进攻配合令全场观众叹为观止。7号球员在右侧边路接球后，面对两名防守球员的夹击，做出了一个令人意想不到的选择。

[img]https://images.unsplash.com/photo-1551958219-acbc595b4d12?w=800&q=80[/img]

他没有选择强行突破，而是巧妙地斜传禁区。这记传球精准穿过三名防守队员之间的空隙，正好落在插上的同伴脚下。接球者面对空门，轻松推射破门。

[img]https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=800&q=80[/img]

事后主教练表示，这次助攻是本场训练内容的完美体现，两名球员的默契配合令人印象深刻。赛后统计数据显示，这次进攻从抢断到入网仅用了4.8秒，堪称世界杯历史上最快的快攻之一。`,
    },
  ];

  for (const h of richHighlights) {
    const rows = await query<any>("SELECT id FROM highlights WHERE id = ?", [h.id]);
    if (rows.length === 0) {
      console.log(`ID ${h.id} 不存在，跳过`);
      continue;
    }
    await query(
      "UPDATE highlights SET title=?, type=?, occur_time=?, description=? WHERE id=?",
      [h.title, h.type, h.occur_time, h.description, h.id]
    );
    console.log(`✅ 已更新 ID ${h.id}: ${h.title}`);
  }

  // 确保比赛有比分
  await query("UPDATE matches_ SET home_score=2, away_score=1 WHERE id=1");
  await query("UPDATE matches_ SET home_score=1, away_score=1 WHERE id=2");
  console.log("✅ 比分数据已更新");

  console.log("\n全部完成！");
  process.exit(0);
}

updateHighlights().catch((e) => {
  console.error(e);
  process.exit(1);
});
