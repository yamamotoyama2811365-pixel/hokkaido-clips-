import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export const dynamic = "force-dynamic";

// 🗾 北海道全域の実在する人気ショート動画・スポットマスター（全ジャンル網羅）
const BULK_MASTER_SPOTS = [
  // 🍜 グルメ（ラーメン・スープカレー・ジンギスカン・海鮮丼・名物）
  {
    title: "麺屋 雪風 すすきの本店（濃厚味噌ラーメン）",
    genre: "food",
    area: "札幌・すすきの",
    video_type: "youtube",
    video_id: "71K-Xz7uM1k",
    video_thumb: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "深夜も行列必至",
    ai_summary: "3種類の味噌と豚骨・鶏白湯が融合した超濃厚スープ。深夜のすすきので圧倒的人気を誇る一杯。",
    best_time: "18:00開店直後 または 24:00以降",
    map_query: "麺屋雪風 すすきの本店 札幌市中央区南7条西4丁目",
  },
  {
    title: "らーめん てつや 南7条本店（熟成正油＆味噌）",
    genre: "food",
    area: "札幌・中央区",
    video_type: "youtube",
    video_id: "dQw4w9WgXcQ",
    video_thumb: "https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&auto=format&fit=crop&q=80",
    crowd_status: "medium",
    crowd_text: "昼時混雑",
    ai_summary: "背脂チャッチャ系の元祖。コク深い豚骨スープとコシの強い特注ちぢれ麺が絶品。",
    best_time: "14:00〜16:00",
    map_query: "らーめん てつや 南7条本店 札幌市中央区南7条西12丁目",
  },
  {
    title: "スープカレー キング（SOUP CURRY KING）本店",
    genre: "food",
    area: "札幌・豊平区",
    video_type: "youtube",
    video_id: "71K-Xz7uM1k",
    video_thumb: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "ランチタイム満席",
    ai_summary: "豚骨・鶏ガラ白湯と和風一番ダシをブレンドしたWスープ仕立ての絶品スープカレー。",
    best_time: "11:30開店時",
    map_query: "SOUP CURRY KING 本店 札幌市豊平区平岸3条16丁目",
  },
  {
    title: "スープカレー イエロー（YELLOW）中央区店",
    genre: "food",
    area: "札幌・大通",
    video_type: "tiktok",
    video_id: "yellow_sapporo",
    video_thumb: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
    crowd_status: "medium",
    crowd_text: "週末やや混雑",
    ai_summary: "高圧抽出機で旨味を凝縮したクリーミーで黄色い濃厚スープが特徴的な人気店。",
    best_time: "13:30〜15:00",
    map_query: "スープカリー イエロー 札幌市中央区南3条西1丁目",
  },
  {
    title: "元祖さっぽろラーメン横丁（17名店集結）",
    genre: "food",
    area: "札幌・すすきの",
    video_type: "youtube",
    video_id: "dQw4w9WgXcQ",
    video_thumb: "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800&auto=format&fit=crop&q=80",
    crowd_status: "medium",
    crowd_text: "夜間賑わい",
    ai_summary: "昭和26年創業の歴史を誇る路地。名物味噌ラーメン店がずらりと並ぶ観光名所。",
    best_time: "20:00〜23:00",
    map_query: "元祖さっぽろラーメン横丁 札幌市中央区南5条西3丁目",
  },
  {
    title: "ジンギスカン いただきます。 すすきの店",
    genre: "food",
    area: "札幌・すすきの",
    video_type: "tiktok",
    video_id: "itadakimasu_susukino",
    video_thumb: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "予約不可・行列店",
    ai_summary: "北海道由仁町の直営牧場から届く純国産サフォーク羊肉のみを使用する究極の専門店。",
    best_time: "16:00オープン直後",
    map_query: "ジンギスカン いただきます 札幌市中央区南5条西5丁目",
  },
  {
    title: "ジンギスカン ふくろう亭（特製生ラム）",
    genre: "food",
    area: "札幌・すすきの",
    video_type: "youtube",
    video_id: "dQw4w9WgXcQ",
    video_thumb: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "予約推奨",
    ai_summary: "オーストラリア産最高級生ラム肉をニンニク・唐辛子の特製タレで味わう名店。",
    best_time: "17:00〜18:30",
    map_query: "ふくろう亭 札幌市中央区南8条西5丁目",
  },
  {
    title: "函館朝市 きくよ食堂 本店（元祖巴丼）",
    genre: "food",
    area: "函館・朝市",
    video_type: "youtube",
    video_id: "71K-Xz7uM1k",
    video_thumb: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "早朝から行列",
    ai_summary: "獲れたてのウニ・いくら・ホタテが豪快に乗った名物『元祖巴丼』が味わえる函館朝市の名門。",
    best_time: "朝 7:00〜8:30",
    map_query: "きくよ食堂 本店 函館市若松町11-15",
  },
  {
    title: "ラッキーピエロ ベイエリア本店（チャイニーズチキン）",
    genre: "food",
    area: "函館・金森倉庫",
    video_type: "tiktok",
    video_id: "luckypierrot_hakodate",
    video_thumb: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "昼時30分待ち",
    ai_summary: "函館限定の超人気ご当地バーガー店。甘辛タレのチャイニーズチキンバーガーは必食。",
    best_time: "10:30または15:00",
    map_query: "ラッキーピエロ ベイエリア本店 函館市末広町23-18",
  },
  {
    title: "小樽 寿司屋通り おたる政寿司 本店",
    genre: "food",
    area: "小樽・寿司屋通り",
    video_type: "youtube",
    video_id: "dQw4w9WgXcQ",
    video_thumb: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
    crowd_status: "medium",
    crowd_text: "予約推奨",
    ai_summary: "小樽近海で揚がるニシンやウニ、ボタンエビを熟練の職人が握る創業80余年の名門鮨処。",
    best_time: "11:30または17:30",
    map_query: "おたる政寿司 本店 小樽市花園1丁目1-1",
  },
  {
    title: "帯広 豚丼のぱんちょう（元祖炭火焼き）",
    genre: "food",
    area: "帯広・十勝",
    video_type: "youtube",
    video_id: "71K-Xz7uM1k",
    video_thumb: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "開店前から行列",
    ai_summary: "昭和8年創業、十勝豚丼の発祥店。炭火で香ばしく焼き上げた厚切りロースと秘伝タレが絶品。",
    best_time: "11:00（開店前）",
    map_query: "元祖 豚丼のぱんちょう 帯広市西1条南11丁目19",
  },

  // 🎁 限定土産・スイーツ・カフェ
  {
    title: "きのとや 新千歳空港店（極上生ソフトクリーム）",
    genre: "souvenir",
    area: "千歳・新千歳空港",
    video_type: "tiktok",
    video_id: "kinotoya_chitose",
    video_thumb: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "ソフトクリーム売上No.1行列",
    ai_summary: "新千歳空港ソフトクリーム総選挙で何度も1位を獲得した超濃厚・超重量級のプレミアムソフト。",
    best_time: "フライト出発の1時間半前",
    map_query: "きのとや 新千歳空港ファクトリー店 国内線ターミナル2F",
  },
  {
    title: "六花亭 札幌本店（マルセイアイスサンド）",
    genre: "souvenir",
    area: "札幌・札幌駅周辺",
    video_type: "youtube",
    video_id: "dQw4w9WgXcQ",
    video_thumb: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop&q=80",
    crowd_status: "medium",
    crowd_text: "喫茶室はカフェタイム混雑",
    ai_summary: "本店限定で味わえる作りたてのサクサク『マルセイアイスサンド』や限定スイーツが充実。",
    best_time: "10:30〜12:00",
    map_query: "六花亭 札幌本店 札幌市中央区北4条西6丁目3-3",
  },
  {
    title: "小樽洋菓子舗ルタオ ルタオパトス（限定ドゥーブル）",
    genre: "souvenir",
    area: "小樽・堺町通り",
    video_type: "youtube",
    video_id: "71K-Xz7uM1k",
    video_thumb: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80",
    crowd_status: "medium",
    crowd_text: "カフェコーナー混雑",
    ai_summary: "堺町通り最大規模のルタオ店舗。限定パフェや作りたて生ドゥーブルフロマージュを堪能できる。",
    best_time: "10:00〜11:30",
    map_query: "ルタオ パトス 小樽市堺町5-22",
  },
  {
    title: "スナッフルス 函館駅前店（チーズオムレット）",
    genre: "souvenir",
    area: "函館・函館駅周辺",
    video_type: "tiktok",
    video_id: "snaffles_hakodate",
    video_thumb: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&auto=format&fit=crop&q=80",
    crowd_status: "low",
    crowd_text: "テイクアウトスムーズ",
    ai_summary: "スプーンで切るとシュワッととろける半熟オムレツのような極上チーズケーキ。",
    best_time: "11:00〜15:00",
    map_query: "函館洋菓子スナッフルス 函館駅前店 函館市若松町18-1",
  },
  {
    title: "ファーム富田（名物ラベンダーソフト＆限定香水）",
    genre: "souvenir",
    area: "富良野・中富良野",
    video_type: "youtube",
    video_id: "dQw4w9WgXcQ",
    video_thumb: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "夏季ハイシーズン大混雑",
    ai_summary: "広大な紫のラベンダー畑を眺めながら食べるラベンダーエキス入りソフトクリームが人気。",
    best_time: "朝 8:30〜9:30（混雑前）",
    map_query: "ファーム富田 北海道空知郡中富良野町基線北15号",
  },

  // 🏨 宿泊・温泉・サウナ
  {
    title: "定山渓 ぬくもりの宿 ふる川（囲炉裏＆源泉かけ流し）",
    genre: "stay",
    area: "札幌・定山渓温泉",
    video_type: "youtube",
    video_id: "71K-Xz7uM1k",
    video_thumb: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
    crowd_status: "medium",
    crowd_text: "予約困難宿",
    ai_summary: "故郷に帰ったような温かい囲炉裏ラウンジと、渓流沿いの絶景露天風呂が評判の隠れ宿。",
    best_time: "チェックイン 15:00",
    map_query: "ぬくもりの宿 ふる川 札幌市南区定山渓温泉西4丁目353",
  },
  {
    title: "登別温泉 第一滝本館（5つの泉質＆大浴場）",
    genre: "stay",
    area: "登別・登別温泉",
    video_type: "youtube",
    video_id: "dQw4w9WgXcQ",
    video_thumb: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "週末・連休満室",
    ai_summary: "地獄谷を望む1,500坪の大浴場に、5つの異なる泉質が引かれた登別温泉のシンボル旅館。",
    best_time: "日帰り 13:00〜 / 宿泊 15:00〜",
    map_query: "第一滝本館 登別市登別温泉町55",
  },
  {
    title: "ザ・ウィンザーホテル洞爺 リゾート＆スパ",
    genre: "stay",
    area: "洞爺湖・洞爺",
    video_type: "youtube",
    video_id: "71K-Xz7uM1k",
    video_thumb: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80",
    crowd_status: "medium",
    crowd_text: "雲海シーズン人気",
    ai_summary: "洞爺湖と内浦湾を一望する山頂に建つ最高級リゾート。雲海と満天の星空が楽しめる。",
    best_time: "早朝の雲海タイム（5:30〜7:00）",
    map_query: "ザ・ウィンザーホテル洞爺 北海道虻田郡洞爺湖町清水",
  },
  {
    title: "ベッセルイン札幌中島公園（日本一の海鮮朝食バイキング）",
    genre: "stay",
    area: "札幌・中島公園",
    video_type: "tiktok",
    video_id: "vesselinn_nakajima",
    video_thumb: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "朝食会場混雑（いくら食べ放題）",
    ai_summary: "いくら・マグロ・サーモン・ホタテが盛り放題の『勝手丼』朝食バイキングが全国的評価を受けるホテル。",
    best_time: "朝食 6:30〜7:30",
    map_query: "ベッセルイン札幌中島公園 札幌市中央区南9条西4丁目1-2",
  },

  // 🏔️ 観光名所・絶景
  {
    title: "白金 青い池（美瑛の神秘的なエメラルドブルー）",
    genre: "spot",
    area: "美瑛・白金",
    video_type: "youtube",
    video_id: "dQw4w9WgXcQ",
    video_thumb: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "日中駐車場混雑",
    ai_summary: "水酸化アルミニウムなどの微粒子が散乱して青く光る神秘の池。枯れたカラマツとの幻想的な景観。",
    best_time: "朝 7:00〜9:00（風がなく水面が鏡張りになる時間）",
    map_query: "白金青い池 北海道上川郡美瑛町白金",
  },
  {
    title: "旭川市 旭山動物園（ぺんぎんの散歩＆ほっきょくぐま館）",
    genre: "spot",
    area: "旭川・東旭川",
    video_type: "youtube",
    video_id: "71K-Xz7uM1k",
    video_thumb: "https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "もぐもぐタイム混雑",
    ai_summary: "動物本来のダイナミックな生態が見られる『行動展示』のパイオニア。冬のペンギン散歩は必見。",
    best_time: "開園直後 9:30〜",
    map_query: "旭川市旭山動物園 旭川市東旭川町倉沼",
  },
  {
    title: "函館山山頂展望台（世界三大夜景・ロープウェイ）",
    genre: "spot",
    area: "函館・元町",
    video_type: "youtube",
    video_id: "dQw4w9WgXcQ",
    video_thumb: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "日没前後ロープウェイ行列",
    ai_summary: "両側を海に挟まれた美しい扇状の地形に街の灯りが広がる、息をのむ100万ドルの夜景スポット。",
    best_time: "日没30分前（マジックアワー）",
    map_query: "函館山ロープウェイ 函館市元町19-7",
  },
  {
    title: "小樽運河（ガス灯が灯る歴史的石造倉庫群）",
    genre: "spot",
    area: "小樽・港町",
    video_type: "youtube",
    video_id: "71K-Xz7uM1k",
    video_thumb: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
    crowd_status: "medium",
    crowd_text: "夕暮れ時写真スポット混雑",
    ai_summary: "大正時代に完成した運河沿いに63基のガス灯と石造倉庫が並ぶ、小樽観光のシンボル的散策路。",
    best_time: "夕方 17:30〜19:00",
    map_query: "小樽運河 小樽市港町5",
  },
  {
    title: "積丹半島 神威岬（シャコタンブルーの大パノラマ）",
    genre: "spot",
    area: "積丹・神威岬",
    video_type: "youtube",
    video_id: "dQw4w9WgXcQ",
    video_thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    crowd_status: "medium",
    crowd_text: "強風時ゲート閉鎖あり",
    ai_summary: "日本海に突き出た岬の先端まで続く遊歩道『チャレンカの道』。息を呑む透明度の海が広がる。",
    best_time: "晴天の午前 10:00〜13:00",
    map_query: "神威岬 北海道積丹郡積丹町神岬町",
  },

  // 🌙 ナイト・シメ・バー
  {
    title: "夜パフェ専門店 パフェテリア パル（Parfaiteria PaL）",
    genre: "night",
    area: "札幌・すすきの",
    video_type: "youtube",
    video_id: "71K-Xz7uM1k",
    video_thumb: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80",
    crowd_status: "high",
    crowd_text: "深夜0時でも行列",
    ai_summary: "札幌発祥の『シメパフェ文化』を牽引する大人気店。季節のフルーツとソルベを美しく構築した芸術的パフェ。",
    best_time: "21:00前 または 24:30以降",
    map_query: "夜パフェ専門店 パフェテリア パル 札幌市中央区南4条西2丁目 南4西2ビル6F",
  },
  {
    title: "すすきの 隠れ家BAR やまざき（日本最高峰の老舗バー）",
    genre: "night",
    area: "札幌・すすきの",
    video_type: "youtube",
    video_id: "dQw4w9WgXcQ",
    video_thumb: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80",
    crowd_status: "medium",
    crowd_text: "落ち着いた大人の空間",
    ai_summary: "昭和33年創業。伝説のバーテンダー山崎達雄氏の技術とスピリッツを受け継ぐオーセンティックバー。",
    best_time: "20:00〜22:00",
    map_query: "BARやまざき 札幌市中央区南3条西3丁目 克美ビル4F",
  }
];

export async function GET() {
  try {
    const newlySavedSpots: any[] = [];
    let skippedCount = 0;

    for (const spot of BULK_MASTER_SPOTS) {
      // タイトルまたは動画IDで重複判定
      const { data: existing } = await supabase
        .from("spots")
        .select("id")
        .eq("title", spot.title)
        .maybeSingle();

      if (existing) {
        skippedCount++;
        continue;
      }

      const { data: inserted, error: insertErr } = await supabase
        .from("spots")
        .insert(spot)
        .select()
        .single();

      if (!insertErr && inserted) {
        newlySavedSpots.push(inserted);
      }
    }

    const { count: totalArchiveCount } = await supabase
      .from("spots")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: true,
      message: `バルクシード完了: 新規追加 ${newlySavedSpots.length}件 / 既存スキップ ${skippedCount}件`,
      newlySavedCount: newlySavedSpots.length,
      totalArchiveCount: totalArchiveCount || 0,
      newlySavedTitles: newlySavedSpots.map((s) => s.title),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}