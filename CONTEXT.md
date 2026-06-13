# Merchant Card Showroom

一個展示 momo 電商商品卡的「設計型錄」（類 Storybook）：列出所有卡片、展示單一卡、提供 schema 驅動的細節調整介面（瀏覽器端持久化），並把卡片以 Web Component 形式對外發佈。卡片結構取自真實 momo 頁面的 E2E 爬取（見 `samples/momo-scraped-cards.json`）。

## Language

**Card Design**:
型錄的一個條目 = 一組 `type × variant`（例：product × ranking）。Showroom 的主軸。
_Avoid_: 商品、product、instance（這些會把焦點誤導成「電商商品列表」）

**Sample Content**:
填充進 Card Design 的真實爬取資料（標題、價格、圖片…）。是「內容」，不是型錄主軸。

**Variant（版型）**:
單一**卡型**內的 layout 變化。product 卡有 `ranking`、`standard` 兩個真實版型。
_Avoid_: 把 variant 與「卡型」混用。

**Card Type（卡型）**:
一種卡的種類，各自有獨立 schema，登記在 registry。目前只有 `product`。
_Avoid_: 用 variant 指稱卡型。

**Schema**:
一份 `FieldDescriptor[]`，**單一真實來源**，同時驅動驗證 / 表單生成 / TS 型別推導。

**Draft（草稿）**:
編輯器中可暫時無效的工作中資料。只有有效時才 commit 進 store。

**Commit**:
把有效草稿寫入 store 的動作；無效草稿永不 commit、永不持久化。

## Relationships

- 一個 **Card Type** 擁有一份 **Schema** 與多個 **Variant**
- 一個 **Card Design**（type×variant）由 **Sample Content** 填充後在型錄呈現
- **Schema** 驅動驗證、編輯器表單、TS 型別三個出口（descriptor 本身亦機器可讀）
- **Draft** 經 validate 通過後 **Commit** 進 store → 持久化

## 三個正交的擴充軸（勿混淆）

1. **資料 / props（Sample Content）**：同一張卡餵不同資料值。
2. **版型 / Variant**：單一卡型內的 layout（ranking / standard）。
3. **卡型 / Card Type（registry）**：不同種類的卡，各自 schema。

## 如何新增一個卡型（registry 擴充縫）

1. 寫一份 `defineCardSchema({ type, label, variants, fields })`。
2. `registerCardType({ schema, samples, tag })`。
3. 完成 —— `validate` / `getSchema` / 編輯器表單生成全部泛用、零改動。

## Example dialogue

> **Reviewer:** 「Showroom 列的是商品還是卡片設計？」
> **Dev:** 「是 **Card Design**（type×variant）。那些 PLAYBOY 商品只是 **Sample Content**，用來把卡填滿。」
> **Reviewer:** 「ranking 和 standard 是兩個卡型嗎？」
> **Dev:** 「不是，是同一個 **Card Type**（product）的兩個 **Variant**。不同卡型要在 registry 註冊新的 schema。」

## Flagged ambiguities

- 「擴充性」一度同時指「版型」與「卡型」兩件事 —— 已釐清為三個正交軸（見上）。
- 「商品卡」在需求中既像商品又像卡片設計 —— 解析為：型錄主軸是 **Card Design**，真實商品是 **Sample Content**。
