/***********migration**************/
CREATE TABLE CAMPAIGN_LABELS (
                                 campaign_id NUMBER(19,0) NOT NULL,
                                 label       VARCHAR2(50) NOT NULL
) ${plain_tablespace};

ALTER TABLE CAMPAIGN_LABELS
    ADD CONSTRAINT fk_campaign_labels_campaign
        FOREIGN KEY (campaign_id)
            REFERENCES CAMPAIGNS(id)
            ON DELETE CASCADE;

ALTER TABLE CAMPAIGN_LABELS
    ADD CONSTRAINT pk_campaign_labels PRIMARY KEY (campaign_id, label);

CREATE INDEX idx_campaign_labels_campaign
    ON CAMPAIGN_LABELS (campaign_id);


/**********dto***************/

package com.cibeg.digital.notifications.api.dto.campaign;

public enum CampaignLabels {
    ANNOUNCEMENT,
    TRANSACTIONAL,
}

/*************************************/
    private List<CampaignLabels> labels;
    private List<CampaignLabels> labels;
/***************************/

