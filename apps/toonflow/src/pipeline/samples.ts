import type { StudioMode } from "./mode"

export interface SampleProject {
  id: string
  title: string
  excerpt: string
  modes: StudioMode[]
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: "rain-alley",
    title: "雨巷重逢",
    modes: ["drama", "novel"],
    excerpt: `雨巷的霓虹被水洼拆成碎金。林晚撑着伞站在旧书铺门口，怀里抱着一本发黄的《海上花》。
「你还是来了。」身后传来低沉的声音。沈砚收起打火机，风衣下摆滴着水，「三年，你欠我一句解释。」
林晚没有回头：「解释不会改变结局。但今晚，我可以把真相写进剧本——如果你还愿意当我的男主角。」
沈砚沉默片刻，推开门：「舞台灯亮之前，别让观众看见破绽。」`,
  },
  {
    id: "midnight-diner",
    title: "午夜食堂",
    modes: ["drama", "novel"],
    excerpt: `凌晨一点，胡同尽头的小馆只剩三盏灯。老板娘阿禾把味噌汤端给穿西装的陈默：「又加班？」
「不是加班，是逃班。」陈默苦笑，「公司要把我写的短剧改成带货直播，我辞职了。」
角落里，戴鸭舌帽的摄影师小北举起相机：「那正好，我缺一个能写对白的人。明天拍夜景，来吗？」
阿禾擦了擦手：「剧本里加一碗热汤，观众就会相信你们是真的。」`,
  },
  {
    id: "rooftop-signal",
    title: "天台信号",
    modes: ["drama"],
    excerpt: `旧城楼顶，信号塔红灯有节奏地闪。电台主持夏澄对着便携麦说：「这是最后一期午夜档。」
搭档陆星河把耳机递给她：「别收摊，听众刚发来一段小说投稿——关于两个在天台相遇的人。」
夏澄念出第一句：「『如果你听见这段广播，请在雨停后去城西钟楼。』」
陆星河抬头看云：「我们要把它拍成竖屏短剧吗？」夏澄笑了：「先写成分镜，再决定要不要改变世界。」`,
  },
  {
    id: "campus-underworld",
    title: "灵力高中·青龙堂",
    modes: ["novel"],
    excerpt: `寄宿制灵力高中的晚自习铃刚响，教学楼地下传来丹炉闷响。青龙堂把新人程野拖进禁灵牢：逼炼废丹，炼不出就断骨。
白虎楼的人堵在黑市入口抬价，堂口印一碰，灵压就把人按跪。程野炼体九重硬顶，舌尖咬破，灵力逆冲经脉——他要在地下室反杀，把青龙堂抢来的丹夺回来。
窗外没有警笛，只有黑市灯笼晃。裴骁笑着递来淬毒灵丹：「吞下去，或者我把你锁进牢里炼到废。」程野抬眼：「你想逼炼我？先算算你要赔几条命。」`,
  },
  {
    id: "ink-mountain",
    title: "墨山手记",
    modes: ["novel"],
    excerpt: `云贵边境的墨山村，雾常年停在屋檐高度。返乡青年苏砚在祖屋阁楼发现一册残破族谱，夹着半张地图，指向后山禁入的溶洞。
族老警告：「墨山有三不写——不写官、不写鬼、不写外姓。」苏砚却在本子上记下第一句：「若地图为真，先人为何把路画成闭环？」
夜里火把成行，村民说是送山神；苏砚远远看见领头人戴着县志里才有的旧警徽。他合上本子：世界观从来不是风景，是谁有权定义「禁忌」。`,
  },
]

export function getSampleById(id: string): SampleProject {
  return SAMPLE_PROJECTS.find((s) => s.id === id) ?? SAMPLE_PROJECTS[0]
}

export function getNovelSampleById(id: string): SampleProject {
  const novelSamples = SAMPLE_PROJECTS.filter((s) => s.modes.includes("novel"))
  return novelSamples.find((s) => s.id === id) ?? novelSamples[0]
}

export function samplesForMode(mode: StudioMode): SampleProject[] {
  return SAMPLE_PROJECTS.filter((s) => s.modes.includes(mode))
}

export function defaultSampleIdForMode(mode: StudioMode): string {
  const list = samplesForMode(mode)
  return list[0]?.id ?? SAMPLE_PROJECTS[0].id
}
