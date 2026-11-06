-- Fake News Detection - analyses schema
-- Applied automatically at startup. Statements must stay idempotent.

CREATE TABLE IF NOT EXISTS analyses (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    title                 TEXT,
    content               TEXT    NOT NULL,
    source_url            TEXT,
    input_type            TEXT    NOT NULL DEFAULT 'text'
                                  CHECK (input_type IN ('text', 'url')),
    category              TEXT    NOT NULL
                                  CHECK (category IN (
                                      'likely_reliable',
                                      'potentially_misleading',
                                      'likely_false',
                                      'insufficient_evidence'
                                  )),
    assessment_score      INTEGER NOT NULL
                                  CHECK (assessment_score BETWEEN 0 AND 100),
    explanation           TEXT    NOT NULL,
    suspicious_claims     TEXT    NOT NULL DEFAULT '[]',
    supporting_evidence   TEXT    NOT NULL DEFAULT '[]',
    contradicting_evidence TEXT   NOT NULL DEFAULT '[]',
    sources               TEXT    NOT NULL DEFAULT '[]',
    model                 TEXT    NOT NULL,
    created_at            TEXT    NOT NULL
                                  DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_analyses_created_at
    ON analyses (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analyses_category
    ON analyses (category);
