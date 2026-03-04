-- ==============================================
-- TABLE DECISIONS_JURY (décisions détaillées du jury)
-- ==============================================
CREATE TABLE decisions_jury (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jury_id UUID NOT NULL,
    artiste_id UUID REFERENCES artiste(id) ON DELETE CASCADE NOT NULL,
    phase_id UUID REFERENCES evenement(id) ON DELETE CASCADE NOT NULL,
    criteria JSONB NOT NULL, -- { technique: number, creativity: number, stage_presence: number, interpretation: number, overall: number }
    comments TEXT DEFAULT '',
    decision TEXT NOT NULL CHECK (decision IN ('selected', 'rejected', 'pending')),
    finalized BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (jury_id, artiste_id, phase_id)
);

-- Index pour les performances
CREATE INDEX idx_decisions_jury_jury_id ON decisions_jury(jury_id);
CREATE INDEX idx_decisions_jury_artiste_id ON decisions_jury(artiste_id);
CREATE INDEX idx_decisions_jury_phase_id ON decisions_jury(phase_id);
CREATE INDEX idx_decisions_jury_decision ON decisions_jury(decision);
CREATE INDEX idx_decisions_jury_finalized ON decisions_jury(finalized);

-- Trigger pour updated_at
CREATE TRIGGER update_decisions_jury_updated_at
    BEFORE UPDATE ON decisions_jury
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
