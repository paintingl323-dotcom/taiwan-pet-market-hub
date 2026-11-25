import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Star,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import {
  REGIONS,
  CATEGORIES,
  FREQUENCIES,
  FREQUENCY_META,
  QUICK_PORTALS,
} from '../data/marketsData';

const fmt = (n) => Math.round(Number(n || 0)).toLocaleString('zh-TW');

export default function SplitWorkspace({
  markets,
  selectedMarket,
  onSelectMarket,
  mobileDetailOpen,
  setMobileDetailOpen,
  regionFilter,
  setRegionFilter,
  categoryFilter,
  setCategoryFilter,
  frequencyFilter,
  setFrequencyFilter,
  searchTerm,
  setSearchTerm,
  favorites,
  toggleFavorite,
  onEdit,
  calcState,
  setCalcState,
  onResetCalc,
  products,
  setProducts,
}) {
  const [showPricing, setShowPricing] = useState(false);
  const rowRefs = useRef({});

  // Keep selected venue scrolled into view in the left index page
  useEffect(() => {
    if (!selectedMarket?.id) return;
    const el = rowRefs.current[selectedMarket.id];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedMarket?.id]);

  // 100% transparent & self-consistent ledger math from the 6 visible inputs
  const days = Math.max(1, Number(calcState.days) || 1);
  const rentTotal = (Number(calcState.rentPerDay) || 0) * days;
  const elecTotal = (Number(calcState.electricityPerDay) || 0) * days;
  const equipTotal = Number(calcState.equipmentFee) || 0;
  const sampleAndPackTotal = Number(calcState.sampleAndPackCost) || 0;
  const travelMealTotal = (Number(calcState.dailyTravelMeal) || 0) * days;
  const equipAndMiscTotal = equipTotal + sampleAndPackTotal + travelMealTotal;

  const grandFixedCost = rentTotal + elecTotal + equipAndMiscTotal;

  const validProducts = products.filter((p) => Number(p.price) > 0);
  const avgPrice = validProducts.length
    ? Math.round(validProducts.reduce((s, p) => s + Number(p.price), 0) / validProducts.length)
    : 175;
  const avgUnitCost = validProducts.length
    ? Math.round(validProducts.reduce((s, p) => s + Number(p.unitCost), 0) / validProducts.length)
    : 71;
  const unitMargin = Math.max(1, avgPrice - avgUnitCost);

  const breakEvenTotal = Math.ceil(grandFixedCost / unitMargin);
  const breakEvenPerDay = Math.ceil(breakEvenTotal / days);

  const sliderMax = Math.max(150, Math.ceil((breakEvenPerDay * 1.6) / 10) * 10);
  const expectedPerDay = Math.max(5, Number(calcState.expectedPacksPerDay) || 35);

  const scenarios = [
    { name: '賣少一點（約 7 成）', perDay: Math.max(1, Math.round(expectedPerDay * 0.7)) },
    { name: '照預期賣出', perDay: expectedPerDay },
    { name: '現場人潮很旺（1.5 倍）', perDay: Math.round(expectedPerDay * 1.5) },
  ].map((sc) => {
    const packs = sc.perDay * days;
    const rev = packs * avgPrice;
    const profit = packs * unitMargin - grandFixedCost;
    return { ...sc, packs, rev, profit };
  });

  const updateField = (k, v) => setCalcState((prev) => ({ ...prev, [k]: v }));

  const updateProduct = (id, key, val) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [key]: key === 'name' ? val : Number(val) } : p))
    );
  };

  const addProduct = () => {
    setProducts((prev) => [
      ...prev,
      { id: `p-${Date.now()}`, name: '新款毛孩零食', price: 170, unitCost: 70 },
    ]);
  };

  const removeProduct = (id) => {
    if (products.length <= 1) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const isFiltered =
    regionFilter !== '全部' ||
    categoryFilter !== '全部類型' ||
    frequencyFilter !== '不限頻率' ||
    searchTerm.trim() !== '';

  const isSelectedFav = selectedMarket ? favorites.includes(selectedMarket.id) : false;

  return (
    <div className="workspace-outer">
      <div className={`workspace-frame ${mobileDetailOpen ? 'mobile-detail-open' : ''}`}>
        {/* LEFT PAGE: Warm Linen Venue Index Page */}
        <aside className="list-pane">
          <div className="list-controls">
            <div className="region-row">
              <div className="region-tabs" role="tablist" aria-label="依地區篩選">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="tab"
                    aria-selected={regionFilter === r}
                    className={`region-btn ${regionFilter === r ? 'active' : ''}`}
                    onClick={() => setRegionFilter(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {isFiltered && (
                <span className="list-count">篩選出 {markets.length} 個地點</span>
              )}
            </div>

            <div className="search-filter-bar">
              <div className="search-wrap">
                <Search size={15} />
                <input
                  type="text"
                  className="input-warm"
                  placeholder="搜尋縣市或市集名稱"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="select-warm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="場次類型"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="freq-filter-row" role="group" aria-label="依出現頻率篩選">
              {FREQUENCIES.map((f) => {
                const meta = FREQUENCY_META[f];
                return (
                  <button
                    key={f}
                    type="button"
                    className={`freq-filter-btn ${meta ? meta.className : ''} ${
                      frequencyFilter === f ? 'active' : ''
                    }`}
                    onClick={() => setFrequencyFilter(f)}
                  >
                    {meta ? `${meta.symbol} ${meta.short}` : '全部頻率'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="venue-list-wrap">
            <div className="venue-list">
              {markets.length === 0 ? (
                <div className="empty-box">
                  找不到符合的擺攤地點，換個地區或清除搜尋字再看看。
                </div>
              ) : (
                markets.map((m) => {
                  const isSel = selectedMarket && selectedMarket.id === m.id;
                  const isFav = favorites.includes(m.id);
                  const dailyAll = Number(m.rentPerDay || 0) + Number(m.electricityPerDay || 0);

                  return (
                    <div
                      key={m.id}
                      ref={(el) => {
                        if (el) rowRefs.current[m.id] = el;
                      }}
                      className={`venue-row ${isSel ? 'selected' : ''}`}
                      onClick={() => {
                        onSelectMarket(m);
                        setMobileDetailOpen(true);
                      }}
                    >
                      <div className="venue-row-top">
                        <div className="venue-row-name">{m.name}</div>
                        <button
                          type="button"
                          className={`star-toggle ${isFav ? 'saved' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(m.id);
                          }}
                          title={isFav ? '取消收藏' : '收進口袋名單'}
                          aria-label={isFav ? '取消收藏' : '收進口袋名單'}
                        >
                          <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <div className="venue-row-bottom">
                        <span className="venue-row-meta">
                          <span>{m.city} · {m.category}</span>
                          {(() => {
                            const fMeta = FREQUENCY_META[m.frequencyType] || FREQUENCY_META['特殊檔期'];
                            return (
                              <span className={`freq-tag ${fMeta.className}`}>
                                {fMeta.symbol} {fMeta.short}
                              </span>
                            );
                          })()}
                        </span>
                        <span className={`venue-row-price ${dailyAll === 0 ? 'free' : ''}`}>
                          {dailyAll === 0 ? '免費拍片' : `NT$ ${fmt(dailyAll)}／天`}
                        </span>
                      </div>

                      <div className="venue-row-mobile-hint" aria-hidden="true">
                        點此看詳情與算帳 →
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* RIGHT PAGE: Warm Ivory Reading Sheet & Live Ledger */}
        <section className="detail-pane">
          <div className="mobile-back-bar no-print">
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => setMobileDetailOpen(false)}
            >
              <ArrowLeft size={16} /> 回到場地清單
            </button>
          </div>

          {!selectedMarket ? (
            <div className="empty-box">請從左邊點選任一個擺攤地點，右邊會立刻顯示詳情與成本試算。</div>
          ) : (
            <div key={selectedMarket.id} className="detail-sheet-body">
              {/* Compact Editorial Venue Header */}
              <div className="detail-header">
                <div className="detail-meta-row">
                  <div className="detail-meta-left">
                    <span className="detail-place-tag">
                      {selectedMarket.region} · {selectedMarket.city} · {selectedMarket.category}
                    </span>
                    {(() => {
                      const fMeta =
                        FREQUENCY_META[selectedMarket.frequencyType] || FREQUENCY_META['特殊檔期'];
                      return (
                        <span className={`freq-pill-detail ${fMeta.className}`}>
                          {fMeta.symbol} {fMeta.long}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="detail-actions no-print">
                    {selectedMarket.url && (
                      <a
                        href={selectedMarket.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-subtle"
                      >
                        官網／招商 <ExternalLink size={13} />
                      </a>
                    )}
                    <button
                      type="button"
                      className={`btn btn-ghost ${isSelectedFav ? 'is-fav' : ''}`}
                      onClick={() => toggleFavorite(selectedMarket.id)}
                    >
                      <Star
                        size={14}
                        fill={isSelectedFav ? '#d48324' : 'none'}
                        color={isSelectedFav ? '#d48324' : 'currentColor'}
                      />
                      {isSelectedFav ? '已收藏' : '收藏'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => onEdit(selectedMarket)}
                    >
                      <Pencil size={14} /> 編輯筆記
                    </button>
                  </div>
                </div>

                <h2 className="detail-title">{selectedMarket.name}</h2>

                <div className="detail-facts">
                  <div className="fact-item">
                    <span className="fact-label">舉辦地點</span>
                    <span className="fact-val">{selectedMarket.venue || '依主辦公告'}</span>
                  </div>
                  <div className="fact-item">
                    <span className="fact-label">常見檔期與天數</span>
                    <span className="fact-val">{selectedMarket.schedule || '週末不定時'}</span>
                  </div>
                  <div className="fact-item">
                    <span className="fact-label">參考攤位租金</span>
                    <span className="fact-val">{selectedMarket.rentRangeText}</span>
                  </div>
                  <div className="fact-item">
                    <span className="fact-label">電費與接電行情</span>
                    <span className="fact-val">{selectedMarket.electricityText}</span>
                  </div>
                </div>

                <p className="detail-summary">
                  <strong>適合客群：</strong>
                  {selectedMarket.petAudience}。{selectedMarket.highlights}
                </p>

                {selectedMarket.notes && (
                  <div className="detail-note-strip">
                    <strong>我的筆記：</strong>
                    {selectedMarket.notes}
                  </div>
                )}
              </div>

              {/* Integrated Live Ledger — Single Visual Hero + Compact 3×2 Paper Grid */}
              <div className="ledger-section">
                <div className="ledger-section-head">
                  <h3 className="ledger-section-title">成本與回本試算</h3>
                  <button
                    type="button"
                    className="btn-text-reset no-print"
                    onClick={onResetCalc}
                  >
                    帶回預設行情
                  </button>
                </div>

                {/* THE Visual Hero: Plain-Language Serif Break-Even Verdict */}
                <div className="conclusion-banner">
                  <p className="conclusion-sentence">
                    這場擺 {days} 天大約花{' '}
                    <span className="conclusion-highlight">NT$ {fmt(grandFixedCost)}</span>，賣出{' '}
                    <span className="conclusion-highlight">{fmt(breakEvenTotal)} 包</span>就回本
                  </p>
                  <div className="conclusion-sub">
                    <span>平均每天要賣 {fmt(breakEvenPerDay)} 包</span>
                    <span>
                      攤租 NT$ {fmt(rentTotal)} ＋ 電費 NT$ {fmt(elecTotal)} ＋ 器材與雜支 NT${' '}
                      {fmt(equipAndMiscTotal)}
                    </span>
                  </div>
                </div>

                {/* Compact 3-Column Paper Ledger Form (2 rows × 3 cols = 6 exact inputs) */}
                <div className="ledger-grid">
                  <label className="ledger-field">
                    <span className="ledger-label">預計天數</span>
                    <div className="ledger-input-wrap">
                      <input
                        type="number"
                        min="1"
                        max="14"
                        value={calcState.days}
                        onChange={(e) => updateField('days', e.target.value)}
                      />
                      <span className="ledger-unit">天</span>
                    </div>
                  </label>

                  <label className="ledger-field">
                    <span className="ledger-label">每日攤租</span>
                    <div className="ledger-input-wrap">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={calcState.rentPerDay}
                        onChange={(e) => updateField('rentPerDay', e.target.value)}
                      />
                      <span className="ledger-unit">元／天</span>
                    </div>
                  </label>

                  <label className="ledger-field">
                    <span className="ledger-label">每日電費</span>
                    <div className="ledger-input-wrap">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={calcState.electricityPerDay}
                        onChange={(e) => updateField('electricityPerDay', e.target.value)}
                      />
                      <span className="ledger-unit">元／天</span>
                    </div>
                  </label>

                  <label className="ledger-field">
                    <span className="ledger-label">桌椅器材</span>
                    <div className="ledger-input-wrap">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={calcState.equipmentFee}
                        onChange={(e) => updateField('equipmentFee', e.target.value)}
                      />
                      <span className="ledger-unit">元</span>
                    </div>
                  </label>

                  <label className="ledger-field">
                    <span className="ledger-label">試吃與包裝</span>
                    <div className="ledger-input-wrap">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={calcState.sampleAndPackCost}
                        onChange={(e) => updateField('sampleAndPackCost', e.target.value)}
                      />
                      <span className="ledger-unit">元</span>
                    </div>
                  </label>

                  <label className="ledger-field">
                    <span className="ledger-label">油錢與餐費</span>
                    <div className="ledger-input-wrap">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={calcState.dailyTravelMeal}
                        onChange={(e) => updateField('dailyTravelMeal', e.target.value)}
                      />
                      <span className="ledger-unit">元／天</span>
                    </div>
                  </label>
                </div>

                {/* Pricing Basis Strip — Immediately Visible Below the 6 Inputs */}
                <div className="pricing-drawer">
                  <button
                    type="button"
                    className="drawer-toggle"
                    onClick={() => setShowPricing((v) => !v)}
                  >
                    <span className="pricing-basis-text">
                      目前以平均售價 <strong>NT$ {fmt(avgPrice)}</strong>、成本{' '}
                      <strong>NT$ {fmt(avgUnitCost)}</strong>（每包賺{' '}
                      <strong>NT$ {fmt(unitMargin)}</strong>）試算
                    </span>
                    <span className="pricing-edit-cta">
                      {showPricing ? '收起價格表' : '修改零食價格'}
                      {showPricing ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </span>
                  </button>

                  {showPricing && (
                    <div className="pricing-drawer-body">
                      <div className="prod-edit-row prod-edit-head">
                        <span>零食名稱</span>
                        <span>售價（NT$）</span>
                        <span>成本（NT$）</span>
                        <span />
                      </div>
                      {products.map((p) => (
                        <div key={p.id} className="prod-edit-row">
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => updateProduct(p.id, 'name', e.target.value)}
                          />
                          <input
                            type="number"
                            min="1"
                            value={p.price}
                            onChange={(e) => updateProduct(p.id, 'price', e.target.value)}
                          />
                          <input
                            type="number"
                            min="0"
                            value={p.unitCost}
                            onChange={(e) => updateProduct(p.id, 'unitCost', e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-ghost danger"
                            onClick={() => removeProduct(p.id)}
                            disabled={products.length <= 1}
                            title="移除此品項"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <div style={{ marginTop: 10 }}>
                        <button type="button" className="btn btn-quiet" onClick={addProduct}>
                          <Plus size={14} /> 新增一款毛孩零食
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expected Sales Slider & Simple 3-Row Profit Table */}
                <div className="slider-box">
                  <div className="slider-head">
                    <span>如果每天大約賣出</span>
                    <span className="slider-val">{fmt(expectedPerDay)} 包／天</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max={sliderMax}
                    step="5"
                    className="warm-range"
                    value={Math.min(expectedPerDay, sliderMax)}
                    onChange={(e) => updateField('expectedPacksPerDay', Number(e.target.value))}
                  />

                  <div className="table-scroll-wrap">
                    <table className="clean-table">
                      <thead>
                        <tr>
                          <th>銷售情況</th>
                          <th>共賣幾包</th>
                          <th>賣出總金額</th>
                          <th>扣完成本實賺</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenarios.map((sc) => (
                          <tr key={sc.name}>
                            <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{sc.name}</td>
                            <td>{fmt(sc.packs)} 包</td>
                            <td>NT$ {fmt(sc.rev)}</td>
                            <td className={sc.profit >= 0 ? 'num-profit' : 'num-loss'}>
                              {sc.profit >= 0 ? '+' : '-'}NT$ {fmt(Math.abs(sc.profit))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quiet Real-Time Portal Links at Bottom */}
                <div className="portals-footer no-print">
                  <div className="portals-footer-title">隨時查詢最新招商與政府申報：</div>
                  <div className="portal-links-inline">
                    {QUICK_PORTALS.map((p) => (
                      <a
                        key={p.name}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="portal-chip"
                      >
                        {p.name} ↗
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
