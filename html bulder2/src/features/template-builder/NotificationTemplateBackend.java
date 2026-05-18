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

/*******************/
package com.cibeg.digital.notifications.api.controller.v1;

import com.cibeg.digital.notifications.api.dto.campaign.CampaignRequest;
import com.cibeg.digital.notifications.api.dto.campaign.CampaignResponse;
import com.cibeg.digital.notifications.api.dto.campaign.CampaignLabels;
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
    public CampaignResponse createCampaign(
            @Valid @RequestBody CampaignRequest request
    ) {
        return campaignService.createCampaign(request);
    }

    // GET campaign by id
    @GetMapping("/{id}")
    public CampaignResponse getCampaign(@PathVariable Long id) {
        return campaignService.getCampaign(id);
    }

    // UPDATE full campaign (including labels)
    @PutMapping("/{id}")
    public CampaignResponse updateCampaign(
            @PathVariable Long id,
            @Valid @RequestBody CampaignRequest request
    ) {
        return campaignService.updateCampaign(id, request);
    }

    // UPDATE ONLY labels (optional but recommended)
    @PutMapping("/{id}/labels")
    public CampaignResponse updateLabels(
            @PathVariable Long id,
            @RequestBody List<CampaignLabels> labels
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





/*************camapign request dto****************/
package com.cibeg.digital.notifications.api.dto.campaign;

import com.cibeg.digital.notifications.sms.dispatcher.central.repository.model.AudienceMode;
import com.cibeg.digital.notifications.sms.dispatcher.central.repository.model.CampaignType;
import com.cibeg.digital.notifications.sms.dispatcher.central.repository.model.Channel;
import com.cibeg.digital.notifications.sms.dispatcher.central.repository.model.DispatchLogic;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignRequestDto {

    @NotBlank private String name;

    private String description;

    private Long templateId;

    private CampaignType type;

    @JsonProperty("isPersist")
    private boolean persist;

    private List<Channel> channels;

    private DispatchLogic dispatchLogic;

    private LocalDateTime scheduledAt;

    private AudienceMode audienceMode;

    private List<Long> audienceIds;

    private List<CampaignLabels> labels;
}

/************response***********/
package com.cibeg.digital.notifications.api.dto.campaign;

import com.cibeg.digital.notifications.sms.dispatcher.central.repository.model.AudienceMode;
import com.cibeg.digital.notifications.sms.dispatcher.central.repository.model.CampaignStatus;
import com.cibeg.digital.notifications.sms.dispatcher.central.repository.model.CampaignType;
import com.cibeg.digital.notifications.sms.dispatcher.central.repository.model.Channel;
import com.cibeg.digital.notifications.sms.dispatcher.central.repository.model.DispatchLogic;
import com.cibeg.digital.notifications.sms.dispatcher.central.repository.model.UserAssociation;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.ALWAYS)
public class CampaignResponseDto {

    private Long id;
    private String name;
    private String description;
    private Long templateId;
    private CampaignType type;
    private CampaignStatus status;
    private boolean persist;
    private DispatchLogic dispatchLogic;
    private AudienceMode audienceMode;
    private LocalDateTime scheduledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
    private List<CampaignAuthorizationResponseDto> authorizations;
    private List<Channel> channels;
    private List<UserAssociation> userAssociations;
    private List<Long> audienceIds;
    private Long recipientCount;
    private Long audienceMemberCount;
    private String audienceWarning;
    private List<CampaignLabels> labels;
}
