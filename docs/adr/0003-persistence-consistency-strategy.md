# 0003 — 版本化持久化 +「持久化恆為有效」一致性策略

瀏覽器端持久化（[src/store/persistence.ts](../../src/store/persistence.ts)）在存入 localStorage 的資料蓋上 `version`，讀取時若為舊版自動跑 `migrate()` 升級（已實作並測試 `v0 → v1`）；讀取時對每筆卡片跑 `validate()`，髒/不合法資料被濾掉而不崩潰。

## 一致性保證

store（[src/store/useCardStore.ts](../../src/store/useCardStore.ts)）是單一真實來源。**commit 前先 validate，只有有效快照才寫入 store / localStorage**。編輯器持有可暫時無效的「工作草稿」並即時顯示錯誤，但無效草稿**永不**落地。結論：localStorage 裡的狀態**恆為有效**，重整只會還原最後一次有效狀態。

## 取捨與明確的範圍外

- 選擇「只存有效」而非「全存 + invalid 旗標」：換得乾淨的一致性保證，代價是編到一半的無效內容重整後不保留。
- **不做跨分頁 `storage` 同步**：只保證單分頁內一致，避免額外邊界情況。
- migration 做了真實的 `v0 → v1` 範例 + 測試，確保升級機制不是未驗證的空架子。
