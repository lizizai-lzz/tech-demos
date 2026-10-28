import type { Brief, ShotRow, SeedKind } from './types'

function dramaShots(brief: Brief): ShotRow[] {
  return [
    {
      number: 1,
      framing: '中景',
      cameraMove: '缓慢推近',
      durationSec: 4,
      visualIntent: '便利店门口，女主拎纸箱驻足，店内暖光对比街道冷色',
      dialogueSfx: '环境：冰柜低鸣、远处车流',
    },
    {
      number: 2,
      framing: '近景',
      cameraMove: '固定',
      durationSec: 5,
      visualIntent: '店员抬头，欲言又止，货架虚化',
      dialogueSfx: '对白：「这么晚还来？」',
    },
    {
      number: 3,
      framing: '特写',
      cameraMove: '手持微晃',
      durationSec: 4,
      visualIntent: '女主手指摩挲工牌，情绪积压',
      dialogueSfx: '音效：纸箱胶带撕扯声',
    },
    {
      number: 4,
      framing: '过肩',
      cameraMove: '横移',
      durationSec: 6,
      visualIntent: '正反打对峙，荧光灯在瞳孔里跳动',
      dialogueSfx: `对白：「我明天就不来了。」 / 情绪：${brief.tone}`,
    },
    {
      number: 5,
      framing: '大远景',
      cameraMove: '缓慢拉远',
      durationSec: 5,
      visualIntent: '两人隔收银台沉默，门口自动门开合留白',
      dialogueSfx: `结尾意图：${brief.mustHave[1] ?? '留白'}`,
    },
  ]
}

function unboxShots(brief: Brief): ShotRow[] {
  return [
    {
      number: 1,
      framing: '俯拍特写',
      cameraMove: '滑轨横移',
      durationSec: 3,
      visualIntent: '礼盒入画，品牌 Logo 清晰',
      dialogueSfx: '音效：包装摩擦、轻快节奏 BGM 起',
    },
    {
      number: 2,
      framing: '微距',
      cameraMove: '固定',
      durationSec: 4,
      visualIntent: '撕膜慢动作，高光扫过耳机壳体',
      dialogueSfx: 'ASMR：撕膜「嘶——」',
    },
    {
      number: 3,
      framing: '中近景',
      cameraMove: '环绕 30°',
      durationSec: 5,
      visualIntent: `强调${brief.mustHave[0]}，耳垫纹理与金属铰链`,
      dialogueSfx: '画外：「质感真的在线」',
    },
    {
      number: 4,
      framing: '特写',
      cameraMove: '推近',
      durationSec: 4,
      visualIntent: '手机弹窗「已连接」，一键配对爽感',
      dialogueSfx: '音效：连接提示音',
    },
  ]
}

function brollShots(brief: Brief): ShotRow[] {
  return [
    {
      number: 1,
      framing: '大全景',
      cameraMove: '无人机缓推',
      durationSec: 5,
      visualIntent: '雨后天台，城市天际线建立，云层低垂',
      dialogueSfx: '环境：远处闷雷、风声',
    },
    {
      number: 2,
      framing: '远景',
      cameraMove: '慢门横摇',
      durationSec: 4,
      visualIntent: '高架车流光轨，霓虹反射在积水',
      dialogueSfx: '无对白，低频氛围垫',
    },
    {
      number: 3,
      framing: '中景',
      cameraMove: '稳定器前推',
      durationSec: 4,
      visualIntent: `玻璃幕墙反光，${brief.tone}色调`,
      dialogueSfx: '雨滴滴落金属护栏',
    },
    {
      number: 4,
      framing: '特写',
      cameraMove: '固定长焦',
      durationSec: 3,
      visualIntent: '广告牌霓虹闪烁，焦外虚化光斑',
      dialogueSfx: '城市白噪音渐强',
    },
  ]
}

function genericShots(brief: Brief): ShotRow[] {
  return [
    {
      number: 1,
      framing: '全景',
      cameraMove: '建立镜头',
      durationSec: 4,
      visualIntent: `交代场景：${brief.logline.slice(0, 40)}`,
      dialogueSfx: '环境音铺底',
    },
    {
      number: 2,
      framing: '中景',
      cameraMove: '缓慢推近',
      durationSec: 5,
      visualIntent: '主体动作与情绪建立',
      dialogueSfx: '对白或旁白（可选）',
    },
    {
      number: 3,
      framing: '特写',
      cameraMove: '固定',
      durationSec: 4,
      visualIntent: '关键细节 / 产品卖点',
      dialogueSfx: '强调音效',
    },
    {
      number: 4,
      framing: '远景',
      cameraMove: '拉远收束',
      durationSec: 4,
      visualIntent: '情绪落点，呼应开场',
      dialogueSfx: '音乐收束',
    },
  ]
}

export function compileShots(brief: Brief, kind: SeedKind): ShotRow[] {
  switch (kind) {
    case 'drama':
      return dramaShots(brief)
    case 'unbox':
      return unboxShots(brief)
    case 'broll':
      return brollShots(brief)
    default:
      return genericShots(brief)
  }
}
