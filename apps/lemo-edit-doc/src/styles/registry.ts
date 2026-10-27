export type StyleSlug =
  | 'caption-news'
  | 'newsreel'
  | 'countdown'
  | 'city-symphony'
  | 'visual-investigation'
  | 'kino-montage'
  | 'telestrator'
  | 'news-package'

export type EditDocStyle = {
  id: string
  slug: StyleSlug
  nameEn: string
  nameZh: string
  tagline: string
  mantras: string[]
  brief: {
    duration: string
    materials: string
    voice: string
  }
}

export const EDIT_DOC_STYLES: EditDocStyle[] = [
  {
    id: 'caption-news',
    slug: 'caption-news',
    nameEn: 'Caption News',
    nameZh: '字幕新闻',
    tagline: '信息像滚动字幕一样落地，画面为字服务。',
    mantras: [
      '一句一卡，字大过脸',
      '画面可静，字幕要有节拍',
      '关键词加色块，别堆小字',
      '切镜跟着句号走',
    ],
    brief: {
      duration: '60–90 秒',
      materials: '采访片段、图表截图、B-roll 空镜',
      voice: '冷静播报，短句断行',
    },
  },
  {
    id: 'newsreel',
    slug: 'newsreel',
    nameEn: '1920s Newsreel',
    nameZh: '1920s 新闻影片',
    tagline: '颗粒、跳切与标题卡，复古新闻片的仪式感。',
    mantras: [
      '先标题卡，再画面',
      '留黑边，像放映机框',
      '节奏偏快，像胶片咔哒',
      '旁白用「据报导」口吻',
    ],
    brief: {
      duration: '45–75 秒',
      materials: '档案照片、示意动画、粗颗粒滤镜',
      voice: '庄重、略夸张的历史腔',
    },
  },
  {
    id: 'countdown',
    slug: 'countdown',
    nameEn: 'Live Countdown Split-screen',
    nameZh: '实时倒计时分屏',
    tagline: '左现场右数据，时间压力一眼可见。',
    mantras: [
      '大数字倒计时置顶',
      '分屏线要硬，别渐变糊掉',
      '一侧动、一侧稳',
      '到零秒必须有一个动作',
    ],
    brief: {
      duration: '30–120 秒（事件驱动）',
      materials: '直播画面、数据面板、时钟素材',
      voice: '紧张但不嘶吼，像解说员',
    },
  },
  {
    id: 'city-symphony',
    slug: 'city-symphony',
    nameEn: 'Time-lapse Symphony',
    nameZh: '延时交响',
    tagline: '城市像乐章，光影与车流是主旋律。',
    mantras: [
      '固定机位，时间当主角',
      '三段式：晨、午、夜',
      '配乐先于剪辑定拍点',
      '偶尔插一张「人间特写」',
    ],
    brief: {
      duration: '90–180 秒',
      materials: '延时摄影、航拍剪影、环境声',
      voice: '诗意旁白或纯音乐',
    },
  },
  {
    id: 'visual-investigation',
    slug: 'visual-investigation',
    nameEn: 'Visual Investigation',
    nameZh: '视觉调查',
    tagline: '放大镜式追问，框选与连线揭示因果。',
    mantras: [
      '先给地图，再下钻',
      '红圈只圈一处',
      '证据条像时间轴',
      '结论最后三秒才亮',
    ],
    brief: {
      duration: '3–8 分钟',
      materials: '卫星图、文档扫描、对比截图',
      voice: '克制追问，少形容词',
    },
  },
  {
    id: 'kino-montage',
    slug: 'kino-montage',
    nameEn: 'Constructivist Montage',
    nameZh: '构成主义蒙太奇',
    tagline: '斜切色块与快切，口号式视觉冲击。',
    mantras: [
      '对角线切，别用圆角',
      '红黑白三色够用了',
      '字是图形的一部分',
      '一镜不超过两秒',
    ],
    brief: {
      duration: '30–60 秒',
      materials: '海报式图形、工业镜头、标语字卡',
      voice: '短促口号或静音鼓点',
    },
  },
  {
    id: 'telestrator',
    slug: 'telestrator',
    nameEn: 'Sports Telestrator',
    nameZh: '体育战术板',
    tagline: '箭头与圆圈在画面上「画战术」。',
    mantras: [
      '先定格，再画线',
      '箭头要有方向色',
      '圈人、划线、回放三步',
      '解说跟着笔尖走',
    ],
    brief: {
      duration: '45–90 秒',
      materials: '比赛录像、俯视战术图、慢动作',
      voice: '兴奋但清晰，像场边教练',
    },
  },
  {
    id: 'news-package',
    slug: 'news-package',
    nameEn: 'Broadcast News Package',
    nameZh: '电视新闻包装',
    tagline: '下三分之一、角标与转场，整段像一条电视稿。',
    mantras: [
      '下三分之一别挡眼睛',
      '角标统一，别五种字体',
      '转场用「嗖」一下即可',
      '片尾留记者署名位',
    ],
    brief: {
      duration: '90–150 秒',
      materials: '主播抠像、现场连线、图文条',
      voice: '标准新闻播音，语速中等',
    },
  },
]

export const DEFAULT_STYLE_SLUG: StyleSlug = 'caption-news'

export function styleBySlug(slug: StyleSlug): EditDocStyle {
  const found = EDIT_DOC_STYLES.find((s) => s.slug === slug)
  if (!found) throw new Error(`未知风格 slug: ${slug}`)
  return found
}
