# PKU Poker Boss Demo Rules Memory

This file records the current implemented rules and UI conventions. Treat this as the working source of truth for future changes.

## Player

- Initial HP: 80.
- Initial mental: 5.
- Max mental: 10.
- Mental cannot go below 0 or above max.
- Base draw per player turn: 5 cards.
- Block resets to 0 at the start of each player turn.
- Draw pile and discard pile follow Slay the Spire style recycling: when the draw pile is empty, shuffle the discard pile into the draw pile.
- Draw pile modal is shown sorted by card name dictionary order.
- Discard pile modal is shown in discard order.

## Deck

Initial deck:

- 1x 洞见
- 3x 3.92
- 3x 谈笑风生
- 2x 好言相劝
- 1x 暂
- 2x 1/10
- 2x 深呼吸
- 1x 博雅塔前您博雅
- 2x 反省
- 2x 以退为进
- 1x 重修
- 2x 煎熬
- 2x 休整

## General Card Rules

- Card costs spend mental before the card effect resolves.
- If the player cannot afford a card's current cost, it cannot be played.
- Played cards go to discard unless marked exhaust.
- Exhaust cards go to exhaust pile.
- Retain cards stay in hand at end of turn.
- Card text shows actual computed values in bold blue parentheses:
  - Damage accounts for strength and Boss vulnerable.
  - Block accounts for dexterity and conditional block.
  - Mental gain accounts for current mental, max mental, current cost, and Hollow.
- If a skill is blocked by 扭曲（暂）, its effect is negated after paying cost, and the card still goes to its normal destination.

## Player Cards

### 3.92

- Type: attack.
- Cost: 0.
- Can only be played when current mental is below 5.
- Deals 0 base damage.
- Strength applies at double value for this card.
- If final damage is greater than 5, gain 2 mental.

### 谈笑风生

- Type: attack.
- Cost: 0.
- Deals 7 damage.
- If current mental is at least 5 after paying cost, deals another 7 damage and applies 1 vulnerable to Boss.

### 好言相劝

- Type: attack.
- Cost: 0.
- Deals 5 damage.
- Gain 5 block.
- Gain 1 strength.

### 暂

- Type: skill.
- Cost: 8.
- Exhausts.
- Negates the next Boss action this turn, including Boss damage and effects.
- Can negate 回响转化 damage/status effects if active when the Boss action resolves.

### 1/10

- Type: skill.
- Cost: 1.
- Applies 1 gaze to Boss.
- Adds one 循证 to draw pile.
- When Boss gaze reaches 10, Boss immediately takes 50 unblockable damage and gaze is reduced by 10.

### 循证

- Type: skill.
- Cost: 0.
- Exhausts.
- If Boss already has gaze, apply 1 gaze.
- If current mental is greater than 5, apply 1 additional gaze.

### 洞见

- Type: skill.
- Cost: 0.
- Innate, retain, exhaust.
- For every 2 current mental, gain 1 random buff layer.
- Each layer randomly gives one of:
  - Strength +1.
  - Dexterity +1.
  - Start-of-turn draw +1, then discard 1 after drawing.
- If mental is below 2, no buff is gained.

### 深呼吸

- Type: skill.
- Cost: 0.
- Gain 1 mental.
- Next turn draw count -1.

### 博雅塔前您博雅

- Type: skill.
- Cost: 0.
- Can only be played if no attack has been played this turn.
- After being played, attacks cannot be played for the rest of this turn.
- At end of turn, gain 4 mental.

### 反省

- Type: skill.
- Cost: 0.
- Draw 3.
- If no attack has been played this turn, draw 1 additional card.

### 以退为进

- Type: skill.
- Cost: 0.
- Draw 3.
- Enter discard selection mode and discard exactly 1 selected card after pressing the discard button.
- If the discarded card is an attack, gain 1 mental.

### 重修

- Type: skill.
- Cost: 1.
- Discard all remaining cards in hand.
- Draw the same number of cards.

### 煎熬

- Type: defense.
- Cost: 0.
- Gain 10 block.
- Lose 1 mental.
- This mental loss is recorded for Boss second-phase twist selection, but it is not double-counted as a card cost.

### 休整

- Type: defense.
- Cost: 0.
- Gain 5 block.
- If no attack has been played this turn, gain 5 additional block.

### 呼唤

- Type: skill.
- First-phase cost: 2.
- First-phase effect: retrieve 1 card from coffin.
- During the "Boss intends to transform" window, before 回响转化 actually resolves, 呼唤 remains first-phase behavior.
- After Boss actually finishes 回响转化, 呼唤 changes:
  - Cost becomes 0.
  - Effect becomes gain 2 mental.
- The card display only shows the currently active effect.

## Mental Gain And Loss

- `gainMental(amount)` first clamps to actual possible gain based on current mental and max mental.
- If actual possible gain is 0, Hollow is not consumed.
- Hollow cancels gained mental point by point.
- Each 1 mental canceled by Hollow heals Boss for 5 HP.
- Remaining uncanceled gain is added to player mental.
- Mental loss clamps at 0.
- Mental gain sources currently include:
  - 3.92 conditional gain 2.
  - 深呼吸 gain 1.
  - 博雅塔前您博雅 end-turn gain 4.
  - 以退为进 gain 1 when discarding an attack.
  - 呼唤 second-phase gain 2.
- Mental loss sources currently include:
  - Card costs.
  - 煎熬 loses 1 mental.
  - 茫然 loses 2 mental per layer at end of turn.
  - 扭曲（煎熬） loses 1 mental each time player gains block during its active turn.

## Buffs And Statuses

### Strength

- Each layer adds 1 damage to each normal attack damage segment.
- 3.92 receives double strength scaling.

### Dexterity

- Each layer adds 1 block whenever block is gained.

### Vulnerable

- Boss vulnerable increases attack damage received by 50%, rounded down.
- Boss vulnerable decreases by 1 at the end of each Boss action.

### Gaze

- Boss gaze reaches 10: Boss takes 50 unblockable damage and gaze decreases by 10.

### Hollow

- Player status.
- Cancels actual gained mental point by point.
- Each canceled mental heals Boss for 5 HP.
- Removed when Boss actually resolves 回响转化.

### Muddled

- Player status.
- At player end of turn, lose 2 mental per layer.

## Boss: 理想的灵柩

- HP: 300.
- Boss has a coffin.
- Each card in coffin increases Boss attack damage by 20%.
- Boss intent display separates upcoming damage from upcoming statuses/effects.

## Boss Phase 1: 封存

Boss alternates between two actions. Every phase-1 action first deals 20 base damage, modified by coffin attack bonus.

1. Attack + 理想封存
   - Deal 20 base damage.
   - Randomly seal one non-retain card from player's hand into coffin.
   - Add one 呼唤 to player's hand.

2. Attack + 深渊邀约
   - Deal 20 base damage.
   - Apply 3 Hollow to player.

If the player ends a turn without playing any attack, while Boss is still phase 1 and coffin is not empty, the player may retrieve 1 coffin card before Boss acts.

## Boss Phase Transition

- When Boss HP drops below half, phase is set to 2 and current intent changes to 回响转化.
- The transform does not resolve immediately when HP crosses half.
- Until the player ends the turn and Boss actually resolves 回响转化, 呼唤 remains first-phase behavior.

## Boss 回响转化

Resolved as the next Boss action after phase threshold is crossed.

- Coffin opens.
- For each card in coffin, deal 10 damage to player.
- Apply 1 Muddled to player.
- Remove all Hollow from player.
- After this action resolves, 呼唤 becomes 0-cost gain 2 mental.
- If player has 暂 active, the transform's damage and Muddled application are negated, but 呼唤 still changes after the transform action.

## Boss Phase 2: 回响

Each Boss action:

- Deal 30 base damage, modified by coffin attack bonus.
- After attacking, release the twist form of the player card with the highest recorded mental spend among twist-eligible cards.

Twist-eligible cards:

- 暂: cost 8.
- 1/10: cost 1.
- 重修: cost 1.
- 煎熬: recorded as 1 due to its mental loss.

If no twist-eligible card has been recorded, Boss releases no twist effect.

## Boss Twists

### 扭曲（暂）

- Boss line: "解构一切，失去一切"
- Apply 1 layer to player.
- Player's next skill card is negated.
- Consumed after triggering.

### 扭曲（1/10）

- Boss line: "你的理想同样不值一提"
- Apply 1 layer to player.
- At player end of turn, each layer deals 5 damage.
- Damage can be blocked.
- Layers do not decay automatically.

### 扭曲（重修）

- Boss line: "既无能力，遑论理想"
- Apply 1 layer to player.
- At next player turn start, draw count -2.
- Consumed after triggering.

### 扭曲（煎熬）

- Boss line: "你的身体先于灵魂崩溃"
- Apply 1 layer to player.
- On the next player turn, each time player gains block, lose 1 mental.
- At the end of that active player turn, reduce by 1 layer.

## Turn Flow

### Player Turn Start

1. Increment turn.
2. Clear block.
3. Clear per-turn attack count and attack lock.
4. Set active 扭曲（煎熬） flag if player has layers.
5. Calculate draw count:
   - Base 5.
   - Add 洞见 draw-discard buffs.
   - Subtract 深呼吸 next-turn penalties.
   - Subtract 2 if 扭曲（重修） triggers.
6. Draw cards.
7. If 洞见 draw-discard buff exists, enter discard selection mode.

### Player Action

- Click a playable card to play it.
- Discard choices are selected first, then confirmed with the discard button.
- Some actions enter selection mode:
  - 以退为进: select 1 hand card to discard.
  - 呼唤 phase 1: select 1 coffin card to retrieve.
  - No-attack end-of-turn reward: optionally select 1 coffin card to retrieve.

### Player End Turn

1. If eligible for no-attack coffin retrieval, offer retrieval before ending.
2. Resolve 博雅塔前您博雅 mental gain.
3. Resolve 茫然 mental loss.
4. Resolve 扭曲（1/10） damage.
5. Resolve end of active 扭曲（煎熬） turn.
6. Boss acts.
7. Discard non-retain hand cards.
8. Start next player turn if battle is not over.

## UI And Interaction Rules

- Player is on the left, Boss is on the right.
- Player and Boss statuses are displayed directly below their figures.
- Battle log is separate from status displays.
- Boss intent above Boss separates damage and status/effect.
- Boss switches to a distinct visual form after phase 2 starts.
- Cards show actual damage/block/mental gain values in bold blue parentheses.
- Hovering over cards, status badges, piles, and intent shows detailed tooltip.
- Animations exist for:
  - Playing cards.
  - Discarding cards.
  - Attack cards.
  - Boss attacks.
  - Taking damage or blocking damage.
- Animation timings are intentionally slower:
  - Card fly animation: 900ms.
  - Damage float text: 1200ms.
  - Boss lunge: 800ms.
  - Hit shake: 650ms.
  - Card flash: 500ms.
