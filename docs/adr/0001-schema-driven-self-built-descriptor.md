# 0001 — 自製 schema descriptor 當單一來源（而非 zod）

每個卡型用一份自製的 `FieldDescriptor[]`（[src/cards/schema.ts](../../src/cards/schema.ts)）描述，這一份同時驅動三件事：執行期驗證 `validate()`、編輯器表單自動生成（CardEditor 直接讀 `fields`）、以及 TypeScript 資料型別 `InferData<S>`（讓元件 props 不會與 schema drift）。descriptor 本身是純資料，因此也直接是機器可讀的（agent 透過 `getSchema()` 讀欄位/型別/必填）。

## 為什麼不用 zod

zod 擅長「驗證 + 型別推導」，但對「由 schema **反向生成 UI 表單**」支援薄弱（需額外自訂 UI 對映）。我們需要的是**一份描述同時餵這幾個出口**，自製 descriptor 最直接、可控，且讓專案保持**執行期零依賴（只有 vue）**。

## 取捨

- 代價：驗證邏輯需自行維護（但範圍小、已有測試覆蓋）。
- 變體（variant）是一等公民：欄位用 `appliesTo` / `requiredIn` 宣告適用與必填變體，各出口共用同一份宣告。
