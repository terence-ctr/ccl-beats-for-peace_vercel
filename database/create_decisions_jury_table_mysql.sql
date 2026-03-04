-- ==============================================
-- TABLE DECISIONS_JURY (décisions détaillées du jury)
-- ==============================================
CREATE TABLE decisions_jury (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    jury_id VARCHAR(36) NOT NULL,
    artiste_id VARCHAR(36) NOT NULL,
    phase_id VARCHAR(36) NOT NULL,
    criteria JSON NOT NULL, -- { "technique": 4, "creativity": 3, "stage_presence": 4, "interpretation": 3, "overall": 4 }
    comments TEXT DEFAULT '',
    decision ENUM('selected', 'rejected', 'pending') NOT NULL,
    finalized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    UNIQUE KEY unique_jury_decision (jury_id, artiste_id, phase_id),
    
    INDEX idx_jury_id (jury_id),
    INDEX idx_artiste_id (artiste_id),
    INDEX idx_phase_id (phase_id),
    INDEX idx_decision (decision),
    INDEX idx_finalized (finalized)
);
