import React, { useState } from 'react';
import {
  RotateCcw,
  Pencil,
  Check,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  FolderPlus,
} from 'lucide-react';

const QUICK_SECTION_SUGGESTIONS = [
  '交通與停車準備',
  '雨天與防曬備案',
  '收攤與帳務結算',
  '毛孩互動與贈品',
];

export default function ChecklistTab({
  sections,
  setSections,
  toggleCheck,
  clearAllChecks,
  restoreDefaultChecklist,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [draftItemTexts, setDraftItemTexts] = useState({});

  const allItems = sections.flatMap((sec) => sec.items);
  const totalCount = allItems.length;
  const doneCount = allItems.filter((item) => item.done).length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  // --- Section operations ---
  const addSection = (titleText) => {
    const clean = String(titleText ?? newSectionTitle).trim();
    if (!clean) return;
    const newSec = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: clean,
      items: [],
    };
    setSections((prev) => [...prev, newSec]);
    setNewSectionTitle('');
  };

  const renameSection = (secId, nextTitle) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === secId ? { ...sec, title: nextTitle } : sec))
    );
  };

  const moveSection = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      next.splice(target, 0, picked);
      return next;
    });
  };

  const deleteSection = (sec) => {
    const msg =
      sec.items.length > 0
        ? `確定要刪除「${sec.title}」整個區塊和裡面的 ${sec.items.length} 個項目嗎？`
        : `確定要刪除「${sec.title}」這個空白區塊嗎？`;
    if (!window.confirm(msg)) return;
    setSections((prev) => prev.filter((s) => s.id !== sec.id));
  };

  // --- Item operations ---
  const addItemToSection = (secId) => {
    const text = (draftItemTexts[secId] || '').trim();
    if (!text) return;
    const newItem = {
      id: `ck-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      done: false,
    };
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === secId ? { ...sec, items: [...sec.items, newItem] } : sec
      )
    );
    setDraftItemTexts((prev) => ({ ...prev, [secId]: '' }));
  };

  const updateItemText = (secId, itemId, text) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === secId
          ? {
              ...sec,
              items: sec.items.map((it) => (it.id === itemId ? { ...it, text } : it)),
            }
          : sec
      )
    );
  };

  const moveItemInSection = (secId, itemIdx, dir) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== secId) return sec;
        const target = itemIdx + dir;
        if (target < 0 || target >= sec.items.length) return sec;
        const nextItems = [...sec.items];
        const [picked] = nextItems.splice(itemIdx, 1);
        nextItems.splice(target, 0, picked);
        return { ...sec, items: nextItems };
      })
    );
  };

  const moveItemToAnotherSection = (fromSecId, itemId, toSecId) => {
    if (!toSecId || fromSecId === toSecId) return;
    setSections((prev) => {
      let movedItem = null;
      const removed = prev.map((sec) => {
        if (sec.id !== fromSecId) return sec;
        const found = sec.items.find((it) => it.id === itemId);
        if (found) movedItem = found;
        return { ...sec, items: sec.items.filter((it) => it.id !== itemId) };
      });
      if (!movedItem) return prev;
      return removed.map((sec) =>
        sec.id === toSecId ? { ...sec, items: [...sec.items, movedItem] } : sec
      );
    });
  };

  const deleteItem = (secId, itemId) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === secId
          ? { ...sec, items: sec.items.filter((it) => it.id !== itemId) }
          : sec
      )
    );
  };

  return (
    <div className="sheet-container">
      <div className="editorial-sheet">
        <div className="sheet-head check-sheet-head">
          <div className="check-sheet-head-left">
            <h2 className="sheet-title">出攤行前準備清單</h2>
            <p className="sheet-desc">
              {isEditing
                ? '可自由新增第 5、第 6 個區塊，並修改、排序或跨區搬移項目，所有變動自動存檔。'
                : '出發前逐項打勾會自動存檔；點右上角「編輯清單」可自由增減區塊與項目。'}
            </p>
          </div>

          <div className="check-sheet-head-actions no-print">
            {!isEditing && (
              <a
                href="https://petfood.moa.gov.tw/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-quiet"
              >
                農業部寵物食品申報網 ↗
              </a>
            )}

            <button
              type="button"
              className={`btn ${isEditing ? 'btn-primary' : 'btn-quiet'}`}
              onClick={() => setIsEditing((v) => !v)}
            >
              {isEditing ? (
                <>
                  <Check size={15} /> 完成編輯
                </>
              ) : (
                <>
                  <Pencil size={14} /> 編輯清單
                </>
              )}
            </button>

            {isEditing ? (
              <button
                type="button"
                className="btn btn-quiet"
                onClick={restoreDefaultChecklist}
                title="還原回原本的 4 大區塊與 16 個預設項目"
              >
                <RotateCcw size={14} /> 恢復預設清單
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-quiet"
                onClick={clearAllChecks}
                title="保留所有自訂區塊與項目，只把已勾選的勾勾清空"
              >
                <RotateCcw size={14} /> 清空打勾
              </button>
            )}
          </div>
        </div>

        {/* Edit Mode: Add New Section Bar (Supports 5, 6, N+ Sections!) */}
        {isEditing && (
          <div className="check-editor-bar no-print">
            <div className="check-editor-bar-row">
              <div className="check-editor-label">
                <FolderPlus size={16} />
                <span>目前共 {sections.length} 大區塊・新增區塊：</span>
              </div>
              <div className="check-editor-add-wrap">
                <input
                  type="text"
                  className="input-warm"
                  placeholder="輸入新區塊名稱（例如：雨天備案、交通與住宿）"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSection();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => addSection()}
                  disabled={!newSectionTitle.trim()}
                >
                  <Plus size={15} /> 新增區塊
                </button>
              </div>
            </div>

            <div className="check-quick-picks">
              <span className="check-quick-label">常用第 5、6 區塊一鍵加入：</span>
              {QUICK_SECTION_SUGGESTIONS.map((sug) => {
                const alreadyExists = sections.some((s) => s.title === sug);
                return (
                  <button
                    key={sug}
                    type="button"
                    className="check-quick-chip"
                    disabled={alreadyExists}
                    onClick={() => addSection(sug)}
                  >
                    {alreadyExists ? `✓ ${sug}` : `＋ ${sug}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {!isEditing && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 14.5,
                fontWeight: 700,
                color: 'var(--ink)',
              }}
            >
              <span>
                目前完成 {doneCount}／{totalCount} 項（共 {sections.length} 大區塊）
              </span>
              <span style={{ color: pct === 100 && totalCount > 0 ? 'var(--sage)' : 'var(--accent-hover)' }}>
                {pct === 100 && totalCount > 0 ? '已全部備妥' : `${pct}%`}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </>
        )}

        {/* Sections Grid (Automatically adapts to 4, 5, 6+ sections!) */}
        {sections.length === 0 ? (
          <div className="empty-box">
            目前還沒有任何準備區塊，請在上方輸入名稱建立第一個區塊，或點「恢復預設清單」。
          </div>
        ) : (
          <div className={`check-sections ${isEditing ? 'is-editing' : ''}`}>
            {sections.map((sec, secIdx) => {
              const grpDone = sec.items.filter((it) => it.done).length;

              if (!isEditing) {
                return (
                  <div key={sec.id} className="check-sec-block">
                    <h3 className="check-sec-title">
                      <span>{sec.title || '未命名區塊'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-muted)' }}>
                        {grpDone} / {sec.items.length}
                      </span>
                    </h3>
                    {sec.items.length === 0 ? (
                      <div className="check-sec-empty">此區塊尚未加入項目（點右上角「編輯清單」即可新增）</div>
                    ) : (
                      sec.items.map((item) => (
                        <label key={item.id} className={`check-row ${item.done ? 'done' : ''}`}>
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => toggleCheck(sec.id, item.id)}
                          />
                          <span>{item.text}</span>
                        </label>
                      ))
                    )}
                  </div>
                );
              }

              // Detailed Edit Mode Card per Section
              return (
                <div key={sec.id} className="check-sec-editor">
                  <div className="check-sec-editor-head">
                    <span className="check-sec-num">區塊 {secIdx + 1}</span>
                    <input
                      type="text"
                      className="check-sec-title-input"
                      value={sec.title}
                      placeholder="輸入區塊標題"
                      onChange={(e) => renameSection(sec.id, e.target.value)}
                    />
                    <div className="check-sec-head-actions">
                      <button
                        type="button"
                        className="btn-mini-icon"
                        onClick={() => moveSection(secIdx, -1)}
                        disabled={secIdx === 0}
                        title="區塊往前移"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-mini-icon"
                        onClick={() => moveSection(secIdx, 1)}
                        disabled={secIdx === sections.length - 1}
                        title="區塊往後移"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-mini-icon danger"
                        onClick={() => deleteSection(sec)}
                        title="刪除此區塊"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Editable Items inside this Section */}
                  <div className="check-edit-items">
                    {sec.items.length === 0 ? (
                      <div className="check-sec-empty">還沒有檢查項目，從下方輸入框新增第一條吧。</div>
                    ) : (
                      sec.items.map((item, itemIdx) => (
                        <div key={item.id} className="check-edit-item-row">
                          <textarea
                            rows={2}
                            className="check-item-input"
                            value={item.text}
                            placeholder="輸入檢查項目內容"
                            onChange={(e) => updateItemText(sec.id, item.id, e.target.value)}
                          />
                          <div className="check-item-controls">
                            <button
                              type="button"
                              className="btn-mini-icon"
                              onClick={() => moveItemInSection(sec.id, itemIdx, -1)}
                              disabled={itemIdx === 0}
                              title="上移"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn-mini-icon"
                              onClick={() => moveItemInSection(sec.id, itemIdx, 1)}
                              disabled={itemIdx === sec.items.length - 1}
                              title="下移"
                            >
                              <ArrowDown size={13} />
                            </button>
                            {sections.length > 1 && (
                              <select
                                className="check-move-select"
                                value={sec.id}
                                title="搬移到其他區塊"
                                aria-label="搬移到其他區塊"
                                onChange={(e) =>
                                  moveItemToAnotherSection(sec.id, item.id, e.target.value)
                                }
                              >
                                {sections.map((targetSec) => (
                                  <option key={targetSec.id} value={targetSec.id}>
                                    {targetSec.id === sec.id
                                      ? '留在本區'
                                      : `移至：${targetSec.title || '未命名'}`}
                                  </option>
                                ))}
                              </select>
                            )}
                            <button
                              type="button"
                              className="btn-mini-icon danger"
                              onClick={() => deleteItem(sec.id, item.id)}
                              title="刪除此項目"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Item Row for this Section */}
                  <div className="check-add-item-row">
                    <input
                      type="text"
                      className="input-warm"
                      placeholder={`在「${sec.title || '此區塊'}」新增一條準備項目…`}
                      value={draftItemTexts[sec.id] || ''}
                      onChange={(e) =>
                        setDraftItemTexts((prev) => ({ ...prev, [sec.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addItemToSection(sec.id);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-quiet"
                      onClick={() => addItemToSection(sec.id)}
                      disabled={!(draftItemTexts[sec.id] || '').trim()}
                    >
                      <Plus size={14} /> 加入
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
