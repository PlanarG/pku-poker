export const PLAYER_CONFIG = {
  hp: 80,
  initialMental: 5,
  maxMental: 10,
  baseDraw: 5,
};

export const BOSS_CONFIG = {
  hp: 300,
};

export const CARD_DEFS = {
  "3.92": {
    name: "3.92",
    type: "attack",
    cost: 0,
    text: "精神低于 5 时可打出。造成 0 点基础伤害，此牌受到的力量加成为两倍；若最终伤害高于 5，回复 2 精神。",
    tags: [],
  },
  talk: {
    name: "谈笑风生",
    type: "attack",
    cost: 0,
    text: "造成 5 点伤害。若当前精神至少为 5，追加 5 点伤害。",
    tags: [],
  },
  persuade: {
    name: "好言相劝",
    type: "attack",
    cost: 1,
    text: "造成 7 点伤害，获得 5 点防御，玩家获得 1 层力量。",
    tags: [],
  },
  pause: {
    name: "暂",
    type: "skill",
    cost: 6,
    text: "本回合 Boss 对玩家造成的伤害和施加的效果无效。本回合内每回复 1 次精神值，此牌费用降低 1。",
    tags: [],
  },
  oneTen: {
    name: "1/10",
    type: "attack",
    cost: 1,
    text: "造成 5 点伤害。给予 Boss 1 层注视，并将 2 张【循证】加入抽牌堆。",
    tags: [],
  },
  evidence: {
    name: "循证",
    type: "skill",
    cost: 0,
    text: "消耗。若 Boss 已有注视，再施加 1 层；若精神高于 5，额外再施加 1 层。",
    tags: ["消耗"],
    exhaust: true,
  },
  insight: {
    name: "洞见",
    type: "skill",
    cost: 0,
    text: "保留，消耗。当前每有 2 点精神，随机获得 1 层增益：力量 +1、敏捷 +1、或回合开始抽牌 +1 后弃 1。",
    tags: ["保留", "消耗"],
    retain: true,
    exhaust: true,
  },
  breathe: {
    name: "深呼吸",
    type: "skill",
    cost: 0,
    text: "回复 1 点精神值，下回合抽牌数 -1。",
    tags: [],
  },
  boya: {
    name: "博雅塔前您博雅",
    type: "skill",
    cost: 0,
    text: "获得 5 点防御。【暑假】：获得 3 精神，并从弃牌堆选择 1 张非攻击牌置入抽牌堆顶。",
    tags: [],
  },
  reflect: {
    name: "反省",
    type: "skill",
    cost: 0,
    text: "抽 3 张牌。【暑假】：额外抽 1 张。",
    tags: [],
  },
  retreat: {
    name: "以退为进",
    type: "skill",
    cost: 0,
    text: "抽 3 张牌，然后选择弃 1 张手牌；若弃掉攻击牌，回复 1 点精神值。",
    tags: [],
  },
  redo: {
    name: "重修",
    type: "skill",
    cost: 1,
    text: "弃掉所有剩余手牌，再抽取相同数量的牌。",
    tags: [],
  },
  torment: {
    name: "煎熬",
    type: "defense",
    cost: 1,
    text: "获得 10 点防御。",
    tags: [],
  },
  rest: {
    name: "休整",
    type: "defense",
    cost: 0,
    text: "获得 6 点防御；【暑假】：额外获得 6 点防御。",
    tags: [],
  },
  call: {
    name: "呼唤",
    type: "skill",
    cost: 2,
    text: "第一阶段：从灵柩中取回 1 张牌。Boss 完成回响转化后，改为回复 1 精神。",
    tags: [],
  },
  overtake: {
    name: "弯道超车",
    type: "skill",
    cost: 0,
    text: "回复 1 点精神值。进入【暑假】。【暑假】：持续至回合结束，这一回合不能再攻击。",
    tags: ["保留"],
    retain: true,
  },
};

export const INITIAL_DECK_KEYS = [
  "insight",
  "3.92",
  "3.92",
  "3.92",
  "talk",
  "talk",
  "talk",
  "persuade",
  "persuade",
  "pause",
  "oneTen",
  "oneTen",
  "breathe",
  "breathe",
  "boya",
  "reflect",
  "reflect",
  "retreat",
  "retreat",
  "redo",
  "torment",
  "torment",
  "rest",
  "rest",
  "overtake",
  "overtake",
];

export const TYPE_LABELS = {
  attack: "攻击",
  skill: "技能",
  defense: "防御",
};

export const TWIST_TEXT = {
  pause: {
    line: "解构一切，失去一切",
    text: "获得 1 层【扭曲（暂）】：下一次技能牌无效。",
    status: "扭曲（暂）",
  },
  oneTen: {
    line: "你的理想同样不值一提",
    text: "获得 1 层【扭曲（1/10）】：每层回合结束造成 5 点伤害，可被防御阻挡。",
    status: "扭曲（1/10）",
  },
  redo: {
    line: "既无能力，遑论理想",
    text: "获得 1 层【扭曲（重修）】：下回合抽牌数 -2。",
    status: "扭曲（重修）",
  },
  torment: {
    line: "你的身体先于灵魂崩溃",
    text: "获得 1 层【扭曲（煎熬）】：下回合每次获得防御时失去 1 精神。",
    status: "扭曲（煎熬）",
  },
};
