const CARD_ANIMATION_MS = 900;
const FLOAT_TEXT_MS = 1200;
const HIT_ANIMATION_MS = 650;
const LUNGE_ANIMATION_MS = 800;
const FLASH_ANIMATION_MS = 500;

function animateClass(element, className, duration = CARD_ANIMATION_MS) {
  if (!element) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => element.classList.remove(className), duration);
}

function centerOf(element) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function createEffects(els) {
  function animateCardElement(cardElement, kind) {
    if (!cardElement) return;
    const clone = cardElement.cloneNode(true);
    const from = cardElement.getBoundingClientRect();
    let target;

    if (kind === "attack") {
      target = centerOf(els.bossFigure);
    } else if (kind === "discard") {
      target = centerOf(els.discardCount);
    } else {
      target = {
        x: window.innerWidth / 2,
        y: Math.max(120, from.top - 88),
      };
    }

    clone.classList.add("fly-card", kind === "attack" ? "attack" : kind === "discard" ? "discard" : "play");
    clone.style.left = `${from.left}px`;
    clone.style.top = `${from.top}px`;
    clone.style.width = `${from.width}px`;
    clone.style.minHeight = `${from.height}px`;
    clone.style.setProperty("--dx", `${target.x - (from.left + from.width / 2)}px`);
    clone.style.setProperty("--dy", `${target.y - (from.top + from.height / 2)}px`);
    document.body.appendChild(clone);
    window.setTimeout(() => clone.remove(), CARD_ANIMATION_MS);
  }

  function showFloatText(targetElement, text, blocked = false) {
    if (!targetElement) return;
    const point = centerOf(targetElement);
    const label = document.createElement("div");
    label.className = `float-text${blocked ? " blocked" : ""}`;
    label.textContent = text;
    label.style.left = `${point.x}px`;
    label.style.top = `${point.y - 40}px`;
    document.body.appendChild(label);
    window.setTimeout(() => label.remove(), FLOAT_TEXT_MS);
  }

  function animateDamage(target, amount, blocked = false) {
    const element = target === "boss" ? els.bossFigure : els.playerFigure;
    animateClass(element, "hit", HIT_ANIMATION_MS);
    showFloatText(element, blocked ? "格挡" : `-${amount}`, blocked);
  }

  return {
    animateBossAttack() {
      animateClass(els.bossFigure, "lunge", LUNGE_ANIMATION_MS);
    },
    animateCardElement,
    animateDamage,
    flashPlayedCard(cardElement) {
      animateClass(cardElement, "played-flash", FLASH_ANIMATION_MS);
    },
  };
}
