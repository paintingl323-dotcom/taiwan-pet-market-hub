import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EMPTY_FORM = {
  region: '南部',
  city: '高雄市',
  name: '',
  venue: '',
  category: '毛孩主題市集',
  frequencyType: '常態固定',
  schedule: '',
  defaultDays: 2,
  rentPerDay: 1500,
  rentRangeText: '',
  electricityPerDay: 150,
  electricityText: '約 NT$ 100～200／天（依主辦公告）',
  equipmentFee: 500,
  petAudience: '',
  highlights: '',
  url: '',
  organizer: '',
  notes: '',
};

export default function MarketFormModal({ isOpen, editingItem, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (editingItem) setForm({ ...EMPTY_FORM, ...editingItem });
    else setForm(EMPTY_FORM);
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const rentNum = Number(form.rentPerDay) || 0;
    onSave({
      ...form,
      id: editingItem ? editingItem.id : `custom-${Date.now()}`,
      defaultDays: Math.max(1, Number(form.defaultDays) || 1),
      rentPerDay: rentNum,
      electricityPerDay: Number(form.electricityPerDay) || 0,
      equipmentFee: Number(form.equipmentFee) || 0,
      rentRangeText:
        form.rentRangeText.trim() ||
        (rentNum === 0 ? 'NT$ 0（免費）' : `約 NT$ ${rentNum.toLocaleString('zh-TW')}／天`),
      isCustom: editingItem ? editingItem.isCustom : true,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{editingItem ? '編輯場地資料與筆記' : '新增自己的擺攤場次'}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="關閉">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-form-grid" style={{ marginBottom: 14 }}>
            <div className="field">
              <label>地區</label>
              <select value={form.region} onChange={(e) => set('region', e.target.value)}>
                <option value="北部">北部</option>
                <option value="中部">中部</option>
                <option value="南部">南部</option>
                <option value="東部">東部</option>
                <option value="離島">離島</option>
              </select>
            </div>
            <div className="field">
              <label>縣市</label>
              <input
                type="text"
                required
                placeholder="例如：高雄市、屏東縣"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </div>
            <div className="field">
              <label>場地或市集名稱 *</label>
              <input
                type="text"
                required
                placeholder="例如：駁二毛孩春日市集"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
            <div className="field">
              <label>類型</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                <option value="大型寵物展">大型寵物展</option>
                <option value="毛孩主題市集">毛孩主題市集</option>
                <option value="文創假日市集">文創假日市集</option>
                <option value="零租金拍片公園">零租金拍片公園</option>
              </select>
            </div>
            <div className="field">
              <label>擺攤出現頻率</label>
              <select
                value={form.frequencyType || '常態固定'}
                onChange={(e) => set('frequencyType', e.target.value)}
              >
                <option value="常態固定">● 常態固定（每週六日／長期都有）</option>
                <option value="每月定期">◐ 每月定期（每月／每季開辦）</option>
                <option value="特殊檔期">◆ 特殊檔期（年度大展或節慶限定）</option>
              </select>
            </div>
            <div className="field">
              <label>舉辦地點</label>
              <input
                type="text"
                placeholder="例如：鹽埕區大義倉庫草皮"
                value={form.venue}
                onChange={(e) => set('venue', e.target.value)}
              />
            </div>
            <div className="field">
              <label>檔期與時間</label>
              <input
                type="text"
                placeholder="例如：12/14–12/15 13:00–19:00"
                value={form.schedule}
                onChange={(e) => set('schedule', e.target.value)}
              />
            </div>
            <div className="field">
              <label>每日攤位租金（元）</label>
              <input
                type="number"
                min="0"
                value={form.rentPerDay}
                onChange={(e) => set('rentPerDay', e.target.value)}
              />
            </div>
            <div className="field">
              <label>每日電費（元）</label>
              <input
                type="number"
                min="0"
                value={form.electricityPerDay}
                onChange={(e) => set('electricityPerDay', e.target.value)}
              />
            </div>
            <div className="field">
              <label>預計天數（天）</label>
              <input
                type="number"
                min="1"
                max="14"
                value={form.defaultDays}
                onChange={(e) => set('defaultDays', e.target.value)}
              />
            </div>
            <div className="field">
              <label>官方／報名網址</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.url}
                onChange={(e) => set('url', e.target.value)}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label>適合客群與特色</label>
            <input
              type="text"
              placeholder="例如：草皮遛狗人潮多，夕陽光線很好拍"
              value={form.highlights}
              onChange={(e) => set('highlights', e.target.value)}
            />
          </div>

          <div className="field">
            <label>個人筆記（報名截止日、上次擺攤心得或聯絡人）</label>
            <textarea
              rows={2}
              placeholder="例如：11/30 截止報名，記得帶遮陽傘"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          <div className="modal-foot">
            <div>
              {editingItem && onDelete && (
                <button
                  type="button"
                  className="btn btn-danger-subtle"
                  onClick={() => {
                    const deleted = onDelete(editingItem.id);
                    if (deleted) onClose();
                  }}
                >
                  刪除此場次
                </button>
              )}
            </div>
            <div className="modal-foot-right">
              <button type="button" className="btn btn-quiet" onClick={onClose}>
                取消
              </button>
              <button type="submit" className="btn btn-primary">
                儲存這筆資料
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
