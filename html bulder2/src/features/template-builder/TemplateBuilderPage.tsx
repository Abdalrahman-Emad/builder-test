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



/*************Mapper************/
package com.cibeg.digital.notifications.api.mapper.campaign;

import com.cibeg.digital.notifications.api.dto.campaign.CampaignAuthorizationResponseDto;
import com.cibeg.digital.notifications.api.dto.campaign.CampaignResponseDto;
import com.cibeg.digital.notifications.sms.dispatcher.central.tables.records.CampaignAuthorizationsRecord;
import com.cibeg.digital.notifications.sms.dispatcher.central.tables.records.CampaignsRecord;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CampaignMapper {

    @Mapping(
            target = "persist",
            expression = "java(campaign.getPersist() != null && campaign.getPersist() == 1)")
    @Mapping(target = "type", source = "channelType")
    @Mapping(target = "authorizations", ignore = true)
    @Mapping(target = "channels", ignore = true)
    @Mapping(target = "userAssociations", ignore = true)
    @Mapping(target = "audienceIds", ignore = true)
    @Mapping(target = "recipientCount", ignore = true)
    @Mapping(target = "audienceMemberCount", ignore = true)
    @Mapping(target = "audienceWarning", ignore = true)
    @Mapping(target = "labels", expression = "java(mapLabels(campaign))")

    CampaignResponseDto toResponse(CampaignsRecord campaign);

    @Mapping(target = "status", expression = "java(authorization.getStatus())")
    CampaignAuthorizationResponseDto toAuthorizationResponse(
            CampaignAuthorizationsRecord authorization);


}


BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  03:48 min
[INFO] Finished at: 2026-05-18T14:01:08+03:00
[INFO] ------------------------------------------------------------------------
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin:3.13.0:compile (default-compile) on project notifications-api: Compilation failure
[ERROR] /E:/Mostafa/notification-center/notifications-api/target/generated-sources/annotations/com/cibeg/digital/notifications/api/mapper/campaign/CampaignMapperImpl.java:[45,37] cannot find symbol                                                                                                                                                                                   
[ERROR]   symbol:   method mapLabels(com.cibeg.digital.notifications.sms.dispatcher.central.tables.records.CampaignsRecord)
[ERROR]   location: class com.cibeg.digital.notifications.api.mapper.campaign.CampaignMapperImpl
[ERROR] 
[ERROR] -> [Help 1]
[ERROR] 
[ERROR] To see the full stack trace of the errors, re-run Maven with the -e switch.
[ERROR] Re-run Maven using the -X switch to enable full debug logging.
[ERROR] 
[ERROR] For more information about the errors and possible solutions, please read the following articles:
[ERROR] [Help 1] http://cwiki.apache.org/confluence/display/MAVEN/MojoFailureException
[ERROR] 
[ERROR] After correcting the problems, you can resume the build with the command
[ERROR]   mvn <args> -rf :notifications-api


/**************/
private Map<BigInteger, List<CampaignLabel>> fetchLabelsBatch(
        DSLContext dsl,
        List<BigInteger> campaignIds) {

    return dsl.select(
                    CAMPAIGN_LABELS.CAMPAIGN_ID,
                    CAMPAIGN_LABELS.LABEL)
            .from(CAMPAIGN_LABELS)
            .where(CAMPAIGN_LABELS.CAMPAIGN_ID.in(campaignIds))
            .fetch()
            .stream()
            .collect(
                    Collectors.groupingBy(
                            r -> r.get(CAMPAIGN_LABELS.CAMPAIGN_ID),
                            Collectors.mapping(
                                    r -> CampaignLabel.valueOf(
                                            r.get(CAMPAIGN_LABELS.LABEL)),
                                    Collectors.toList())));
}
