# momo Card Showroom

momo 電商商品卡的「設計型錄」（類 Storybook）。卡片結構取自真實 momo 頁面的 E2E 爬取
（`samples/momo-scraped-cards.json`）。詳見領域術語 [CONTEXT.md](./CONTEXT.md) 與決策紀錄 [docs/adr/](./docs/adr/)。

## 指令

```bash
pnpm dev         # 開發伺服器（Showroom）
pnpm test        # vitest：schema 驗證 / migration / agent 監督迴圈
pnpm type-check  # vue-tsc（唯一靜態關卡）
pnpm build:wc    # 打包 Web Component → samples/momo-cards.js
pnpm build       # 正式建置 app
```

跑完 `pnpm build:wc` 後，直接雙擊 `samples/sample.html`（`file://`）即可看到
`<momo-product-card>` 在純 HTML 中渲染（含一張故意給壞資料、展示驗證錯誤狀態的卡）。

## 架構（一句話）

一份 **schema** 是單一真實來源，同時驅動三件事：

| 出口 | 位置 |
|---|---|
| 執行期驗證 `validate()` | `src/cards/schema.ts` |
| 編輯器表單自動生成 | `src/components/CardEditor.vue`（直接讀 `schema.fields`） |
| TS 資料型別 `InferData<S>`（防 props drift） | `src/cards/schema.ts` |

（schema descriptor 本身就是純資料、機器可讀，agent 透過 `getSchema()` 即可讀欄位/型別/必填。）

- 卡片元件 `ProductCard.ce.vue` → `defineCustomElement` → `<momo-product-card>`，
  Showroom 預覽與 sample.html **同一個渲染來源**。
- 持久化：版本化 localStorage + migration +「只存有效快照」（`src/store/`）。

## AI / Agent 監督

系統把「卡片長怎樣、什麼合法」用機器可讀方式公開，所有輸出（人類編輯或 agent 生成）
都經過**同一個** `validate()` 並回**結構化錯誤**（`path` / `expected` / `received`），
讓 agent 能「產生 → 自我檢查 → 自我修正」。完整可執行示範見
`src/cards/__tests__/agent-supervision.test.ts`。

```ts
import { getSchema } from './src/cards/registry'
import { validate } from './src/cards/schema'
import { productSchema } from './src/cards/product/product.schema'

getSchema('product')                    // → schema descriptor，agent 讀懂欄位與限制
validate(productSchema, candidate)      // → { valid, errors: [{ path, expected, received }] }
```

## 新增一個卡型

1. `defineCardSchema({ type, label, variants, fields })`
2. `registerCardType({ schema, samples })`
3. 完成 —— 驗證 / 表單生成 / 型別推導全部泛用、零引擎改動。

## 優先順序與取捨

時間有限,刻意先把**地基**做穩,因為它同時撐起三個評分軸:

1. **schema 引擎優先**(`validate` + 表單生成 + 型別推導同源)—— 一份 descriptor 撐起「可重用架構 / 可擴充 / agent 監督」,投資報酬最高,先做。
2. **資料貼近真實優先** —— 先 E2E 爬真實 momo 卡,才發現「不是 N 種卡,而是一張卡 + 選配欄位 + 版型變體」,據此選了「單一 schema + 變體」而非多個獨立元件。
3. **一致性優先** —— 持久化採「只存有效快照」+ 版本化 migration,保證 localStorage 恆為有效。
4. **UI 精緻度降級** —— 依 spec 不追求像素還原,只還原卡片結構與關鍵視覺。

## 刻意不做 / 範圍外

| 不做的 | 原因 |
|---|---|
| 合成的 `compact` 變體 | 只留真實抓到的 `ranking`/`standard`,不灌假資料稀釋「分析真實 momo」 |
| 跨分頁 `storage` 同步 | 單分頁一致已足以展示策略,避免邊界情況吃掉時間 |
| 第二張卡型的完整 UI | 用 registry「縫」+ 文件證明可擴充即可,不為展示而灌一張假卡 |
| 後端 / 購物車 / 登入 / 路由 | 非題目重點 |
| zod / Pinia / vue-router | 維持執行期零依賴;自製輕量 schema 反而更貼合「同源驅動表單」需求 |
| 圖片輪播完整資料 | seed 只保留首圖(WC 已支援多圖 + 圓點,資料層先簡化) |

> 這些取捨也記錄在 `docs/adr/`,讓後續維護者看得到「為什麼這樣決定」。

## 後續演進方向（長期維護者視角）

- **真正新增第二種卡型**(如限時閃購卡),把 registry 的擴充縫從「測試證明」推到「真實使用」。
- **enum / 欄位顯示標籤 i18n**:目前選項顯示原始值(`ranking`/`standard`),可加人類可讀標籤層。
- **卡型 schema 自身版本化**:目前 migration 處理「儲存資料」版本;未來卡型 schema 演進也應有對應 migration。
- **編輯器支援新增/刪除卡、切換卡型**。
- **視覺回歸測試**:目前是邏輯單元測試,可補 WC 渲染快照(避免樣式回歸)。
- **schema descriptor 抽成獨立套件**,讓卡片元件與 Showroom 之外的專案也能重用。
