// Define main function (script entry)

// function main(config) {
//   return config;
// }

function main(config, profileName) {
  // ============================================================
  // 0. 基础检查
  // ============================================================
  const proxies = config.proxies || [];
  if (!Array.isArray(proxies) || proxies.length === 0) return config;

  const MIRROR_URL = "https://raw.gitmirror.com";

  // 统一用常量，避免手滑写错名字
  const AUTO_GROUP = "♻️ 自动选择";
  const NODE_SELECT = "🚀 节点选择";
  const OTHER_REGION = "🌐 其他地区";

  const HK_GROUP = "🇭🇰 香港负载";
  const TW_GROUP = "🇹🇼 台湾负载";
  const JP_GROUP = "🇯🇵 日本负载";
  const SG_GROUP = "🇸🇬 狮城负载";
  const US_GROUP = "🇺🇸 美国负载";

  // 常用地区（港台日新美）
  const COMMON_REGION_GROUPS = [
    HK_GROUP,
    TW_GROUP,
    JP_GROUP,
    SG_GROUP,
    US_GROUP
  ];

  // 每个业务组里地区排序：节点选择 -> 常用地区 -> 其他地区
  const ORDERED_REGION_IN_GROUP = [NODE_SELECT, "DIRECT", ...COMMON_REGION_GROUPS, OTHER_REGION];

  // ============================================================
  // 1. 地区组：内核 filter + include-all-proxies
  // ============================================================

  // 各个“自动测速地区组”，用 url-test + filter
  const regionAutoFilters = {
    [HK_GROUP]: "(?i)香港|hong ?kong|hk",
    [TW_GROUP]: "(?i)台湾|台灣|新北|彰化|taiwan|tw|taipei",
    [JP_GROUP]: "(?i)日本|japan|jp|tokyo|osaka|saitama",
    [SG_GROUP]: "(?i)新加坡|singapore|sg|狮城",
    [US_GROUP]:
      "(?i)美国|united ?states|usa|america|洛杉矶|芝加哥|纽约|seattle|silicon ?valley"
  };

  const regionAutoGroups = Object.entries(regionAutoFilters).map(([name, filter]) => ({
    name,
    type: "load-balance",
    strategy: "consistent-hashing",
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
    "max-failed-times": 3,
    lazy: true,
    "include-all-proxies": true, // 只拉所有节点，配合 filter 过滤
    filter
  }));

  const regionAutoNames = Object.keys(regionAutoFilters);

  // 🌐 其他地区：手动选择 + filter，包含“其他国家”
  const otherRegionFilter =
    "(?i)" +
    [
      // 其他国家关键词
      "韩国|韓國|korea|kr|seoul|首尔|釜山",
      "英国|uk|london",
      "德国|germany|deutsch|berlin",
      "法国|france|paris",
      "加拿大|canada|toronto|vancouver",
      "澳大利亚|澳洲|australia|sydney|melbourne",
      "俄罗斯|俄罗?斯|russia|moscow",
      "土耳其|turkey|turkiye|istanbul",
      "印度|india|mumbai|new ?delhi|bangalore",
      "荷兰|netherlands|amsterdam",
      "意大利|italy|rome|milan",
      "西班牙|spain|madrid|barcelona",
      "巴西|brazil|sao ?paulo",
      "阿根廷|argentina|buenos ?aires",
      "墨西哥|mexico|mexico ?city",
      "波兰|poland|warsaw",
      "瑞士|swiss|switzerland|zurich",
      "瑞典|sweden|stockholm",
      "挪威|norway|oslo",
      "丹麦|denmark|copenhagen",
      "芬兰|finland|helsinki",
      "越南|vietnam|hanoi|saigon|ho ?chi ?minh",
      "泰国|thailand|bangkok",
      "马来西亚|malaysia|kuala ?lumpur",
      "菲律宾|philippines|manila",
      "印尼|indonesia|jakarta",
      "新西兰|new ?zealand|auckland"
    ].join("|");

  const otherRegionGroup = {
    name: OTHER_REGION,
    type: "select", // 手动选择，不测速
    "include-all-proxies": true,
    filter: otherRegionFilter // 通过正则筛一遍
  };

  const ALL_REGION_GROUPS = [...regionAutoNames, OTHER_REGION];

  // ============================================================
  // 2. 策略组布局
  // ============================================================
  const newGroups = [];

  // [1] 🚀 节点选择：所有节点 + 常用地区 + 其他地区 + DIRECT
  newGroups.push({
    name: NODE_SELECT,
    type: "select",
    proxies: [AUTO_GROUP, ...COMMON_REGION_GROUPS, OTHER_REGION, "DIRECT"],
    "include-all-proxies": true
  });

  // [2] 全局自动测速
  newGroups.push({
    name: AUTO_GROUP,
    type: "url-test",
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
    tolerance: 100,
    lazy: true,
    "include-all-proxies": true
  });
  
  // [3] 🐟 漏网之鱼
  newGroups.push({
    name: "🐟 漏网之鱼",
    type: "select",
    proxies: ["DIRECT", NODE_SELECT, AUTO_GROUP, ...COMMON_REGION_GROUPS, OTHER_REGION],
    "include-all-proxies": true
  });

  // [4] 🤖 AI服务
  newGroups.push({
    name: "🤖 AI服务",
    type: "select",
    proxies: ORDERED_REGION_IN_GROUP,
    "include-all-proxies": true
  });

  // 所有业务组统一候选：节点选择 -> 常用地区 -> 其他地区
  const BUSINESS_GROUP_PROXIES = ORDERED_REGION_IN_GROUP.slice();

  // [5] 常用服务分组
  newGroups.push({
    name: "🔍 Google",
    type: "select",
    proxies: BUSINESS_GROUP_PROXIES
  });
  
  // ✅ 修改微软图标
  newGroups.push({
    name: "🪟 Microsoft",
    type: "select",
    proxies: BUSINESS_GROUP_PROXIES
  });

  // ✅ 新增 学术网站 组（放在 Github 后面）
  newGroups.push({
    name: "学术网站",
    type: "select",
    proxies: BUSINESS_GROUP_PROXIES
  });

  // ✅ 新增 YouTube 组
  newGroups.push({
    name: "YouTube",
    type: "select",
    proxies: BUSINESS_GROUP_PROXIES
  });

  // ✅ 新增 TikTok 组
  newGroups.push({
    name: "TikTok",
    type: "select",
    proxies: BUSINESS_GROUP_PROXIES
  });
  
  // ✅ 新增 Netflix 组
  newGroups.push({
    name: "Netflix",
    type: "select",
    proxies: BUSINESS_GROUP_PROXIES
  });
  
  // ✅ 新增 X 组
  newGroups.push({
    name: "X",
    type: "select",
    proxies: BUSINESS_GROUP_PROXIES
  });
  
  // ✅ 新增 Telegram 组
  newGroups.push({
    name: "Telegram",
    type: "select",
    proxies: BUSINESS_GROUP_PROXIES
  });

  // 最终 proxy-groups
  config["proxy-groups"] = [
    ...newGroups,
    ...regionAutoGroups,
    otherRegionGroup
  ];

  // ============================================================
  // 3. rule-providers：全部 blackmatrix7 + 镜像
  // ============================================================
  const getProvider = (user, repo, path) => ({
    type: "http",
    behavior: "classical",
    interval: 86400,
    path: `./ruleset/${path.split("/").pop()}`,
    url: `${MIRROR_URL}/${user}/${repo}/master/${path}`
  });

  config["rule-providers"] = {
    // AI
    OpenAI: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/OpenAI/OpenAI_No_Resolve.yaml"
    ),
    Claude: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/Claude/Claude_No_Resolve.yaml"
    ),
    Gemini: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/Gemini/Gemini_No_Resolve.yaml"
    ),

    // 常用服务 & 流媒体
    Google: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/Google/Google_No_Resolve.yaml"
    ),
    Microsoft: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/Microsoft/Microsoft_No_Resolve.yaml"
    ),
    GitHub: getProvider( 
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/GitHub/GitHub_No_Resolve.yaml"
    ),

    // ✅ 学术网站（以 Scholar 为例）
    Scholar: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/Scholar/Scholar_No_Resolve.yaml"
    ),

    // ✅ YouTube
    YouTube: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/YouTube/YouTube_No_Resolve.yaml"
    ),
    
    // ✅ TikTok
    TikTok: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/TikTok/TikTok_No_Resolve.yaml"
    ),
    
    // ✅ Netflix
    Netflix: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/Netflix/Netflix_No_Resolve.yaml"
    ),
    
    // ✅ X
    X: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/Twitter/Twitter_No_Resolve.yaml"
    ),
    
    // ✅ Telegram
    Telegram: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/Telegram/Telegram_No_Resolve.yaml"
    ),
    
    // 通用分流
    // AdBlock: getProvider(
    //   "blackmatrix7",
    //   "ios_rule_script",
    //   "rule/Clash/AdvertisingLite/AdvertisingLite_No_Resolve.yaml"
    // ),
    Speedtest: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/Speedtest/Speedtest_No_Resolve.yaml"
    ),
    Reddit: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/Reddit/Reddit_No_Resolve.yaml"
    ),  
    Global: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/Global/Global_No_Resolve.yaml"
    ),
    Lan: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/Lan/Lan_No_Resolve.yaml"
    ),
    // 或者改成ChinaMax,但是漏网之鱼用的直连,相当于只有写到的规则走代理(白名单模式?)
    China: getProvider(
      "blackmatrix7",
      "ios_rule_script",
      "rule/Clash/China/China_No_Resolve.yaml"
    )
  };

  // ============================================================
  // 4. 分流规则
  // ============================================================
  config["rules"] = [
    // 广告优先拦截
    //"RULE-SET,AdBlock,REJECT",
    
    // 国内直连
    "RULE-SET,China,DIRECT",
    "RULE-SET,Lan,DIRECT",
    "GEOIP,LAN,DIRECT",
    "GEOIP,CN,DIRECT",
    
    // AI 优先
    "RULE-SET,OpenAI,🤖 AI服务",
    "RULE-SET,Claude,🤖 AI服务",
    // gemini 和 谷歌绑定
    "RULE-SET,Gemini,🔍 Google",
    // perplexity
    "DOMAIN-SUFFIX,perplexity.ai,🤖 AI服务",
    "DOMAIN-SUFFIX,pplx.ai,🤖 AI服务",
    //grok
    "PROCESS-NAME,grok,🤖 AI服务",
    "DOMAIN-KEYWORD,grok,🤖 AI服务",
    "DOMAIN-SUFFIX,x.ai,🤖 AI服务",
    "DOMAIN-SUFFIX,grok.com,🤖 AI服务",

    // 常用服务
    // 谷歌
    "RULE-SET,Google,🔍 Google",

    //github
    "RULE-SET,GitHub,🚀 节点选择",

    // ✅ 学术网站
    "RULE-SET,Scholar,学术网站",

    // ✅ YouTube
    "RULE-SET,YouTube,YouTube",
    
    // ✅ TikTok
    "RULE-SET,TikTok,TikTok",
    
    // 微软
    "RULE-SET,Microsoft,🪟 Microsoft",
    
    // Netflix
    "RULE-SET,Netflix,🚀 节点选择",
    // X
    "RULE-SET,X,🚀 节点选择",
    // Telegram
    "RULE-SET,Telegram,🚀 节点选择",
    
    // 其它国外流量
    "RULE-SET,Global,🚀 节点选择",
    
    // 我的规则!
    "DOMAIN-SUFFIX,linux.do,🚀 节点选择",
    "RULE-SET,Reddit,🚀 节点选择",
    "RULE-SET,Speedtest,🚀 节点选择",
    // 兜底
    "MATCH,🐟 漏网之鱼"
  ];

  // 保留原始节点
  config.proxies = proxies;
  return config;
}
