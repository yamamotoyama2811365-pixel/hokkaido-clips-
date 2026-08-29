function getSpotSpecificPhoto(area: string, title: string): string {
    const text = `${area} ${title}`.toLowerCase();
    
    // 🚨 ここに正しい北海道の画像URL（直リンク）を指定してください
    if (text.includes("富良野") || text.includes("美瑛")) {
      return "https://placehold.co/800x600/f43f5e/ffffff?text=Furano+Biei"; // 富良野・美瑛用の画像URL
    }
    if (text.includes("旭川") || text.includes("旭山")) {
      return "https://placehold.co/800x600/f59e0b/ffffff?text=Asahiyama+Zoo"; // 旭山動物園用の画像URL
    }
    if (text.includes("定山渓") || text.includes("温泉")) {
      return "https://placehold.co/800x600/10b981/ffffff?text=Jozankei+Onsen"; // 定山渓用の画像URL
    }
    if (text.includes("函館") || text.includes("夜景")) {
      return "https://placehold.co/800x600/8b5cf6/ffffff?text=Hakodate+Night+View"; // 函館用の画像URL
    }
    if (text.includes("小樽") || text.includes("運河")) {
      return "https://placehold.co/800x600/0ea5e9/ffffff?text=Otaru+Canal"; // 小樽用の画像URL
    }
    if (text.includes("札幌") || text.includes("大通")) {
      return "https://placehold.co/800x600/14b8a6/ffffff?text=Sapporo+Odori+Park"; // 札幌用の画像URL
    }
    return "https://placehold.co/800x600/64748b/ffffff?text=Hokkaido+Travel"; // その他のデフォルト画像
  }
