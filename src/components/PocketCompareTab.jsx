import React from 'react';
import { Download, Trash2, ArrowRight } from 'lucide-react';

const fmt = (n) => Math.round(Number(n || 0)).toLocaleString('zh-TW');

export default function PocketCompareTab({
  markets,
  favorites,
  toggleFavorite,
  comparedIds,
  toggleCompareId,
  products,
  onJumpToMarket,
  onExportCsv,
}) {
  const favMarkets = markets.filter((m) => favorites.includes(m.id));
  const selected = favMarkets.filter((m) => comparedIds.includes(m.id));

  const validProducts = products.filter((p) => Number(p.price) > 0);
  const avgMargin = validProducts.length
    ? Math.max(
        1,
        validProducts.reduce((s, p) => s + (Number(p.price) - Number(p.unitCost)), 0) /
          validProducts.length
      )
    : 104;

  const totals = selected.reduce(
    (acc, m) => {
      const days = Number(m.defaultDays) || 1;
      const rent = (Number(m.rentPerDay) || 0) * days;
      const elec = (Number(m.electricityPerDay) || 0) * days;
      const equip = Number(m.equipmentFee) || 0;
      acc.days += days;
      acc.rent += rent;
      acc.elec += elec;
      acc.equip += equip;
      acc.total += rent + elec + equip;
      return acc;
    },
    { days: 0, rent: 0, elec: 0, equip: 0, total: 0 }
  );

  const breakEvenPacks = Math.ceil(totals.total / avgMargin);
  const maxCost = Math.max(
    1,
    ...selected.map(
      (m) =>
        ((Number(m.rentPerDay) || 0) + (Number(m.electricityPerDay) || 0)) *
          (Number(m.defaultDays) || 1) +
        (Number(m.equipmentFee) || 0)
    )
  );

  return (
    <div className="sheet-container">
      <div className="editorial-sheet">
        <div className="sheet-head">
          <div>
            <h2 className="sheet-title">口袋名單與多場預算比較</h2>
            <p className="sheet-desc">
              勾選想安排在同一季的幾場市集或寵物展，直接看合計要準備多少錢、最少賣幾包回本。
            </p>
          </div>
          {favMarkets.length > 0 && (
            <button
              type="button"
              className="btn btn-quiet no-print"
              onClick={() => onExportCsv(favMarkets, '毛孩擺攤口袋名單')}
            >
              <Download size={15} /> 匯出口袋清單
            </button>
          )}
        </div>

        {favMarkets.length === 0 ? (
          <div className="empty-box">
            目前還沒有收藏任何場地。回到「找場地與算帳」，按星星就能把心儀的市集放進來比較。
          </div>
        ) : (
          <>
            <div className="summary-strip">
              <div className="summary-cell">
                <div className="summary-cell-lbl">已勾選場次／總天數</div>
                <div className="summary-cell-val">
                  {selected.length} 場 · {totals.days} 天
                </div>
              </div>
              <div className="summary-cell">
                <div className="summary-cell-lbl">合計攤位租金</div>
                <div className="summary-cell-val">NT$ {fmt(totals.rent)}</div>
              </div>
              <div className="summary-cell">
                <div className="summary-cell-lbl">合計電費＋器材費</div>
                <div className="summary-cell-val">NT$ {fmt(totals.elec + totals.equip)}</div>
              </div>
              <div className="summary-cell">
                <div className="summary-cell-lbl">合計基本開銷（約賣幾包打平）</div>
                <div className="summary-cell-val" style={{ color: 'var(--accent-hover)' }}>
                  NT$ {fmt(totals.total)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--sage)', fontWeight: 600, marginTop: 2 }}>
                  共賣 {fmt(breakEvenPacks)} 包回本
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: 28 }}>
              <table className="clean-table">
                <thead>
                  <tr>
                    <th style={{ width: 56, textAlign: 'center' }}>比較</th>
                    <th>場地與縣市</th>
                    <th style={{ width: 72 }}>天數</th>
                    <th style={{ width: 120 }}>檔期攤租</th>
                    <th style={{ width: 110 }}>檔期電費</th>
                    <th style={{ width: 130 }}>基本開銷合計</th>
                    <th style={{ width: 98 }}>回本包數</th>
                    <th style={{ width: 126, textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {favMarkets.map((m) => {
                    const checked = comparedIds.includes(m.id);
                    const days = Number(m.defaultDays) || 1;
                    const rent = (Number(m.rentPerDay) || 0) * days;
                    const elec = (Number(m.electricityPerDay) || 0) * days;
                    const equip = Number(m.equipmentFee) || 0;
                    const rowTotal = rent + elec + equip;
                    const rowPacks = Math.ceil(rowTotal / avgMargin);

                    return (
                      <tr key={m.id} style={{ opacity: checked ? 1 : 0.55 }}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCompareId(m.id)}
                            style={{ width: 17, height: 17, accentColor: '#c96d2b', cursor: 'pointer' }}
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{m.name}</div>
                          <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                            {m.city} · {m.category}
                          </div>
                        </td>
                        <td>{days} 天</td>
                        <td>NT$ {fmt(rent)}</td>
                        <td>NT$ {fmt(elec)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--ink)' }}>NT$ {fmt(rowTotal)}</td>
                        <td className="num-profit">{fmt(rowPacks)} 包</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 4 }}>
                            <button
                              type="button"
                              className="btn btn-quiet"
                              style={{ padding: '5px 10px', fontSize: 13 }}
                              onClick={() => onJumpToMarket(m)}
                            >
                              細算 <ArrowRight size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost danger"
                              onClick={() => toggleFavorite(m.id)}
                              title="移出口袋"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selected.length > 0 && (
              <div>
                <h3 className="ledger-section-title" style={{ fontSize: 16.5 }}>
                  各場次基本開銷比較
                </h3>
                {selected.map((m) => {
                  const days = Number(m.defaultDays) || 1;
                  const total =
                    ((Number(m.rentPerDay) || 0) + (Number(m.electricityPerDay) || 0)) * days +
                    (Number(m.equipmentFee) || 0);
                  const pct = Math.max(4, Math.round((total / maxCost) * 100));
                  return (
                    <div key={m.id} className="cost-bar-row">
                      <div className="cost-bar-top">
                        <span>
                          {m.city} · {m.name}（{days} 天）
                        </span>
                        <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
                          NT$ {fmt(total)}
                        </strong>
                      </div>
                      <div className="cost-bar-track">
                        <div className="cost-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
