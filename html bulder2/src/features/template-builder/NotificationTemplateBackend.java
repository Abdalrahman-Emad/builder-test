CREATE TABLE CAMPAIGN_LABELS (
    campaign_id NUMBER(19,0) NOT NULL,
    label       VARCHAR2(50) NOT NULL,

    CONSTRAINT pk_campaign_labels
        PRIMARY KEY (campaign_id, label)
) ${plain_tablespace};

ALTER TABLE CAMPAIGN_LABELS
    ADD CONSTRAINT fk_campaign_labels_campaign
    FOREIGN KEY (campaign_id)
    REFERENCES CAMPAIGNS(id)
    ON DELETE CASCADE;

ALTER TABLE CAMPAIGN_LABELS
    ADD CONSTRAINT chk_campaign_labels_enum
    CHECK (label IN ('ANNOUNCMENT', 'TRANSACTIONAL'));

CREATE INDEX idx_campaign_labels_campaign
ON CAMPAIGN_LABELS (campaign_id);

/********controller***********/
package com.cibeg.digital.notifications.api.controller.v1;

import com.cibeg.digital.notifications.api.dto.campaign.CampaignRequestDto;
import com.cibeg.digital.notifications.api.dto.campaign.CampaignResponseDto;
import com.cibeg.digital.notifications.api.service.CampaignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    // CREATE campaign (with labels)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CampaignResponseDto createCampaign(
            @Valid @RequestBody CampaignRequestDto request
    ) {
        return campaignService.createCampaign(request);
    }

    // GET campaign by id (includes labels)
    @GetMapping("/{id}")
    public CampaignResponseDto getCampaign(@PathVariable Long id) {
        return campaignService.getCampaignById(id);
    }

    // UPDATE campaign (replace everything including labels)
    @PutMapping("/{id}")
    public CampaignResponseDto updateCampaign(
            @PathVariable Long id,
            @Valid @RequestBody CampaignRequestDto request
    ) {
        return campaignService.updateCampaign(id, request);
    }

    // UPDATE ONLY labels
    @PutMapping("/{id}/labels")
    public CampaignResponseDto updateLabels(
            @PathVariable Long id,
            @RequestBody List<com.cibeg.digital.notifications.api.dto.campaign.CampaignLabels> labels
    ) {
        return campaignService.updateLabels(id, labels);
    }

    // DELETE campaign
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCampaign(@PathVariable Long id) {
        campaignService.deleteCampaign(id);
    }
}

/*************mapper***************/

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
    CampaignResponseDto toResponse(CampaignsRecord campaign);

    @Mapping(target = "status", expression = "java(authorization.getStatus())")
    CampaignAuthorizationResponseDto toAuthorizationResponse(
            CampaignAuthorizationsRecord authorization);
}
