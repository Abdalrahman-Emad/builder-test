CREATE TABLE LABELS (
    id            NUMBER(19,0) PRIMARY KEY,
    name          VARCHAR2(100) NOT NULL UNIQUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ${plain_tablespace};

CREATE TABLE CAMPAIGN_LABELS (
    campaign_id   NUMBER(19,0) NOT NULL,
    label_id      NUMBER(19,0) NOT NULL,

    CONSTRAINT pk_campaign_labels
        PRIMARY KEY (campaign_id, label_id)
) ${plain_tablespace};

ALTER TABLE CAMPAIGN_LABELS
    ADD CONSTRAINT fk_campaign_labels_campaign
    FOREIGN KEY (campaign_id)
    REFERENCES CAMPAIGNS(id)
    ON DELETE CASCADE;

ALTER TABLE CAMPAIGN_LABELS
    ADD CONSTRAINT fk_campaign_labels_label
    FOREIGN KEY (label_id)
    REFERENCES LABELS(id)
    ON DELETE CASCADE;

CREATE INDEX idx_campaign_labels_campaign
    ON CAMPAIGN_LABELS(campaign_id);

CREATE INDEX idx_campaign_labels_label
    ON CAMPAIGN_LABELS(label_id);
