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
    text: "精神低于 5 时可打出。造成 0 点伤害，此牌受到的力量加成为两倍；若最终伤害高于 5，回复 2 精神。",
    tags: [],
  },
  talk: {
    name: "谈笑风生",
    type: "attack",
    cost: 0,
    text: "造成 7 点伤害。若精神不低于 5，再造成 7 点伤害，并给予 Boss 1 层易伤。",
    tags: [],
  },
  persuade: {
    name: "好言相劝",
    type: "attack",
    cost: 0,
    text: "造成 5 点伤害，获得 5 点防御，玩家获得 1 层力量。",
    tags: [],
  },
  pause: {
    name: "暂",
    type: "skill",
    cost: 8,
    text: "消耗。本回合 Boss 对玩家施加的效果和造成的伤害均无效。",
    tags: [],
    exhaust: true,
  },
  oneTen: {
    name: "1/10",
    type: "skill",
    cost: 1,
    text: "给予 Boss 1 层注视，并将一张【循证】加入抽牌堆。注视 10 层时造成 50 点无视防御伤害。",
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
    text: "固有，保留，消耗。当前每有 2 点精神获得 1 层随机 buff：力量、敏捷、或回合开始抽牌 +1 后弃 1。",
    tags: ["固有", "保留", "消耗"],
    innate: true,
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
    text: "本回合还未打出攻击牌时可打出；本回合不能再打出攻击牌；回合结束回复 4 精神。",
    tags: [],
  },
  reflect: {
    name: "反省",
    type: "skill",
    cost: 0,
    text: "抽 3 张牌。若本回合未打出攻击牌，再抽 1 张牌。",
    tags: [],
  },
  retreat: {
    name: "以退为进",
    type: "skill",
    cost: 0,
    text: "抽 3，弃 1。若弃掉攻击牌，回复 1 点精神值。",
    tags: [],
  },
  redo: {
    name: "重修",
    type: "skill",
    cost: 1,
    text: "消耗 1 点精神，丢弃所有手牌，重新抽取相同数量的牌。",
    tags: [],
  },
  torment: {
    name: "煎熬",
    type: "defense",
    cost: 0,
    text: "获得 10 点防御，失去 1 点精神值。",
    tags: [],
  },
  rest: {
    name: "休整",
    type: "defense",
    cost: 0,
    text: "获得 5 点防御。若本回合还未打出攻击牌，额外获得 5 点防御。",
    tags: [],
  },
  call: {
    name: "呼唤",
    type: "skill",
    cost: 2,
    text: "第一阶段：取回一张灵柩中的牌。回响稳定后：回复 2 点精神。",
    tags: [],
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
