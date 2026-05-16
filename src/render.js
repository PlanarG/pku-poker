import { CARD_DEFS, TYPE_LABELS } from "./config.js";

export function getElements() {
  return {
    drawPileBtn: document.querySelector("#drawPileBtn"),
    discardPileBtn: document.querySelector("#discardPileBtn"),
    drawCount: document.querySelector("#drawCount"),
    discardCount: document.querySelector("#discardCount"),
    exhaustCount: document.querySelector("#exhaustCount"),
    playerHp: document.querySelector("#playerHp"),
    playerHpBar: document.querySelector("#playerHpBar"),
    playerBlock: document.querySelector("#playerBlock"),
    playerMental: document.querySelector("#playerMental"),
    bossIntent: document.querySelector("#bossIntent"),
    bossHp: document.querySelector("#bossHp"),
    bossHpBar: document.querySelector("#bossHpBar"),
    bossPhase: document.querySelector("#bossPhase"),
    coffinCount: document.querySelector("#coffinCount"),
    coffinCards: document.querySelector("#coffinCards"),
    battleMessage: document.querySelector("#battleMessage"),
    playerStatuses: document.querySelector("#playerStatuses"),
    bossStatuses: document.querySelector("#bossStatuses"),
    log: document.querySelector("#log"),
    turnLabel: document.querySelector("#turnLabel"),
    modeHint: document.querySelector("#modeHint"),
    hand: document.querySelector("#hand"),
    endTurnBtn: document.querySelector("#endTurnBtn"),
    discardBtn: document.querySelector("#discardBtn"),
    restartBtn: document.querySelector("#restartBtn"),
    playerFigure: document.querySelector("#playerFigure"),
    bossFigure: document.querySelector("#bossFigure"),
    fxLayer: document.querySelector("#fxLayer"),
    tooltip: document.querySelector("#tooltip"),
    pileModal: document.querySelector("#pileModal"),
    pileModalTitle: document.querySelector("#pileModalTitle"),
    pileModalBody: document.querySelector("#pileModalBody"),
    pileModalClose: document.querySelector("#pileModalClose"),
  };
}

export function createRenderer(els, deps) {
  function setMessage(text) {
    els.battleMessage.textContent = text;
  }

  function modeHint(state) {
    if (state.gameOver) return "可以重新开始。";
    if (state.mode === "discardForInsight") return `洞见增抽：选择 ${state.pendingDiscard} 张牌后点击弃牌。`;
    if (state.mode === "discardForRetreat") return "以退为进：选择 1 张手牌后点击弃牌。";
    if (state.mode === "discardToDrawTop") return "博雅塔前您博雅：在弃牌堆中选择 1 张非攻击牌置入抽牌堆顶。";
    if (state.mode === "retrieveCall") return "呼唤：选择 1 张灵柩中的牌取回。";
    if (state.mode === "retrieveEnd") return "未攻击回合奖励：选择 1 张灵柩牌取回，或跳过。";
    return "请选择要打出的牌。";
  }

  function render(state) {
    els.drawCount.textContent = state.drawPile.length;
    els.discardCount.textContent = state.discardPile.length;
    els.exhaustCount.textContent = state.exhaustPile.length;
    els.playerHp.textContent = `${state.player.hp} / ${state.player.maxHp}`;
    els.playerHpBar.style.width = `${(state.player.hp / state.player.maxHp) * 100}%`;
    els.playerBlock.textContent = `防御 ${state.player.block}`;
    els.playerMental.textContent = `精神 ${state.player.mental} / ${state.player.maxMental}`;
    els.bossHp.textContent = `${state.boss.hp} / ${state.boss.maxHp}`;
    els.bossHpBar.style.width = `${(state.boss.hp / state.boss.maxHp) * 100}%`;
    els.bossPhase.textContent = `阶段：${state.boss.phase === 1 ? "封存" : "回响"}`;
    els.bossFigure.classList.toggle("echo", state.boss.phase === 2);
    els.coffinCount.textContent = state.coffin.length;
    els.turnLabel.textContent = state.gameOver ? "战斗结束" : `玩家回合 ${state.turn}`;
    els.modeHint.textContent = modeHint(state);
    els.endTurnBtn.textContent = state.mode === "retrieveEnd" ? "跳过取回" : "结束回合";
    els.endTurnBtn.disabled = state.gameOver;
    els.discardBtn.hidden = !deps.isDiscardMode();
    els.discardBtn.disabled = state.selectedDiscardIds.length !== state.pendingDiscard;
    els.discardBtn.textContent = `弃牌 ${state.selectedDiscardIds.length} / ${state.pendingDiscard}`;

    renderIntent(deps.bossIntent());
    renderHand(state);
    renderCoffin(state);
    renderStatuses(state);
    renderLog(state);
  }

  function renderIntent(intent) {
    els.bossIntent.innerHTML = `
      <div class="intent-row intent-damage"><span>伤害</span><strong>${intent.damage || "无"}</strong></div>
      <div class="intent-row intent-status"><span>状态</span><strong>${intent.statuses.length ? intent.statuses.join(" / ") : "无"}</strong></div>
    `;
    els.bossIntent.dataset.tip = intent.tip;
  }

  function renderHand(state) {
    els.hand.innerHTML = "";
    state.hand.forEach((card) => {
      const def = deps.cardDef(card);
      const reason = deps.playableReason(card);
      const element = document.createElement("button");
      element.className = `card ${def.type}`;
      if (reason && !state.mode) element.classList.add("disabled");
      if (deps.isDiscardMode()) element.classList.add("selectable");
      if (state.selectedDiscardIds.includes(card.id)) element.classList.add("selected");
      element.dataset.cardId = String(card.id);
      element.dataset.tip = `${TYPE_LABELS[def.type]}。${def.text}${reason ? `\n当前不可打出：${reason}` : ""}`;
      element.innerHTML = `
        <div class="card-header">
          <span>${def.name}</span>
          <span class="card-cost">${deps.cardCost(card)}</span>
        </div>
        <div class="card-body">${deps.cardText(card)}</div>
        <div class="card-footer">
          <span>${TYPE_LABELS[def.type]}</span>
          <span>${def.tags.join(" ")}</span>
        </div>
      `;
      els.hand.appendChild(element);
    });
  }

  function renderCoffin(state) {
    els.coffinCards.innerHTML = "";
    if (state.coffin.length === 0) {
      const empty = document.createElement("span");
      empty.className = "mini-card";
      empty.textContent = "空";
      empty.dataset.tip = "当前没有被封存的牌。";
      els.coffinCards.appendChild(empty);
      return;
    }
    state.coffin.forEach((card) => {
      const def = deps.cardDef(card);
      const item = document.createElement("button");
      item.className = "mini-card";
      if (state.mode === "retrieveCall" || state.mode === "retrieveEnd") item.classList.add("selectable");
      item.dataset.coffinId = String(card.id);
      item.dataset.tip = `${def.name}：${def.text}`;
      item.textContent = def.name;
      els.coffinCards.appendChild(item);
    });
  }

  function renderStatuses(state) {
    els.playerStatuses.innerHTML = "";
    playerStatusItems(state).forEach((item) => els.playerStatuses.appendChild(item));

    els.bossStatuses.innerHTML = "";
    bossStatusItems(state).forEach((item) => els.bossStatuses.appendChild(item));
  }

  function statusItem(name, value, tip) {
    const span = document.createElement("span");
    span.className = "status";
    span.textContent = `${name}${value ? ` ${value}` : ""}`;
    span.dataset.tip = tip;
    return span;
  }

  function playerStatusItems(state) {
    const p = state.player;
    const items = [];
    if (p.strength) items.push(statusItem("力量", p.strength, "每段攻击伤害增加对应数值。"));
    if (p.dexterity) items.push(statusItem("敏捷", p.dexterity, "每次获得防御时增加对应数值。"));
    if (p.drawDiscard) items.push(statusItem("抽弃", p.drawDiscard, "每回合开始额外抽牌，然后必须弃同等张数。"));
    if (p.hollow) items.push(statusItem("空洞", p.hollow, "获得精神值时，每层抵消实际获得的 1 点精神，并让 Boss 回复 5 点生命。"));
    if (p.muddled) items.push(statusItem("茫然", p.muddled, "每层在回合结束后扣除 2 点精神。"));
    if (p.twistTemp) items.push(statusItem("扭曲（暂）", p.twistTemp, "下一次使用的技能牌无效，生效后减少。"));
    if (p.twistOneTen) items.push(statusItem("扭曲（1/10）", p.twistOneTen, "每层在回合结束造成 5 点可被防御抵挡的伤害，不自动减少。"));
    if (p.twistRedo) items.push(statusItem("扭曲（重修）", p.twistRedo, "下回合开始少抽 2 张，生效后减少。"));
    if (p.twistTorment) items.push(statusItem("扭曲（煎熬）", p.twistTorment, "下回合每次获得防御时失去 1 精神，回合结束后减少。"));
    if (p.bossNegated) items.push(statusItem("暂", "", "本次 Boss 行动的伤害和效果无效。"));
    if (p.summer) items.push(statusItem("暑假", "", "持续至回合结束。本回合不能再打出攻击牌。"));
    if (p.attackLocked) items.push(statusItem("禁止攻击", "", "本回合不能再打出攻击牌。"));
    return items;
  }

  function bossStatusItems(state) {
    const b = state.boss;
    const items = [];
    if (b.vulnerable) items.push(statusItem("易伤", b.vulnerable, "受到攻击伤害提高 50%。"));
    if (b.gaze) items.push(statusItem("注视", b.gaze, "达到 10 层时造成 50 点无视防御伤害，然后减少 10 层。"));
    if (state.coffin.length) items.push(statusItem("攻击加成", `+${state.coffin.length * 20}%`, "灵柩中每有一张牌，Boss 攻击提高 20%。"));
    if (b.highestTwistCard) {
      items.push(statusItem("记录", CARD_DEFS[b.highestTwistCard].name, "第二阶段攻击后会释放这张牌的扭曲形态。"));
    }
    if (b.lastLine) items.push(statusItem("台词", "", b.lastLine));
    return items;
  }

  function renderLog(state) {
    els.log.innerHTML = "";
    state.log.forEach((entry) => {
      const line = document.createElement("div");
      line.textContent = entry;
      els.log.appendChild(line);
    });
  }

  function openPileModal(title, cards, emptyText, options = {}) {
    els.pileModalTitle.textContent = title;
    els.pileModalBody.innerHTML = "";
    if (cards.length === 0) {
      const empty = document.createElement("div");
      empty.className = "pile-empty";
      empty.textContent = emptyText;
      els.pileModalBody.appendChild(empty);
    } else {
      cards.forEach((card, index) => {
        const def = deps.cardDef(card);
        const row = document.createElement("div");
        row.className = `pile-row ${def.type}`;
        if (options.discardToDrawTop && def.type !== "attack") {
          row.classList.add("selectable");
          row.dataset.discardIndex = String(index);
        }
        row.dataset.tip = def.text;
        row.innerHTML = `<span>${index + 1}. ${def.name}</span><small>${TYPE_LABELS[def.type]}</small>`;
        els.pileModalBody.appendChild(row);
      });
    }
    els.pileModal.hidden = false;
  }

  function closePileModal() {
    els.pileModal.hidden = true;
  }

  function bindTooltip() {
    document.addEventListener("mousemove", (event) => {
      const target = event.target.closest("[data-tip]");
      if (!target || !target.dataset.tip) {
        els.tooltip.hidden = true;
        return;
      }
      els.tooltip.hidden = false;
      els.tooltip.textContent = target.dataset.tip;
      const pad = 14;
      const rect = els.tooltip.getBoundingClientRect();
      let left = event.clientX + pad;
      let top = event.clientY + pad;
      if (left + rect.width > window.innerWidth - 8) left = event.clientX - rect.width - pad;
      if (top + rect.height > window.innerHeight - 8) top = event.clientY - rect.height - pad;
      els.tooltip.style.left = `${Math.max(8, left)}px`;
      els.tooltip.style.top = `${Math.max(8, top)}px`;
    });

    document.addEventListener("mouseleave", () => {
      els.tooltip.hidden = true;
    });
  }

  return {
    bindTooltip,
    closePileModal,
    openPileModal,
    render,
    setMessage,
  };
}
