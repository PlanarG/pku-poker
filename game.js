import { PLAYER_CONFIG, TWIST_TEXT } from "./src/config.js";
import { createEffects } from "./src/effects.js";
import { createRenderer, getElements } from "./src/render.js";
import { cardDef, createInitialState, makeCard, shuffle } from "./src/state.js";

const els = getElements();
const effects = createEffects(els);
let state;

const renderer = createRenderer(els, {
  bossIntent,
  cardDef,
  cardText,
  cardCost,
  isDiscardMode,
  playableReason,
});

function addLog(text) {
  state.log.unshift(text);
  state.log = state.log.slice(0, 12);
}

function setMessage(text) {
  renderer.setMessage(text);
}

function render() {
  renderer.render(state);
}

function startGame() {
  state = createInitialState();
  addLog("战斗开始。");
  startPlayerTurn();
}

function startPlayerTurn() {
  if (state.gameOver) return;
  state.turn += 1;
  state.mode = null;
  state.pendingDiscard = 0;
  state.selectedDiscardIds = [];
  state.player.block = 0;
  state.player.attacksThisTurn = 0;
  state.player.attackLocked = false;
  state.player.summer = false;
  state.player.mentalRecoveriesThisTurn = 0;
  state.player.twistTormentActive = state.player.twistTorment > 0;

  let drawCount = PLAYER_CONFIG.baseDraw + state.player.drawDiscard - state.player.nextDrawPenalty;
  if (state.player.twistRedo > 0) {
    drawCount -= 2;
    state.player.twistRedo -= 1;
    addLog("【扭曲（重修）】生效，本回合少抽 2 张。");
  }
  state.player.nextDrawPenalty = 0;
  drawCount = Math.max(0, drawCount);

  drawCards(drawCount);
  state.hand.forEach((card) => {
    card.fresh = false;
  });

  if (state.player.drawDiscard > 0 && state.hand.length > 0) {
    state.mode = "discardForInsight";
    state.pendingDiscard = Math.min(state.player.drawDiscard, state.hand.length);
    state.selectedDiscardIds = [];
    setMessage(`洞见增抽需要弃 ${state.pendingDiscard} 张牌。选好后点击弃牌。`);
  } else {
    setMessage("点击手牌开始行动。");
  }

  addLog(`玩家回合 ${state.turn} 开始，抽 ${drawCount} 张牌。`);
  render();
}

function drawCards(count) {
  for (let i = 0; i < count; i += 1) {
    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) return;
      state.drawPile = shuffle(state.discardPile);
      state.discardPile = [];
      addLog("弃牌堆洗入抽牌堆。");
    }
    state.hand.push(state.drawPile.pop());
  }
}

function gainMental(amount) {
  const before = state.player.mental;
  let gain = Math.min(amount, state.player.maxMental - state.player.mental);
  if (gain <= 0) {
    addLog("精神值已满，没有获得精神。");
    return 0;
  }
  while (gain > 0 && state.player.hollow > 0) {
    state.player.hollow -= 1;
    healBoss(5);
    gain -= 1;
    addLog("【空洞】抵消 1 点精神回复，Boss 回复 5 点生命。");
  }
  if (gain > 0) {
    state.player.mental = Math.min(state.player.maxMental, state.player.mental + gain);
  }
  const actualGain = state.player.mental - before;
  if (actualGain > 0) state.player.mentalRecoveriesThisTurn += 1;
  return actualGain;
}

function loseMental(amount) {
  state.player.mental = Math.max(0, state.player.mental - amount);
}

function healBoss(amount) {
  state.boss.hp = Math.min(state.boss.maxHp, state.boss.hp + amount);
}

function spendMental(cardKey, amount) {
  loseMental(amount);
  recordMentalSpend(cardKey, amount);
}

function recordMentalSpend(cardKey, amount) {
  if (Object.prototype.hasOwnProperty.call(TWIST_TEXT, cardKey) && amount > state.boss.highestTwistSpend) {
    state.boss.highestTwistSpend = amount;
    state.boss.highestTwistCard = cardKey;
  }
}

function gainBlock(base) {
  const amount = Math.max(0, base + state.player.dexterity);
  state.player.block += amount;
  if (state.player.twistTormentActive) {
    loseMental(1);
    addLog("【扭曲（煎熬）】触发，获得防御时失去 1 点精神。");
  }
  return amount;
}

function dealBossDamage(base, sourceName, options = {}) {
  let damage = Math.max(0, base + state.player.strength * (options.strengthMultiplier || 1));
  if (state.boss.vulnerable > 0) {
    damage = Math.floor(damage * 1.5);
  }
  state.boss.hp = Math.max(0, state.boss.hp - damage);
  if (damage > 0) effects.animateDamage("boss", damage);
  addLog(`${sourceName}造成 ${damage} 点伤害。`);
  checkGaze();
  checkBossPhase();
  checkWin();
  return damage;
}

function checkGaze() {
  while (state.boss.gaze >= 10 && state.boss.hp > 0) {
    state.boss.gaze -= 10;
    state.boss.hp = Math.max(0, state.boss.hp - 50);
    effects.animateDamage("boss", 50);
    addLog("【注视】达到 10 层，造成 50 点无视防御伤害。");
    checkBossPhase();
  }
}

function checkBossPhase() {
  if (state.boss.phase === 1 && state.boss.hp > 0 && state.boss.hp < state.boss.maxHp / 2) {
    state.boss.phase = 2;
    state.boss.echoTransition = true;
    state.boss.callRestores = false;
    addLog("Boss 血量低于一半，当前意图变为【回响转化】。");
  }
}

function checkWin() {
  if (state.boss.hp <= 0 && !state.gameOver) {
    state.gameOver = true;
    setMessage("Boss 被击败。");
    addLog("战斗胜利。");
  }
}

function checkLose() {
  if (state.player.hp <= 0 && !state.gameOver) {
    state.gameOver = true;
    setMessage("玩家生命归零。");
    addLog("战斗失败。");
  }
}

function receivePlayerDamage(amount, ignoreBlock = false, source = "Boss") {
  let damage = Math.max(0, amount);
  const incoming = damage;
  if (!ignoreBlock) {
    const blocked = Math.min(state.player.block, damage);
    state.player.block -= blocked;
    damage -= blocked;
  }
  state.player.hp = Math.max(0, state.player.hp - damage);
  if (damage > 0) {
    effects.animateDamage("player", damage);
  } else if (incoming > 0) {
    effects.animateDamage("player", 0, true);
  }
  addLog(`${source}造成 ${damage} 点伤害。`);
  checkLose();
  return damage;
}

function bossAttackDamage(base) {
  return Math.round(base * (1 + state.coffin.length * 0.2));
}

function playableReason(card) {
  const def = cardDef(card);
  if (state.gameOver) return "战斗已经结束。";
  if (state.mode) return "请先完成当前选择。";
  if (state.player.mental < cardCost(card)) return "精神值不足。";
  if (def.type === "attack" && state.player.attackLocked) return "本回合已被限制不能再打出攻击牌。";
  if (card.key === "3.92" && state.player.mental >= 5) return "精神值低于 5 时才能打出。";
  return "";
}

function cardText(card) {
  const def = cardDef(card);
  let text = card.key === "call" ? currentCallText() : def.text;

  if (def.type === "attack") {
    const damageMap = {
      "3.92": [0],
      talk: state.player.mental >= 5 ? [5, 5] : [5],
      persuade: [7],
      oneTen: [5],
    };
    const damages = damageMap[card.key];
    let damageSegment = 0;
    text = text.replace(/(\d+)( 点(?:基础)?伤害)/g, (match, number, suffix) => {
      const base = Number(number);
      if (!damages || damageSegment >= damages.length || base !== damages[damageSegment]) return match;
      const actual = actualAttackDamage(base, card);
      damageSegment += 1;
      return `${number}<span class="actual-value">(${actual})</span>${suffix}`;
    });
  }

  let blockSegment = 0;
  text = text.replace(/(\d+)( 点防御)/g, (match, number, suffix) => {
    const actual = actualBlockGain(card, Number(number), blockSegment);
    blockSegment += 1;
    return `${number}<span class="actual-value">(${actual})</span>${suffix}`;
  });

  let mentalSegment = 0;
  text = text.replace(/(回复 )(\d+)( 点精神值| 点精神| 精神值| 精神)/g, (match, prefix, number, suffix) => {
    const actual = actualMentalGain(card, Number(number), mentalSegment);
    mentalSegment += 1;
    return `${prefix}${number}<span class="actual-value">(${actual})</span>${suffix}`;
  });

  return text;
}

function currentCallText() {
  return isCallRestoring() ? "回复 1 精神。" : "从灵柩中取回 1 张牌。";
}

function cardCost(card) {
  if (card.key === "call" && isCallRestoring()) return 0;
  if (card.key === "pause") return Math.max(0, cardDef(card).cost - state.player.mentalRecoveriesThisTurn);
  return cardDef(card).cost;
}

function isCallRestoring() {
  return state.boss.phase === 2 && state.boss.callRestores;
}

function actualAttackDamage(base, card = null) {
  const strengthMultiplier = card?.key === "3.92" ? 2 : 1;
  let damage = Math.max(0, base + state.player.strength * strengthMultiplier);
  if (state.boss.vulnerable > 0) {
    damage = Math.floor(damage * 1.5);
  }
  return damage;
}

function actualBlockGain(card, base, segment) {
  if (card.key === "rest" && segment === 1 && !state.player.summer) return 0;
  return Math.max(0, base + state.player.dexterity);
}

function actualMentalGain(card, base) {
  if (card.key === "3.92" && actualAttackDamage(0, card) <= 5) return 0;
  if (card.key === "call" && !isCallRestoring()) return 0;
  if (card.key === "boya" && !state.player.summer) return 0;

  const mentalAfterCost = Math.max(0, state.player.mental - cardCost(card));
  const possibleGain = Math.min(base, state.player.maxMental - mentalAfterCost);
  return Math.max(0, possibleGain - state.player.hollow);
}

function playCard(cardId, sourceElement = null) {
  const index = state.hand.findIndex((card) => card.id === cardId);
  if (index < 0) return;
  const card = state.hand[index];
  const def = cardDef(card);
  const reason = playableReason(card);
  if (reason) {
    setMessage(reason);
    render();
    return;
  }

  effects.animateCardElement(sourceElement, def.type === "attack" ? "attack" : "play");
  effects.flashPlayedCard(sourceElement);
  state.hand.splice(index, 1);
  spendMental(card.key, cardCost(card));
  const destination = def.exhaust ? state.exhaustPile : state.discardPile;

  if (state.player.twistTemp > 0 && def.type === "skill") {
    state.player.twistTemp -= 1;
    destination.push(card);
    addLog(`【扭曲（暂）】使【${def.name}】无效。`);
    setMessage(`【${def.name}】被扭曲无效。`);
    render();
    return;
  }

  if (def.type === "attack") {
    state.player.attacksThisTurn += 1;
  }

  switch (card.key) {
    case "3.92": {
      const damage = dealBossDamage(0, "【3.92】", { strengthMultiplier: 2 });
      if (damage > 5) gainMental(2);
      break;
    }
    case "talk": {
      dealBossDamage(5, "【谈笑风生】");
      if (state.player.mental >= 5 && state.boss.hp > 0) {
        dealBossDamage(5, "【谈笑风生】追加");
      }
      break;
    }
    case "persuade":
      dealBossDamage(7, "【好言相劝】");
      gainBlock(5);
      state.player.strength += 1;
      addLog("【好言相劝】使玩家获得 1 层【力量】。");
      break;
    case "pause":
      state.player.bossNegated = true;
      addLog("【暂】将无效化本回合 Boss 的伤害和效果。");
      break;
    case "oneTen":
      dealBossDamage(5, "【1/10】");
      state.boss.gaze += 1;
      state.drawPile.push(makeCard("evidence"));
      state.drawPile.push(makeCard("evidence"));
      addLog("Boss 获得 1 层【注视】，2 张【循证】加入抽牌堆。");
      checkGaze();
      break;
    case "evidence":
      if (state.boss.gaze > 0) {
        state.boss.gaze += 1;
        if (state.player.mental > 5) state.boss.gaze += 1;
        addLog("【循证】追加【注视】层数。");
        checkGaze();
      } else {
        addLog("Boss 没有【注视】，【循证】未施加层数。");
      }
      break;
    case "insight": {
      const layers = Math.floor(state.player.mental / 2);
      const gained = [];
      for (let i = 0; i < layers; i += 1) {
        const roll = Math.floor(Math.random() * 3);
        if (roll === 0) {
          state.player.strength += 1;
          gained.push("力量 +1");
        } else if (roll === 1) {
          state.player.dexterity += 1;
          gained.push("敏捷 +1");
        } else {
          state.player.drawDiscard += 1;
          gained.push("回合开始抽牌 +1 后弃 1");
        }
      }
      addLog(layers > 0 ? `【洞见】获得 ${layers} 层效果：${gained.join("、")}。` : "【洞见】没有获得效果。");
      break;
    }
    case "breathe":
      gainMental(1);
      state.player.nextDrawPenalty += 1;
      addLog("【深呼吸】回复精神，下回合抽牌 -1。");
      break;
    case "boya":
      gainBlock(5);
      if (state.player.summer) {
        gainMental(3);
        if (state.discardPile.some((discardedCard) => cardDef(discardedCard).type !== "attack")) {
          state.mode = "discardToDrawTop";
          setMessage("请选择 1 张弃牌堆中的非攻击牌置入抽牌堆顶。");
          renderer.openPileModal("选择置入抽牌堆顶", state.discardPile, "弃牌堆为空。", { discardToDrawTop: true });
        } else {
          addLog("弃牌堆中没有可置入抽牌堆顶的非攻击牌。");
        }
      }
      break;
    case "reflect":
      drawCards(state.player.summer ? 4 : 3);
      addLog("【反省】抽牌。");
      break;
    case "retreat":
      drawCards(3);
      if (state.hand.length > 0) {
        state.mode = "discardForRetreat";
        state.pendingDiscard = 1;
        state.selectedDiscardIds = [];
        setMessage("请选择 1 张牌，点击弃牌确认。若弃掉攻击牌，回复 1 点精神。");
      }
      break;
    case "redo": {
      const redraw = state.hand.length;
      state.hand.forEach((handCard) => {
        const cardElement = els.hand.querySelector(`[data-card-id="${handCard.id}"]`);
        effects.animateCardElement(cardElement, "discard");
      });
      state.discardPile.push(...state.hand);
      state.hand = [];
      drawCards(redraw);
      addLog(`【重修】弃掉所有手牌并重抽 ${redraw} 张。`);
      break;
    }
    case "torment":
      gainBlock(10);
      addLog("【煎熬】获得防御。");
      break;
    case "rest":
      gainBlock(6);
      if (state.player.summer) gainBlock(6);
      break;
    case "call":
      if (isCallRestoring()) {
        gainMental(1);
        addLog("【呼唤】在回响中转为回复 1 点精神。");
      } else if (state.coffin.length > 0 && state.boss.phase === 1) {
        state.mode = "retrieveCall";
        setMessage("请选择 1 张灵柩中的牌取回。");
      } else {
        addLog("【呼唤】没有可取回的牌。");
      }
      break;
    case "overtake":
      gainMental(1);
      state.player.summer = true;
      state.player.attackLocked = true;
      addLog("【弯道超车】回复精神并进入【暑假】，本回合不能再打出攻击牌。");
      break;
    default:
      break;
  }

  destination.push(card);
  if (!state.mode) setMessage(`打出了【${def.name}】。`);
  render();
}

function isDiscardMode() {
  return state?.mode === "discardForInsight" || state?.mode === "discardForRetreat";
}

function toggleDiscardSelection(cardId) {
  if (!isDiscardMode()) return;
  const selected = state.selectedDiscardIds;
  if (selected.includes(cardId)) {
    state.selectedDiscardIds = selected.filter((id) => id !== cardId);
  } else if (selected.length < state.pendingDiscard) {
    state.selectedDiscardIds = [...selected, cardId];
  } else {
    setMessage(`最多选择 ${state.pendingDiscard} 张牌。`);
    render();
    return;
  }
  setMessage(`已选择 ${state.selectedDiscardIds.length} / ${state.pendingDiscard} 张，选好后点击弃牌。`);
  render();
}

function confirmDiscardSelection() {
  if (!isDiscardMode()) return;
  if (state.selectedDiscardIds.length !== state.pendingDiscard) {
    setMessage(`需要选择 ${state.pendingDiscard} 张牌后才能弃牌。`);
    render();
    return;
  }

  const reason = state.mode === "discardForRetreat" ? "retreat" : "insight";
  const selectedIds = [...state.selectedDiscardIds];
  selectedIds.forEach((cardId) => {
    const cardElement = els.hand.querySelector(`[data-card-id="${cardId}"]`);
    effects.animateCardElement(cardElement, "discard");
  });

  const discarded = [];
  state.hand = state.hand.filter((card) => {
    if (!selectedIds.includes(card.id)) return true;
    discarded.push(card);
    return false;
  });
  state.discardPile.push(...discarded);

  discarded.forEach((card) => {
    const def = cardDef(card);
    if (reason === "retreat" && def.type === "attack") {
      gainMental(1);
      addLog("【以退为进】弃掉攻击牌，回复 1 点精神。");
    } else {
      addLog(`弃掉【${def.name}】。`);
    }
  });

  state.mode = null;
  state.pendingDiscard = 0;
  state.selectedDiscardIds = [];
  setMessage("弃牌完成，可以继续行动。");
  render();
}

function chooseDiscardToDrawTop(discardIndex) {
  if (state.mode !== "discardToDrawTop") return;
  const card = state.discardPile[discardIndex];
  if (!card) return;
  const def = cardDef(card);
  if (def.type === "attack") {
    setMessage("只能选择非攻击牌。");
    render();
    return;
  }
  state.discardPile.splice(discardIndex, 1);
  state.drawPile.push(card);
  state.mode = null;
  renderer.closePileModal();
  addLog(`【${def.name}】置入抽牌堆顶。`);
  setMessage("已将弃牌置入抽牌堆顶，可以继续行动。");
  render();
}

function retrieveCoffinCard(cardId, toHand = true) {
  const index = state.coffin.findIndex((card) => card.id === cardId);
  if (index < 0) return;
  const [card] = state.coffin.splice(index, 1);
  if (toHand) {
    state.hand.push(card);
  } else {
    state.discardPile.push(card);
  }
  addLog(`取回【${cardDef(card).name}】。`);
  const mode = state.mode;
  state.mode = null;
  setMessage("已取回封存牌。");
  render();
  if (mode === "retrieveEnd") {
    finishTurnAfterRetrieve();
  }
}

function requestEndTurn() {
  if (state.gameOver) return;
  if (state.mode && state.mode !== "retrieveEnd") {
    setMessage("请先完成当前选择。");
    render();
    return;
  }
  if (state.mode === "retrieveEnd") {
    state.mode = null;
    addLog("跳过取回封存牌。");
    finishTurnAfterRetrieve();
    return;
  }
  if (state.boss.phase === 1 && state.player.attacksThisTurn === 0 && state.coffin.length > 0) {
    state.mode = "retrieveEnd";
    setMessage("本回合没有打出攻击牌，可以从灵柩取回 1 张牌。点击灵柩牌取回，或再次结束回合跳过。");
    render();
    return;
  }
  finishTurnAfterRetrieve();
}

function finishTurnAfterRetrieve() {
  state.player.summer = false;
  state.player.attackLocked = false;
  if (state.player.muddled > 0) {
    loseMental(state.player.muddled * 2);
    addLog(`【茫然】扣除 ${state.player.muddled * 2} 点精神。`);
  }
  if (state.player.twistOneTen > 0) {
    receivePlayerDamage(state.player.twistOneTen * 5, false, "【扭曲（1/10）】");
  }
  if (state.player.twistTormentActive && state.player.twistTorment > 0) {
    state.player.twistTorment -= 1;
    state.player.twistTormentActive = false;
  }
  bossTurn();
  cleanupHand();
  if (!state.gameOver) startPlayerTurn();
  render();
}

function cleanupHand() {
  const kept = [];
  for (const card of state.hand) {
    const def = cardDef(card);
    if (def.retain || card.fresh) {
      kept.push(card);
    } else {
      const cardElement = els.hand.querySelector(`[data-card-id="${card.id}"]`);
      effects.animateCardElement(cardElement, "discard");
      state.discardPile.push(card);
    }
  }
  state.hand = kept;
  state.player.bossNegated = false;
}

function bossTurn() {
  if (state.gameOver) return;
  if (state.player.bossNegated) {
    addLog("【暂】无效化了 Boss 本次行动。");
    if (state.boss.phase === 1) {
      advanceBossPattern();
    } else if (state.boss.echoTransition) {
      finishEchoTransition(false);
    }
    finishBossTurn();
    return;
  }

  if (state.boss.phase === 1) {
    const action = state.boss.phaseOneIndex % 2;
    effects.animateBossAttack();
    receivePlayerDamage(bossAttackDamage(20), false, "Boss 攻击");
    if (state.gameOver) {
      finishBossTurn();
      return;
    }
    if (action === 0) {
      bossSeal();
    } else {
      state.player.hollow += 3;
      addLog("Boss 施加 3 层【空洞】。");
    }
    advanceBossPattern();
  } else if (state.boss.echoTransition) {
    finishEchoTransition(true);
  } else {
    effects.animateBossAttack();
    receivePlayerDamage(bossAttackDamage(30), false, "Boss 回响攻击");
    if (!state.gameOver) releaseTwist();
  }

  finishBossTurn();
}

function finishBossTurn() {
  if (state.boss.vulnerable > 0) {
    state.boss.vulnerable -= 1;
    addLog("Boss 的【易伤】减少 1 层。");
  }
}

function advanceBossPattern() {
  state.boss.phaseOneIndex += 1;
}

function bossSeal() {
  const candidates = state.hand.filter((card) => !cardDef(card).retain);
  if (candidates.length === 0) {
    addLog("Boss 试图封存手牌，但没有可封存的牌。");
    return;
  }
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  state.hand = state.hand.filter((card) => card.id !== picked.id);
  state.coffin.push(picked);
  state.hand.push(makeCard("call", { fresh: true }));
  addLog(`Boss 将【${cardDef(picked).name}】封入灵柩，并加入一张【呼唤】。`);
}

function finishEchoTransition(applyPlayerEffects) {
  state.boss.echoTransition = false;
  state.boss.callRestores = true;
  state.player.hollow = 0;

  if (applyPlayerEffects) {
    const coffinHits = state.coffin.length;
    if (coffinHits > 0) {
      receivePlayerDamage(coffinHits * 10, false, "灵柩打开");
    }
    state.player.muddled += 1;
    addLog(`Boss 完成【回响转化】：灵柩中 ${coffinHits} 张牌造成伤害，玩家获得 1 层【茫然】。`);
  } else {
    addLog("【回响转化】被无效化，伤害和【茫然】没有生效。");
  }

  addLog("【呼唤】改为回复 1 点精神。");
}

function releaseTwist() {
  const key = state.boss.highestTwistCard;
  if (!key || !TWIST_TEXT[key]) {
    addLog("Boss 没有记录到可释放的扭曲形态。");
    return;
  }
  const twist = TWIST_TEXT[key];
  state.boss.lastLine = twist.line;
  if (key === "pause") state.player.twistTemp += 1;
  if (key === "oneTen") state.player.twistOneTen += 1;
  if (key === "redo") state.player.twistRedo += 1;
  if (key === "torment") state.player.twistTorment += 1;
  addLog(`Boss：“${twist.line}”。${twist.text}`);
}

function bossIntent() {
  if (state.boss.phase === 1) {
    const action = state.boss.phaseOneIndex % 2;
    const damage = bossAttackDamage(20);
    const bonus = Math.round((1 + state.coffin.length * 0.2) * 100);
    if (action === 0) {
      return {
        damage,
        statuses: ["封存"],
        tip: `先造成 20 点基础伤害，然后理想封存：随机封存玩家手牌中的一张非保留牌，并加入一张【呼唤】。当前灵柩攻击倍率 ${bonus}%。`,
      };
    }
    return {
      damage,
      statuses: ["空洞 3"],
      tip: `先造成 20 点基础伤害，然后深渊邀约：施加 3 层【空洞】。空洞会抵消精神回复，并让 Boss 回复生命。当前灵柩攻击倍率 ${bonus}%。`,
    };
  }
  if (state.boss.echoTransition) {
    return {
      damage: state.coffin.length * 10,
      statuses: ["茫然 1", "移除空洞"],
      tip: "回响转化：Boss 回合行动。灵柩中每有一张牌对玩家造成 10 点伤害，给予 1 层【茫然】，移除【空洞】，之后【呼唤】变为回复 1 精神。",
    };
  }

  const twistStatus = state.boss.highestTwistCard ? TWIST_TEXT[state.boss.highestTwistCard]?.status : null;
  return {
    damage: bossAttackDamage(30),
    statuses: twistStatus ? [twistStatus] : [],
    tip: "回响攻击：造成 30 点基础伤害，随后释放记录牌的扭曲形态。",
  };
}

function openDrawPile() {
  const cardsByName = [...state.drawPile].sort((a, b) => cardDef(a).name.localeCompare(cardDef(b).name, "zh-Hans-CN"));
  renderer.openPileModal("抽牌堆：字典序", cardsByName, "抽牌堆为空。");
}

function openDiscardPile() {
  renderer.openPileModal(
    state.mode === "discardToDrawTop" ? "选择置入抽牌堆顶" : "弃牌堆：弃置顺序",
    state.discardPile,
    "弃牌堆为空。",
    { discardToDrawTop: state.mode === "discardToDrawTop" },
  );
}

els.hand.addEventListener("click", (event) => {
  const cardEl = event.target.closest("[data-card-id]");
  if (!cardEl) return;
  const cardId = Number(cardEl.dataset.cardId);
  if (isDiscardMode()) {
    toggleDiscardSelection(cardId);
    return;
  }
  playCard(cardId, cardEl);
});

els.coffinCards.addEventListener("click", (event) => {
  const cardEl = event.target.closest("[data-coffin-id]");
  if (!cardEl) return;
  if (state.mode !== "retrieveCall" && state.mode !== "retrieveEnd") return;
  retrieveCoffinCard(Number(cardEl.dataset.coffinId), true);
});

els.endTurnBtn.addEventListener("click", requestEndTurn);
els.discardBtn.addEventListener("click", confirmDiscardSelection);
els.restartBtn.addEventListener("click", startGame);
els.drawPileBtn.addEventListener("click", openDrawPile);
els.discardPileBtn.addEventListener("click", openDiscardPile);
els.pileModalClose.addEventListener("click", renderer.closePileModal);
els.pileModal.addEventListener("click", (event) => {
  const discardRow = event.target.closest("[data-discard-index]");
  if (discardRow) {
    chooseDiscardToDrawTop(Number(discardRow.dataset.discardIndex));
    return;
  }
  if (event.target === els.pileModal) renderer.closePileModal();
});

renderer.bindTooltip();
startGame();
