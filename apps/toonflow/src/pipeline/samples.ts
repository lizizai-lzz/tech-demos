export interface SampleProject {
  id: string
  title: string
  excerpt: string
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: "rain-alley",
    title: "雨巷重逢",
    excerpt: `雨巷的霓虹被水洼拆成碎金。林晚撑着伞站在旧书铺门口，怀里抱着一本发黄的《海上花》。
「你还是来了。」身后传来低沉的声音。沈砚收起打火机，风衣下摆滴着水，「三年，你欠我一句解释。」
林晚没有回头：「解释不会改变结局。但今晚，我可以把真相写进剧本——如果你还愿意当我的男主角。」
沈砚沉默片刻，推开门：「舞台灯亮之前，别让观众看见破绽。」`,
  },
  {
    id: "midnight-diner",
    title: "午夜食堂",
    excerpt: `凌晨一点，胡同尽头的小馆只剩三盏灯。老板娘阿禾把味噌汤端给穿西装的陈默：「又加班？」
「不是加班，是逃班。」陈默苦笑，「公司要把我写的短剧改成带货直播，我辞职了。」
角落里，戴鸭舌帽的摄影师小北举起相机：「那正好，我缺一个能写对白的人。明天拍夜景，来吗？」
阿禾擦了擦手：「剧本里加一碗热汤，观众就会相信你们是真的。」`,
  },
  {
    id: "rooftop-signal",
    title: "天台信号",
    excerpt: `旧城楼顶，信号塔红灯有节奏地闪。电台主持夏澄对着便携麦说：「这是最后一期午夜档。」
搭档陆星河把耳机递给她：「别收摊，听众刚发来一段小说投稿——关于两个在天台相遇的人。」
夏澄念出第一句：「『如果你听见这段广播，请在雨停后去城西钟楼。』」
陆星河抬头看云：「我们要把它拍成竖屏短剧吗？」夏澄笑了：「先写成分镜，再决定要不要改变世界。」`,
  },
]

export function getSampleById(id: string): SampleProject {
  return SAMPLE_PROJECTS.find((s) => s.id === id) ?? SAMPLE_PROJECTS[0]
}
