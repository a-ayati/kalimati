-- جدول الأقوال
CREATE TABLE IF NOT EXISTS quotes (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  status       TEXT NOT NULL DEFAULT 'draft',  -- draft | review | scheduled | published
  published_at TEXT NOT NULL,                  -- ISO 8601
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  data         TEXT NOT NULL,                  -- JSON: النص والتشكيل واللغة والمواضيع وسجل التعديلات...
  reads        INTEGER NOT NULL DEFAULT 0,
  saves        INTEGER NOT NULL DEFAULT 0,
  shares       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_quotes_visible ON quotes (status, published_at);

-- منع تضخيم الإحصاءات: زائر واحد يُحسب مرة واحدة لكل قول ونوع ويوم
CREATE TABLE IF NOT EXISTS stat_events (
  visitor  TEXT NOT NULL,   -- بصمة مجهولة (تجزئة يومية للعنوان، لا يُخزَّن العنوان نفسه)
  quote_id TEXT NOT NULL,
  kind     TEXT NOT NULL,   -- read | save | share
  day      TEXT NOT NULL,
  PRIMARY KEY (visitor, quote_id, kind, day)
);

-- حماية تسجيل الدخول من التخمين
CREATE TABLE IF NOT EXISTS login_attempts (
  visitor      TEXT PRIMARY KEY,
  failures     INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);
