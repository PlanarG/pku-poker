import { BOSS_CONFIG, CARD_DEFS, INITIAL_DECK_KEYS, PLAYER_CONFIG } from "./config.js";

let nextId = 1;

export function makeCard(key, extra = {}) {
  return {
    id: nextId++,
    key,
    fresh: false,
    ...extra,
  };
}

export function cardDef(cardOrKey) {
  const key = typeof cardOrKey === "string" ? cardOrKey : cardOrKey.key;
  return CARD_DEFS[key];
}

export function shuffle(cards) {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createInitialState() {
  nextId = 1;
  const deck = INITIAL_DECK_KEYS.map((key) => makeCard(key));
  const innate = deck.filter((card) => cardDef(card).innate);
  const rest = deck.filter((card) => !cardDef(card).innate);

  return {
    turn: 0,
    gameOver: false,
    mode: null,
    pendingDiscard: 0,
    selectedDiscardIds: [],
    drawPile: shuffle(rest),
    discardPile: [],
    exhaustPile: [],
    hand: innate,
    coffin: [],
    log: [],
    player: {
      hp: PLAYER_CONFIG.hp,
      maxHp: PLAYER_CONFIG.hp,
      mental: PLAYER_CONFIG.initialMental,
      maxMental: PLAYER_CONFIG.maxMental,
      block: 0,
      strength: 0,
      dexterity: 0,
      drawDiscard: 0,
      nextDrawPenalty: 0,
      attacksThisTurn: 0,
      attackLocked: false,
      boyaRecover: 0,
      bossNegated: false,
      hollow: 0,
      muddled: 0,
      twistTemp: 0,
      twistOneTen: 0,
      twistRedo: 0,
      twistTorment: 0,
      twistTormentActive: false,
    },
    boss: {
      hp: BOSS_CONFIG.hp,
      maxHp: BOSS_CONFIG.hp,
      phase: 1,
      phaseOneIndex: 0,
      vulnerable: 0,
      gaze: 0,
      echoTransition: false,
      callRestores: false,
      highestTwistCard: null,
      highestTwistSpend: -1,
      lastLine: "",
    },
  };
}
