-- 1. New tables: EVENT_DETAILS, EVENT_CHANNELS
CREATE TABLE EVENT_DETAILS (
                           event_id              NUMBER(19,0)  PRIMARY KEY ,
                           template_id           NUMBER(19,0)  NOT NULL,
                           service_id            NUMBER(19,0)  NOT NULL,
                           event_category        NUMBER(3,0) NOT NULL ,
                           created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           created_by            VARCHAR2(50),
                           updated_at            TIMESTAMP,
                           updated_by            VARCHAR2(50),
                           persist               NUMBER(1,0)  DEFAULT 0 NOT NULL,
                           channel_type          NUMBER(2,0)  DEFAULT 0 NOT NULL
)
    ${plain_tablespace};

CREATE TABLE EVENT_CHANNELS (
                                   event_id           NUMBER(19,0)  NOT NULL,
                                   channel_code          NUMBER(2,0)  NOT NULL,
                                   CONSTRAINT pk_event_type_channel_code PRIMARY KEY (event_id,channel_code )
)
    ${plain_tablespace};

-- 2. Rename CAMPAIGNS.type to channel_type
ALTER TABLE CAMPAIGNS RENAME COLUMN type TO channel_type;

-- 3. Check constraints
ALTER TABLE EVENT_CHANNELS  ADD CONSTRAINT chk_ec_channel   CHECK (channel_code IN (1,2,3));
ALTER TABLE CAMPAIGN_CHANNELS    ADD CONSTRAINT chk_cc_channel   CHECK (channel_code IN (1,2,3));
ALTER TABLE CAMPAIGN_RECIPIENTS  ADD CONSTRAINT chk_cr_channel   CHECK (channel      IN (1,2,3));

-- 4. Campaign name, description, schedule, dispatch_logic
ALTER TABLE CAMPAIGNS ADD name VARCHAR2(255);
ALTER TABLE CAMPAIGNS ADD description VARCHAR2(500);
ALTER TABLE CAMPAIGNS ADD scheduled_at TIMESTAMP;
ALTER TABLE CAMPAIGNS ADD dispatch_logic VARCHAR2(50);

CREATE INDEX idx_campaigns_name ON CAMPAIGNS (name);

-- 5. Add audience mode to campaigns. Audience targeting (anonymous /
-- registered / both) is fully expressed by AUDIENCE_USER_ASSOCIATIONS rows;
-- there is no separate audience_type column.
ALTER TABLE CAMPAIGNS ADD audience_mode VARCHAR2(10) DEFAULT 'OPEN';

-- 6. Create join table for multi-value user associations on audiences
CREATE TABLE AUDIENCE_USER_ASSOCIATIONS (
    audience_id        NUMBER(19,0) NOT NULL,
    user_association   NUMBER(2)    NOT NULL,
    CONSTRAINT pk_audience_user_assoc PRIMARY KEY (audience_id, user_association)
)${plain_tablespace};

ALTER TABLE AUDIENCE_USER_ASSOCIATIONS
    ADD CONSTRAINT fk_aud_ua_audience FOREIGN KEY (audience_id) REFERENCES AUDIENCES (id) ON DELETE CASCADE;

-- Drop the old column
ALTER TABLE AUDIENCES DROP COLUMN user_association;


ALTER TABLE AUDIENCE_MEMBERS DROP CONSTRAINT uq_aud_member;

ALTER TABLE AUDIENCE_MEMBERS DROP COLUMN user_id;

ALTER TABLE AUDIENCE_MEMBERS ADD user_name VARCHAR2(50);

ALTER TABLE AUDIENCE_MEMBERS ADD customer_number VARCHAR2(50);

ALTER TABLE AUDIENCE_MEMBERS MODIFY mobile_number VARCHAR2(50) NULL;

ALTER TABLE AUDIENCE_MEMBERS ADD CONSTRAINT chk_aud_member_at_least_one
    CHECK (user_name IS NOT NULL OR mobile_number IS NOT NULL OR customer_number IS NOT NULL);

ALTER TABLE AUDIENCE_MEMBERS ADD CONSTRAINT uq_aud_member UNIQUE (audience_id, user_name);

ALTER TABLE CAMPAIGN_RECIPIENTS DROP COLUMN user_id;

ALTER TABLE CAMPAIGN_RECIPIENTS ADD user_name VARCHAR2(50);

ALTER TABLE CAMPAIGN_RECIPIENTS ADD customer_number VARCHAR2(50);

-- 8. Login-event support: DEVICES.LANGUAGE, USER_DEVICES.MOBILE_NUMBER, FK & indexes
ALTER TABLE DEVICES ADD (LANGUAGE VARCHAR2(10));

ALTER TABLE USER_DEVICES ADD (MOBILE_NUMBER VARCHAR2(20));

ALTER TABLE USER_DEVICES
    ADD CONSTRAINT FK_USER_DEVICES_DEVICE
    FOREIGN KEY (DEVICE_ID) REFERENCES DEVICES(ID) ON DELETE CASCADE;

CREATE INDEX IX_DEVICES_LANGUAGE ON DEVICES(LANGUAGE);
CREATE INDEX IX_DEVICES_PLATFORM ON DEVICES(PLATFORM);


ALTER TABLE USER_DEVICES DROP COLUMN USER_ID;

ALTER TABLE USER_DEVICES ADD (USER_NAME VARCHAR2(50) NOT NULL);

CREATE UNIQUE INDEX UX_USER_DEVICES ON USER_DEVICES(DEVICE_ID, USER_NAME);
CREATE INDEX IX_USER_DEVICES_USER ON USER_DEVICES(USER_NAME);


ALTER TABLE CAMPAIGN_AUDIENCES
    DROP CONSTRAINT fk_camp_aud_audience;
ALTER TABLE CAMPAIGN_AUDIENCES
    ADD CONSTRAINT fk_camp_aud_audience
    FOREIGN KEY (audience_id) REFERENCES AUDIENCES (id) ON DELETE CASCADE;

ALTER TABLE AUDIENCE_PLATFORMS
    DROP CONSTRAINT fk_audience_platforms_audience;
ALTER TABLE AUDIENCE_PLATFORMS
    ADD CONSTRAINT fk_audience_platforms_audience
    FOREIGN KEY (audience_id) REFERENCES AUDIENCES (id) ON DELETE CASCADE;

-- 11. Foreign keys on EVENT_DETAILS / EVENT_CHANNELS (was missing in step 1).
ALTER TABLE EVENT_DETAILS
    ADD CONSTRAINT fk_event_details_template
    FOREIGN KEY (template_id) REFERENCES TEMPLATES (id);
ALTER TABLE EVENT_DETAILS
    ADD CONSTRAINT fk_event_details_service
    FOREIGN KEY (service_id) REFERENCES SERVICES (id);
ALTER TABLE EVENT_CHANNELS
    ADD CONSTRAINT fk_event_channels_event
    FOREIGN KEY (event_id) REFERENCES EVENT_DETAILS (event_id) ON DELETE CASCADE;

CREATE INDEX idx_event_details_template ON EVENT_DETAILS (template_id);
CREATE INDEX idx_event_details_service  ON EVENT_DETAILS (service_id);


ALTER TABLE CAMPAIGNS
    ADD CONSTRAINT chk_campaign_audience_mode
    CHECK (audience_mode IN ('OPEN', 'CLOSED'));

ALTER TABLE AUDIENCE_USER_ASSOCIATIONS
    ADD CONSTRAINT chk_aud_ua_value
    CHECK (user_association IN (0, 1));


ALTER TABLE AUDIENCE_MEMBERS
    ADD CONSTRAINT uq_aud_member_mobile UNIQUE (audience_id, mobile_number);

ALTER TABLE AUDIENCE_MEMBERS
    ADD CONSTRAINT uq_aud_member_customer UNIQUE (audience_id, customer_number);


ALTER TABLE CAMPAIGN_RECIPIENTS
    ADD CONSTRAINT chk_camp_recipient_at_least_one
    CHECK (user_name IS NOT NULL OR mobile_number IS NOT NULL OR customer_number IS NOT NULL);
