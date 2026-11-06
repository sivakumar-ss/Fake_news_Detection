"""Domain model for a stored news analysis."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

CATEGORIES = (
    "likely_reliable",
    "potentially_misleading",
    "likely_false",
    "insufficient_evidence",
)
INPUT_TYPES = ("text", "url")


@dataclass(slots=True)
class Analysis:
    """A complete analysis result, independent of storage concerns."""

    content: str
    category: str
    assessment_score: int
    explanation: str
    model: str
    title: str = ""
    source_url: str | None = None
    input_type: str = "text"
    suspicious_claims: list[str] = field(default_factory=list)
    supporting_evidence: list[str] = field(default_factory=list)
    contradicting_evidence: list[str] = field(default_factory=list)
    sources: list[dict[str, Any]] = field(default_factory=list)
    id: int | None = None
    created_at: str | None = None

    def __post_init__(self) -> None:
        category = self.category.strip().lower()
        if category not in CATEGORIES:
            raise ValueError(f"category must be one of {CATEGORIES}, got '{self.category}'.")

        if self.input_type not in INPUT_TYPES:
            raise ValueError(f"input_type must be one of {INPUT_TYPES}.")
        if not isinstance(self.assessment_score, int) or not 0 <= self.assessment_score <= 100:
            raise ValueError("assessment_score must be an integer between 0 and 100.")

        self.category = category
        self.content = self.content.strip()
        self.explanation = self.explanation.strip()
        self.title = (self.title or "").strip()
        if not self.title:
            compact = " ".join(self.content.split())
            self.title = compact[:90] + ("…" if len(compact) > 90 else "")

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
