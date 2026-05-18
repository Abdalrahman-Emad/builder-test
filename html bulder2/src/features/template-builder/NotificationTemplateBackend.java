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



/*************campaign controller*************/
package com.cibeg.digital.notifications.api.controller.campaign;

import com.cibeg.digital.notifications.api.dto.campaign.*;
import com.cibeg.digital.notifications.api.service.campaign.CampaignService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/campaigns")
@RequiredArgsConstructor
public class CampaignControllerV1 {

    private final CampaignService campaignService;

    @PreAuthorize("hasAuthority('campaign-inputter')")
    @PostMapping
    public ResponseEntity<CampaignResponseDto> create(
            @Valid @RequestBody CampaignRequestDto request) {
        CampaignResponseDto created = campaignService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PreAuthorize("hasAuthority('campaign-inputter')")
    @PutMapping("/{id}")
    public ResponseEntity<CampaignResponseDto> update(
            @PathVariable Long id, @Valid @RequestBody CampaignRequestDto request) {
        CampaignResponseDto updated = campaignService.update(id, request);
        return ResponseEntity.ok(updated);
    }

    @PreAuthorize("hasAnyAuthority('campaign-inputter', 'campaign-authorizer')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CampaignResponseDto>> getById(@PathVariable Long id) {
        CampaignResponseDto found = campaignService.getById(id);
        return ResponseEntity.ok(ApiResponse.<CampaignResponseDto>builder().data(found).build());
    }

    @PreAuthorize("hasAnyAuthority('campaign-inputter', 'campaign-authorizer')")
    @GetMapping
    public ApiCursorResponse<List<CampaignResponseDto>> getAll(
            @ModelAttribute CampaignSearchRequestDto searchRequest,
            @Valid @ModelAttribute CursorPaginationRequest pagination) {
        CursorPage<CampaignResponseDto> page =
                campaignService.getFiltered(searchRequest, pagination);
        return ApiCursorResponse.<List<CampaignResponseDto>>builder()
                .data(page.getData())
                .cursor(page.getNextCursor())
                .hasNext(page.isHasNextPage())
                .build();
    }

    @PreAuthorize("hasAuthority('campaign-inputter')")
    @PostMapping("/{id}/submit")
    public ResponseEntity<CampaignResponseDto> submitForApproval(@PathVariable Long id) {
        CampaignResponseDto result = campaignService.submitForApproval(id);
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasAuthority('campaign-authorizer')")
    @PostMapping("/{id}/approve")
    public ResponseEntity<CampaignResponseDto> approve(@PathVariable Long id) {
        CampaignResponseDto result = campaignService.approve(id);
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasAuthority('campaign-authorizer')")
    @PostMapping("/{id}/reject")
    public ResponseEntity<CampaignResponseDto> reject(
            @PathVariable Long id,
            @RequestBody(required = false) CampaignRejectRequestDto request) {
        String reason = request != null ? request.getReason() : null;
        CampaignResponseDto result = campaignService.reject(id, reason);
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasAnyAuthority('campaign-inputter', 'campaign-authorizer')")
    @GetMapping(produces = "text/csv")
    public void exportCsv(
            @ModelAttribute CampaignSearchRequestDto request, HttpServletResponse response) {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"campaigns.csv\"");
        campaignService.exportCsv(request, response);
    }

    @PreAuthorize("hasAuthority('campaign-inputter')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        campaignService.delete(id);
        return ResponseEntity.noContent().build();
    }
}





/*************campaign sercie*********/

package com.cibeg.digital.notifications.api.service.campaign;

import com.cibeg.digital.notifications.api.dto.campaign.*;
import jakarta.servlet.http.HttpServletResponse;

public interface CampaignService {

    CampaignResponseDto create(CampaignRequestDto request);

    CampaignResponseDto update(Long id, CampaignRequestDto request);

    CampaignResponseDto getById(Long id);

    CursorPage<CampaignResponseDto> getFiltered(
            CampaignSearchRequestDto request, CursorPaginationRequest pagination);

    CampaignResponseDto submitForApproval(Long id);

    CampaignResponseDto approve(Long id);

    CampaignResponseDto reject(Long id, String reason);

    void exportCsv(CampaignSearchRequestDto request, HttpServletResponse response);

    void delete(Long id);
}




/**********************campaign service imp*****************/
package com.cibeg.digital.notifications.api.service.campaign;

import static com.cibeg.digital.notifications.api.dto.campaign.CursorDto.applyCursorCondition;
import static com.cibeg.digital.notifications.api.dto.campaign.CursorDto.encodeCursor;
import static com.cibeg.digital.notifications.sms.dispatcher.central.tables.AudienceMembers.AUDIENCE_MEMBERS;
import static com.cibeg.digital.notifications.sms.dispatcher.central.tables.AudiencePlatforms.AUDIENCE_PLATFORMS;
import static com.cibeg.digital.notifications.sms.dispatcher.central.tables.AudienceUserAssociations.AUDIENCE_USER_ASSOCIATIONS;
import static com.cibeg.digital.notifications.sms.dispatcher.central.tables.Audiences.AUDIENCES;
import static com.cibeg.digital.notifications.sms.dispatcher.central.tables.CampaignAudiences.CAMPAIGN_AUDIENCES;
import static com.cibeg.digital.notifications.sms.dispatcher.central.tables.CampaignAuthorizations.CAMPAIGN_AUTHORIZATIONS;
import static com.cibeg.digital.notifications.sms.dispatcher.central.tables.CampaignChannels.CAMPAIGN_CHANNELS;
import static com.cibeg.digital.notifications.sms.dispatcher.central.tables.CampaignRecipients.CAMPAIGN_RECIPIENTS;
import static com.cibeg.digital.notifications.sms.dispatcher.central.tables.Campaigns.CAMPAIGNS;
import static com.cibeg.digital.notifications.sms.dispatcher.central.tables.Templates.TEMPLATES;
import static com.cibeg.digital.notifications.sms.dispatcher.central.tables.UserDevices.USER_DEVICES;

import com.cibeg.digital.notifications.api.dto.*;
import com.cibeg.digital.notifications.api.dto.campaign.*;
import com.cibeg.digital.notifications.api.dto.campaign.CursorDto;
import com.cibeg.digital.notifications.api.dto.campaign.CursorPage;
import com.cibeg.digital.notifications.api.dto.campaign.CursorPaginationRequest;
import com.cibeg.digital.notifications.api.error.CampaignErrors;
import com.cibeg.digital.notifications.api.mapper.campaign.CampaignMapper;
import com.cibeg.digital.notifications.api.specifications.campaign.AudienceCriteria;
import com.cibeg.digital.notifications.api.specifications.campaign.AudienceRecipientSpecifications;
import com.cibeg.digital.notifications.api.specifications.campaign.CampaignAudienceSpecifications;
import com.cibeg.digital.notifications.api.specifications.campaign.CampaignSpecifications;
import com.cibeg.digital.notifications.api.specifications.campaign.DeviceRecipientSpecifications;
import com.cibeg.digital.notifications.sms.dispatcher.central.repository.model.*;
import com.cibeg.digital.notifications.sms.dispatcher.central.tables.records.*;
import com.cibeg.one.api.authorization.model.SecurityUser;
import com.cibeg.one.api.core.errors.APIFunctionalException;
import jakarta.inject.Provider;
import jakarta.servlet.http.HttpServletResponse;
import java.io.PrintWriter;
import java.math.BigInteger;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CampaignServiceImpl implements CampaignService {

    private static final String CLOSED_AUDIENCE_WARNING =
            "Audience mode is CLOSED. The current audience members will be saved as a snapshot. "
                    + "New members added to the audience after this point will not be included.";

    private final DSLContext centralDslContext;
    private final Provider<SecurityUser> securityUser;
    private final CampaignMapper campaignMapper;

    @Override
    public CampaignResponseDto create(CampaignRequestDto request) {
        return centralDslContext.transactionResult(
                cfg -> {
                    DSLContext dsl = DSL.using(cfg);

                    if (request.getTemplateId() != null
                            && !dsl.fetchExists(
                                    TEMPLATES,
                                    TEMPLATES.ID.eq(BigInteger.valueOf(request.getTemplateId())))) {
                        throw new APIFunctionalException(CampaignErrors.TEMPLATE_NOT_FOUND);
                    }

                    String userId = securityUser.get().userId().toString();

                    CampaignsRecord campaign = dsl.newRecord(CAMPAIGNS);
                    campaign.setName(request.getName());
                    campaign.setDescription(request.getDescription());
                    if (request.getTemplateId() != null) {
                        campaign.setTemplateId(BigInteger.valueOf(request.getTemplateId()));
                    }
                    campaign.setCreatedBy(userId);
                    campaign.setStatus(CampaignStatus.DRAFT);
                    campaign.setChannelType(
                            request.getType() != null ? request.getType() : CampaignType.GENERAL);
                    campaign.setPersist(request.isPersist() ? (byte) 1 : (byte) 0);
                    campaign.setDispatchLogic(request.getDispatchLogic());
                    campaign.setScheduledAt(request.getScheduledAt());
                    campaign.setAudienceMode(
                            request.getAudienceMode() != null
                                    ? request.getAudienceMode()
                                    : AudienceMode.OPEN);
                    campaign.store();

                    BigInteger campaignId = campaign.getId();
                    insertChannels(dsl, campaignId, request);
                    insertAudiences(dsl, campaignId, request, userId);

                    return enrichResponse(dsl, campaign);
                });
    }

    @Override
    public CampaignResponseDto update(Long id, CampaignRequestDto request) {
        return centralDslContext.transactionResult(
                cfg -> {
                    DSLContext dsl = DSL.using(cfg);

                    CampaignsRecord campaign =
                            dsl.selectFrom(CAMPAIGNS)
                                    .where(CAMPAIGNS.ID.eq(BigInteger.valueOf(id)))
                                    .fetchOptional()
                                    .orElseThrow(
                                            () ->
                                                    new APIFunctionalException(
                                                            CampaignErrors.CAMPAIGN_NOT_FOUND));

                    if (campaign.getStatus() != CampaignStatus.DRAFT
                            && campaign.getStatus() != CampaignStatus.REJECTED) {
                        throw new APIFunctionalException(
                                CampaignErrors.CAMPAIGN_INVALID_STATUS_TRANSITION);
                    }

                    if (request.getTemplateId() != null
                            && !dsl.fetchExists(
                                    TEMPLATES,
                                    TEMPLATES.ID.eq(BigInteger.valueOf(request.getTemplateId())))) {
                        throw new APIFunctionalException(CampaignErrors.TEMPLATE_NOT_FOUND);
                    }

                    String userId = securityUser.get().userId().toString();

                    campaign.setName(request.getName());
                    campaign.setDescription(request.getDescription());
                    if (request.getTemplateId() != null) {
                        campaign.setTemplateId(BigInteger.valueOf(request.getTemplateId()));
                    }
                    campaign.setChannelType(
                            request.getType() != null
                                    ? request.getType()
                                    : campaign.getChannelType());
                    campaign.setPersist(request.isPersist() ? (byte) 1 : (byte) 0);
                    campaign.setDispatchLogic(request.getDispatchLogic());
                    campaign.setScheduledAt(request.getScheduledAt());
                    campaign.setAudienceMode(
                            request.getAudienceMode() != null
                                    ? request.getAudienceMode()
                                    : campaign.getAudienceMode());
                    campaign.setUpdatedBy(userId);
                    campaign.setUpdatedAt(LocalDateTime.now());
                    campaign.store();

                    BigInteger campaignId = campaign.getId();

                    // Replace channels
                    dsl.deleteFrom(CAMPAIGN_CHANNELS)
                            .where(CAMPAIGN_CHANNELS.CAMPAIGN_ID.eq(campaignId))
                            .execute();

                    // Replace audiences
                    dsl.deleteFrom(CAMPAIGN_AUDIENCES)
                            .where(CAMPAIGN_AUDIENCES.CAMPAIGN_ID.eq(campaignId))
                            .execute();

                    insertChannels(dsl, campaignId, request);
                    insertAudiences(dsl, campaignId, request, userId);

                    return enrichResponse(dsl, campaign);
                });
    }

    @Override
    public CampaignResponseDto getById(Long id) {
        CampaignsRecord campaign =
                centralDslContext
                        .selectFrom(CAMPAIGNS)
                        .where(CAMPAIGNS.ID.eq(BigInteger.valueOf(id)))
                        .fetchOptional()
                        .orElseThrow(
                                () ->
                                        new APIFunctionalException(
                                                CampaignErrors.CAMPAIGN_NOT_FOUND));
        return enrichResponse(centralDslContext, campaign);
    }

    @Override
    public CursorPage<CampaignResponseDto> getFiltered(
            CampaignSearchRequestDto request, CursorPaginationRequest pagination) {
        Condition condition = CampaignSpecifications.build(request);

        if (pagination.getCursor() != null && !pagination.getCursor().isBlank()) {
            condition =
                    condition.and(
                            applyCursorCondition(
                                    CursorDto.decodeCursor(pagination.getCursor()),
                                    CAMPAIGNS.CREATED_AT,
                                    CAMPAIGNS.ID));
        }

        List<CampaignsRecord> records =
                centralDslContext
                        .selectFrom(CAMPAIGNS)
                        .where(condition)
                        .orderBy(CAMPAIGNS.CREATED_AT.desc(), CAMPAIGNS.ID.desc())
                        .limit(pagination.getSize() + 1)
                        .fetch();

        boolean hasNextPage = records.size() > pagination.getSize();
        List<CampaignsRecord> pageRecords =
                hasNextPage ? records.subList(0, pagination.getSize()) : records;

        if (pageRecords.isEmpty()) {
            return CursorPage.<CampaignResponseDto>builder()
                    .data(List.of())
                    .nextCursor(null)
                    .hasNextPage(false)
                    .build();
        }

        List<BigInteger> campaignIds = pageRecords.stream().map(CampaignsRecord::getId).toList();

        // Batch-load all related data
        Map<BigInteger, List<CampaignAuthorizationResponseDto>> authsMap =
                fetchAuthorizationsBatch(centralDslContext, campaignIds);
        Map<BigInteger, List<Long>> audienceIdsMap =
                fetchAudienceIdsBatch(centralDslContext, campaignIds);
        Map<BigInteger, List<UserAssociation>> userAssociationsMap =
                fetchUserAssociationsBatch(centralDslContext, campaignIds);
        Map<BigInteger, List<Channel>> channelCodesMap =
                fetchChannelCodesBatch(centralDslContext, campaignIds);
        Map<BigInteger, Long> recipientCountsMap =
                fetchRecipientCountsBatch(centralDslContext, campaignIds);
        Map<BigInteger, Long> audienceMemberCountsMap =
                fetchAudienceMemberCountsBatch(centralDslContext, pageRecords);

        List<CampaignResponseDto> content =
                pageRecords.stream()
                        .map(
                                r -> {
                                    BigInteger id = r.getId();
                                    CampaignResponseDto dto = campaignMapper.toResponse(r);
                                    dto.setAuthorizations(authsMap.getOrDefault(id, List.of()));
                                    dto.setAudienceIds(audienceIdsMap.getOrDefault(id, List.of()));
                                    dto.setUserAssociations(
                                            userAssociationsMap.getOrDefault(id, List.of()));
                                    dto.setChannels(channelCodesMap.getOrDefault(id, List.of()));
                                    dto.setRecipientCount(recipientCountsMap.getOrDefault(id, 0L));
                                    dto.setAudienceMemberCount(
                                            audienceMemberCountsMap.getOrDefault(id, 0L));
                                    if (r.getAudienceMode() == AudienceMode.CLOSED) {
                                        dto.setAudienceWarning(CLOSED_AUDIENCE_WARNING);
                                    }
                                    return dto;
                                })
                        .toList();

        CampaignResponseDto lastItem = content.getLast();
        String nextCursor =
                hasNextPage ? encodeCursor(lastItem.getCreatedAt(), lastItem.getId()) : null;

        return CursorPage.<CampaignResponseDto>builder()
                .data(content)
                .nextCursor(nextCursor)
                .hasNextPage(hasNextPage)
                .build();
    }

    @Override
    public CampaignResponseDto submitForApproval(Long id) {
        return centralDslContext.transactionResult(
                cfg -> {
                    DSLContext dsl = DSL.using(cfg);

                    CampaignsRecord campaign =
                            dsl.selectFrom(CAMPAIGNS)
                                    .where(CAMPAIGNS.ID.eq(BigInteger.valueOf(id)))
                                    .fetchOptional()
                                    .orElseThrow(
                                            () ->
                                                    new APIFunctionalException(
                                                            CampaignErrors.CAMPAIGN_NOT_FOUND));

                    if (campaign.getStatus() != CampaignStatus.DRAFT
                            && campaign.getStatus() != CampaignStatus.REJECTED) {
                        throw new APIFunctionalException(
                                CampaignErrors.CAMPAIGN_INVALID_STATUS_TRANSITION);
                    }

                    validateCampaignReadyForApproval(dsl, campaign.getId());

                    campaign.setStatus(CampaignStatus.PENDING_APPROVAL);
                    campaign.setUpdatedBy(securityUser.get().userId().toString());
                    campaign.setUpdatedAt(LocalDateTime.now());
                    campaign.store();

                    // CLOSED mode: snapshot audience members into CAMPAIGN_RECIPIENTS now
                    if (campaign.getAudienceMode() == AudienceMode.CLOSED) {
                        snapshotAudienceMembers(dsl, campaign.getId());
                    }

                    return enrichResponse(dsl, campaign);
                });
    }

    @Override
    public CampaignResponseDto approve(Long id) {
        return centralDslContext.transactionResult(
                cfg -> {
                    DSLContext dsl = DSL.using(cfg);

                    CampaignsRecord campaign =
                            dsl.selectFrom(CAMPAIGNS)
                                    .where(CAMPAIGNS.ID.eq(BigInteger.valueOf(id)))
                                    .fetchOptional()
                                    .orElseThrow(
                                            () ->
                                                    new APIFunctionalException(
                                                            CampaignErrors.CAMPAIGN_NOT_FOUND));

                    if (campaign.getStatus() != CampaignStatus.PENDING_APPROVAL) {
                        throw new APIFunctionalException(
                                CampaignErrors.CAMPAIGN_INVALID_STATUS_TRANSITION);
                    }

                    String userId = securityUser.get().userId().toString();

                    dsl.insertInto(CAMPAIGN_AUTHORIZATIONS)
                            .set(CAMPAIGN_AUTHORIZATIONS.CAMPAIGN_ID, campaign.getId())
                            .set(CAMPAIGN_AUTHORIZATIONS.STATUS, AuthorizationStatus.APPROVED)
                            .set(CAMPAIGN_AUTHORIZATIONS.CREATED_BY, userId)
                            .execute();

                    campaign.setStatus(CampaignStatus.READY);
                    campaign.setUpdatedBy(userId);
                    campaign.setUpdatedAt(LocalDateTime.now());
                    campaign.store();

                    // OPEN mode: resolve audience members into CAMPAIGN_RECIPIENTS at approval time
                    if (campaign.getAudienceMode() == AudienceMode.OPEN) {
                        snapshotAudienceMembers(dsl, campaign.getId());
                    }

                    // Campaign is now READY. A separate scheduled processor picks up READY
                    // campaigns, moves them to ACTIVE (running) and dispatches notifications.

                    return enrichResponse(dsl, campaign);
                });
    }

    @Override
    public CampaignResponseDto reject(Long id, String reason) {
        return centralDslContext.transactionResult(
                cfg -> {
                    DSLContext dsl = DSL.using(cfg);

                    CampaignsRecord campaign =
                            dsl.selectFrom(CAMPAIGNS)
                                    .where(CAMPAIGNS.ID.eq(BigInteger.valueOf(id)))
                                    .fetchOptional()
                                    .orElseThrow(
                                            () ->
                                                    new APIFunctionalException(
                                                            CampaignErrors.CAMPAIGN_NOT_FOUND));

                    if (campaign.getStatus() != CampaignStatus.PENDING_APPROVAL) {
                        throw new APIFunctionalException(
                                CampaignErrors.CAMPAIGN_INVALID_STATUS_TRANSITION);
                    }

                    String userId = securityUser.get().userId().toString();

                    dsl.insertInto(CAMPAIGN_AUTHORIZATIONS)
                            .set(CAMPAIGN_AUTHORIZATIONS.CAMPAIGN_ID, campaign.getId())
                            .set(CAMPAIGN_AUTHORIZATIONS.STATUS, AuthorizationStatus.REJECTED)
                            .set(CAMPAIGN_AUTHORIZATIONS.REASON, reason)
                            .set(CAMPAIGN_AUTHORIZATIONS.CREATED_BY, userId)
                            .execute();

                    campaign.setStatus(CampaignStatus.REJECTED);
                    campaign.setUpdatedBy(userId);
                    campaign.setUpdatedAt(LocalDateTime.now());
                    campaign.store();

                    return enrichResponse(dsl, campaign);
                });
    }

    @SneakyThrows
    @Override
    public void exportCsv(CampaignSearchRequestDto request, HttpServletResponse response) {
        var condition = CampaignSpecifications.build(request);

        PrintWriter writer = response.getWriter();
        writer.print("id,name,status,createdAt,createdBy,templateId\r\n");

        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        // Stream rows so the result set never has to fit in memory.
        try (var cursor =
                centralDslContext
                        .selectFrom(CAMPAIGNS)
                        .where(condition)
                        .orderBy(CAMPAIGNS.CREATED_AT.desc())
                        .fetchLazy()) {
            while (cursor.hasNext()) {
                CampaignsRecord r = cursor.fetchNext();
                writer.print(
                        String.join(
                                ",",
                                csvField(r.getId() != null ? r.getId().toString() : null),
                                csvField(r.getName()),
                                csvField(r.getStatus() != null ? r.getStatus().name() : null),
                                csvField(
                                        r.getCreatedAt() != null
                                                ? r.getCreatedAt().format(fmt)
                                                : null),
                                csvField(r.getCreatedBy()),
                                csvField(
                                        r.getTemplateId() != null
                                                ? r.getTemplateId().toString()
                                                : null)));
                writer.print("\r\n");
            }
        }
        writer.flush();
    }

    private static String csvField(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        String safe = value;
        char first = safe.charAt(0);
        if (first == '='
                || first == '+'
                || first == '-'
                || first == '@'
                || first == '\t'
                || first == '\r') {
            safe = "'" + safe;
        }
        boolean mustQuote =
                safe.indexOf(',') >= 0
                        || safe.indexOf('"') >= 0
                        || safe.indexOf('\n') >= 0
                        || safe.indexOf('\r') >= 0;
        if (!mustQuote) {
            return safe;
        }
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }

    private static final int RECIPIENT_CHUNK_SIZE = 1000;

    private CampaignRecipientsRecord buildRecipient(
            DSLContext dsl, BigInteger campId, RecipientBasics basics) {
        CampaignRecipientsRecord rec = dsl.newRecord(CAMPAIGN_RECIPIENTS);
        rec.setCampaignId(campId);
        rec.setUserName(basics.userName);
        rec.setMobileNumber(basics.mobileNumber);
        rec.setCustomerNumber(basics.customerNumber);
        rec.setStatus(RecipientStatus.PENDING);
        return rec;
    }

    private int flushChunkIfFull(DSLContext dsl, List<CampaignRecipientsRecord> chunk) {
        if (chunk.size() < RECIPIENT_CHUNK_SIZE) {
            return 0;
        }
        return flushChunk(dsl, chunk);
    }

    private int flushChunk(DSLContext dsl, List<CampaignRecipientsRecord> chunk) {
        if (chunk.isEmpty()) {
            return 0;
        }
        dsl.batchInsert(chunk).execute();
        int size = chunk.size();
        chunk.clear();
        return size;
    }

    private record RecipientBasics(String userName, String mobileNumber, String customerNumber) {}

    @Override
    public void delete(Long id) {
        centralDslContext.transaction(
                cfg -> {
                    DSLContext dsl = DSL.using(cfg);

                    CampaignsRecord campaign =
                            dsl.selectFrom(CAMPAIGNS)
                                    .where(CAMPAIGNS.ID.eq(BigInteger.valueOf(id)))
                                    .fetchOptional()
                                    .orElseThrow(
                                            () ->
                                                    new APIFunctionalException(
                                                            CampaignErrors.CAMPAIGN_NOT_FOUND));

                    if (campaign.getStatus() != CampaignStatus.DRAFT
                            && campaign.getStatus() != CampaignStatus.REJECTED) {
                        throw new APIFunctionalException(
                                CampaignErrors.CAMPAIGN_INVALID_STATUS_TRANSITION);
                    }

                    dsl.deleteFrom(CAMPAIGNS)
                            .where(CAMPAIGNS.ID.eq(BigInteger.valueOf(id)))
                            .execute();
                });
    }

    private void validateCampaignReadyForApproval(DSLContext dsl, BigInteger campaignId) {
        boolean hasChannels =
                dsl.fetchExists(CAMPAIGN_CHANNELS, CAMPAIGN_CHANNELS.CAMPAIGN_ID.eq(campaignId));
        boolean hasAudiences =
                dsl.fetchExists(CAMPAIGN_AUDIENCES, CAMPAIGN_AUDIENCES.CAMPAIGN_ID.eq(campaignId));
        if (!hasChannels || !hasAudiences) {
            throw new APIFunctionalException(CampaignErrors.CAMPAIGN_INCOMPLETE);
        }

        // Audiences must be either member-list-based or device-query-based, not both.
        if (CampaignAudienceSpecifications.hasDeviceQueryAudience(dsl, campaignId)
                && CampaignAudienceSpecifications.hasMemberListAudience(dsl, campaignId)) {
            throw new APIFunctionalException(CampaignErrors.CAMPAIGN_MIXED_AUDIENCE_KINDS);
        }

        // Campaigns with member-list audiences must use CLOSED mode.
        if (CampaignAudienceSpecifications.hasMemberListAudience(dsl, campaignId)) {
            AudienceMode mode =
                    dsl.select(CAMPAIGNS.AUDIENCE_MODE)
                            .from(CAMPAIGNS)
                            .where(CAMPAIGNS.ID.eq(campaignId))
                            .fetchOne(CAMPAIGNS.AUDIENCE_MODE);
            if (mode != AudienceMode.CLOSED) {
                throw new APIFunctionalException(
                        CampaignErrors.CAMPAIGN_UPLOADED_LIST_REQUIRES_CLOSED_MODE);
            }
        }
    }

    private void insertChannels(DSLContext dsl, BigInteger campaignId, CampaignRequestDto request) {
        if (request.getChannels() != null && !request.getChannels().isEmpty()) {
            List<CampaignChannelsRecord> records =
                    request.getChannels().stream()
                            .map(
                                    channel -> {
                                        var rec = dsl.newRecord(CAMPAIGN_CHANNELS);
                                        rec.setCampaignId(campaignId);
                                        rec.setChannelCode(channel);
                                        return rec;
                                    })
                            .toList();
            dsl.batchInsert(records).execute();
        }
    }

    private void insertAudiences(
            DSLContext dsl, BigInteger campaignId, CampaignRequestDto request, String userId) {
        if (request.getAudienceIds() == null || request.getAudienceIds().isEmpty()) {
            return;
        }
        Set<BigInteger> uniqueIds =
                request.getAudienceIds().stream()
                        .map(BigInteger::valueOf)
                        .collect(Collectors.toCollection(LinkedHashSet::new));
        int existingCount =
                dsl.selectCount()
                        .from(AUDIENCES)
                        .where(AUDIENCES.ID.in(uniqueIds))
                        .fetchOne(0, int.class);
        if (existingCount != uniqueIds.size()) {
            throw new APIFunctionalException(CampaignErrors.AUDIENCE_NOT_FOUND);
        }
        List<CampaignAudiencesRecord> records =
                uniqueIds.stream()
                        .map(
                                audienceId -> {
                                    var rec = dsl.newRecord(CAMPAIGN_AUDIENCES);
                                    rec.setCampaignId(campaignId);
                                    rec.setAudienceId(audienceId);
                                    rec.setCreatedBy(userId);
                                    return rec;
                                })
                        .toList();
        dsl.batchInsert(records).execute();
    }

    private CampaignResponseDto enrichResponse(DSLContext dsl, CampaignsRecord campaign) {
        List<BigInteger> ids = List.of(campaign.getId());
        CampaignResponseDto dto = campaignMapper.toResponse(campaign);
        dto.setAuthorizations(
                fetchAuthorizationsBatch(dsl, ids).getOrDefault(campaign.getId(), List.of()));
        dto.setAudienceIds(
                fetchAudienceIdsBatch(dsl, ids).getOrDefault(campaign.getId(), List.of()));
        dto.setUserAssociations(
                fetchUserAssociationsBatch(dsl, ids).getOrDefault(campaign.getId(), List.of()));
        dto.setChannels(fetchChannelCodesBatch(dsl, ids).getOrDefault(campaign.getId(), List.of()));
        dto.setRecipientCount(
                fetchRecipientCountsBatch(dsl, ids).getOrDefault(campaign.getId(), 0L));

        // Audience member count from linked audiences
        dto.setAudienceMemberCount(fetchAudienceMemberCount(dsl, campaign.getId()));

        if (campaign.getAudienceMode() == AudienceMode.CLOSED) {
            dto.setAudienceWarning(CLOSED_AUDIENCE_WARNING);
        }

        return dto;
    }

    private void snapshotAudienceMembers(DSLContext dsl, BigInteger campaignId) {
        dsl.deleteFrom(CAMPAIGN_RECIPIENTS)
                .where(CAMPAIGN_RECIPIENTS.CAMPAIGN_ID.eq(campaignId))
                .execute();

        if (isDeviceBasedCampaign(dsl, campaignId)) {
            snapshotDeviceRecipients(dsl, campaignId, fetchAudienceCriteria(dsl, campaignId));
        } else {
            snapshotAudienceMemberRecipients(dsl, campaignId);
        }
    }

    private void snapshotAudienceMemberRecipients(DSLContext dsl, BigInteger campaignId) {
        List<BigInteger> audienceIds =
                dsl.select(CAMPAIGN_AUDIENCES.AUDIENCE_ID)
                        .from(CAMPAIGN_AUDIENCES)
                        .where(CAMPAIGN_AUDIENCES.CAMPAIGN_ID.eq(campaignId))
                        .fetch(r -> r.get(CAMPAIGN_AUDIENCES.AUDIENCE_ID));

        if (audienceIds.isEmpty()) {
            return;
        }

        List<CampaignRecipientsRecord> chunk = new ArrayList<>(RECIPIENT_CHUNK_SIZE);
        int totalInserted = 0;

        var members = AudienceRecipientSpecifications.buildMemberQuery(dsl, audienceIds).fetch();

        for (org.jooq.Record member : members) {
            RecipientBasics basics =
                    new RecipientBasics(
                            member.get(AUDIENCE_MEMBERS.USER_NAME),
                            member.get(AUDIENCE_MEMBERS.MOBILE_NUMBER),
                            member.get(AUDIENCE_MEMBERS.CUSTOMER_NUMBER));
            chunk.add(buildRecipient(dsl, campaignId, basics));
            totalInserted += flushChunkIfFull(dsl, chunk);
        }
        totalInserted += flushChunk(dsl, chunk);

        log.info(
                "Snapshot {} audience members as recipients for campaign {}",
                totalInserted,
                campaignId);
    }

    private void snapshotDeviceRecipients(
            DSLContext dsl, BigInteger campaignId, AudienceCriteria criteria) {
        List<CampaignRecipientsRecord> chunk = new ArrayList<>(RECIPIENT_CHUNK_SIZE);
        int totalInserted = 0;

        var devices = DeviceRecipientSpecifications.buildDeviceQuery(dsl, criteria).fetch();

        for (org.jooq.Record4<BigInteger, String, Byte, String> device : devices) {
            RecipientBasics basics =
                    new RecipientBasics(device.get(USER_DEVICES.USER_NAME), null, null);
            chunk.add(buildRecipient(dsl, campaignId, basics));
            totalInserted += flushChunkIfFull(dsl, chunk);
        }
        totalInserted += flushChunk(dsl, chunk);

        log.info(
                "Snapshot {} devices as recipients for campaign {} (criteria={})",
                totalInserted,
                campaignId,
                criteria);
    }

    private boolean isDeviceBasedCampaign(DSLContext dsl, BigInteger campaignId) {
        return dsl.fetchExists(
                        dsl.selectOne()
                                .from(CAMPAIGN_AUDIENCES)
                                .join(AUDIENCE_PLATFORMS)
                                .on(
                                        AUDIENCE_PLATFORMS.AUDIENCE_ID.eq(
                                                CAMPAIGN_AUDIENCES.AUDIENCE_ID))
                                .where(CAMPAIGN_AUDIENCES.CAMPAIGN_ID.eq(campaignId)))
                || dsl.fetchExists(
                        dsl.selectOne()
                                .from(CAMPAIGN_AUDIENCES)
                                .join(AUDIENCE_USER_ASSOCIATIONS)
                                .on(
                                        AUDIENCE_USER_ASSOCIATIONS.AUDIENCE_ID.eq(
                                                CAMPAIGN_AUDIENCES.AUDIENCE_ID))
                                .where(CAMPAIGN_AUDIENCES.CAMPAIGN_ID.eq(campaignId)));
    }

    private AudienceCriteria fetchAudienceCriteria(DSLContext dsl, BigInteger campaignId) {
        List<BigInteger> audienceIds =
                dsl.select(CAMPAIGN_AUDIENCES.AUDIENCE_ID)
                        .from(CAMPAIGN_AUDIENCES)
                        .where(CAMPAIGN_AUDIENCES.CAMPAIGN_ID.eq(campaignId))
                        .fetch(CAMPAIGN_AUDIENCES.AUDIENCE_ID);

        if (audienceIds.isEmpty()) {
            return AudienceCriteria.empty();
        }

        List<Byte> platforms =
                dsl.selectDistinct(AUDIENCE_PLATFORMS.PLATFORM)
                        .from(AUDIENCE_PLATFORMS)
                        .where(AUDIENCE_PLATFORMS.AUDIENCE_ID.in(audienceIds))
                        .fetch(AUDIENCE_PLATFORMS.PLATFORM);

        Set<UserAssociation> userAssociations =
                new HashSet<>(
                        dsl.selectDistinct(AUDIENCE_USER_ASSOCIATIONS.USER_ASSOCIATION)
                                .from(AUDIENCE_USER_ASSOCIATIONS)
                                .where(AUDIENCE_USER_ASSOCIATIONS.AUDIENCE_ID.in(audienceIds))
                                .fetch(AUDIENCE_USER_ASSOCIATIONS.USER_ASSOCIATION));

        // language is per-audience; if multiple audiences differ we leave it null (no filter).
        List<String> languages =
                dsl.selectDistinct(AUDIENCES.LANGUAGE)
                        .from(AUDIENCES)
                        .where(AUDIENCES.ID.in(audienceIds))
                        .and(AUDIENCES.LANGUAGE.isNotNull())
                        .fetch(AUDIENCES.LANGUAGE);
        String language = languages.size() == 1 ? languages.get(0) : null;

        return new AudienceCriteria(platforms, userAssociations, language);
    }

    private long fetchAudienceMemberCount(DSLContext dsl, BigInteger campaignId) {
        if (isDeviceBasedCampaign(dsl, campaignId)) {
            AudienceCriteria criteria = fetchAudienceCriteria(dsl, campaignId);
            return DeviceRecipientSpecifications.buildDeviceCountQuery(dsl, criteria)
                    .fetchOne(0, long.class);
        }

        List<BigInteger> audienceIds =
                dsl.select(CAMPAIGN_AUDIENCES.AUDIENCE_ID)
                        .from(CAMPAIGN_AUDIENCES)
                        .where(CAMPAIGN_AUDIENCES.CAMPAIGN_ID.eq(campaignId))
                        .fetch(r -> r.get(CAMPAIGN_AUDIENCES.AUDIENCE_ID));

        if (audienceIds.isEmpty()) {
            return 0L;
        }

        return AudienceRecipientSpecifications.buildMemberCountQuery(dsl, audienceIds)
                .fetchOne(0, long.class);
    }

    private Map<BigInteger, Long> fetchAudienceMemberCountsBatch(
            DSLContext dsl, List<CampaignsRecord> records) {
        Map<BigInteger, Long> result = new HashMap<>();
        if (records.isEmpty()) {
            return result;
        }

        List<BigInteger> userListIds = new ArrayList<>();
        List<BigInteger> deviceBasedIds = new ArrayList<>();
        for (CampaignsRecord r : records) {
            if (isDeviceBasedCampaign(dsl, r.getId())) {
                deviceBasedIds.add(r.getId());
            } else {
                userListIds.add(r.getId());
            }
        }

        if (!userListIds.isEmpty()) {
            Map<BigInteger, Long> grouped =
                    dsl.select(
                                    CAMPAIGN_AUDIENCES.CAMPAIGN_ID,
                                    DSL.count(AUDIENCE_MEMBERS.ID).cast(Long.class))
                            .from(CAMPAIGN_AUDIENCES)
                            .join(AUDIENCE_MEMBERS)
                            .on(AUDIENCE_MEMBERS.AUDIENCE_ID.eq(CAMPAIGN_AUDIENCES.AUDIENCE_ID))
                            .where(CAMPAIGN_AUDIENCES.CAMPAIGN_ID.in(userListIds))
                            .groupBy(CAMPAIGN_AUDIENCES.CAMPAIGN_ID)
                            .fetchMap(
                                    CAMPAIGN_AUDIENCES.CAMPAIGN_ID,
                                    DSL.count(AUDIENCE_MEMBERS.ID).cast(Long.class));
            for (BigInteger id : userListIds) {
                result.put(id, grouped.getOrDefault(id, 0L));
            }
        }

        if (!deviceBasedIds.isEmpty()) {
            // Cache by criteria so audiences with identical filters share a single COUNT query.
            Map<AudienceCriteria, Long> countCache = new HashMap<>();
            for (BigInteger campId : deviceBasedIds) {
                AudienceCriteria criteria = fetchAudienceCriteria(dsl, campId);
                Long count =
                        countCache.computeIfAbsent(
                                criteria,
                                k ->
                                        DeviceRecipientSpecifications.buildDeviceCountQuery(dsl, k)
                                                .fetchOne(0, long.class));
                result.put(campId, count);
            }
        }

        return result;
    }

    private Map<BigInteger, List<CampaignAuthorizationResponseDto>> fetchAuthorizationsBatch(
            DSLContext dsl, List<BigInteger> campaignIds) {
        return dsl
                .selectFrom(CAMPAIGN_AUTHORIZATIONS)
                .where(CAMPAIGN_AUTHORIZATIONS.CAMPAIGN_ID.in(campaignIds))
                .fetch()
                .stream()
                .collect(
                        Collectors.groupingBy(
                                CampaignAuthorizationsRecord::getCampaignId,
                                Collectors.mapping(
                                        campaignMapper::toAuthorizationResponse,
                                        Collectors.toList())));
    }

    private Map<BigInteger, List<Long>> fetchAudienceIdsBatch(
            DSLContext dsl, List<BigInteger> campaignIds) {
        return dsl
                .select(CAMPAIGN_AUDIENCES.CAMPAIGN_ID, CAMPAIGN_AUDIENCES.AUDIENCE_ID)
                .from(CAMPAIGN_AUDIENCES)
                .where(CAMPAIGN_AUDIENCES.CAMPAIGN_ID.in(campaignIds))
                .fetch()
                .stream()
                .collect(
                        Collectors.groupingBy(
                                r -> r.get(CAMPAIGN_AUDIENCES.CAMPAIGN_ID),
                                Collectors.mapping(
                                        r -> r.get(CAMPAIGN_AUDIENCES.AUDIENCE_ID).longValue(),
                                        Collectors.toList())));
    }

    private Map<BigInteger, List<UserAssociation>> fetchUserAssociationsBatch(
            DSLContext dsl, List<BigInteger> campaignIds) {
        return dsl
                .selectDistinct(
                        CAMPAIGN_AUDIENCES.CAMPAIGN_ID, AUDIENCE_USER_ASSOCIATIONS.USER_ASSOCIATION)
                .from(CAMPAIGN_AUDIENCES)
                .join(AUDIENCE_USER_ASSOCIATIONS)
                .on(CAMPAIGN_AUDIENCES.AUDIENCE_ID.eq(AUDIENCE_USER_ASSOCIATIONS.AUDIENCE_ID))
                .where(CAMPAIGN_AUDIENCES.CAMPAIGN_ID.in(campaignIds))
                .fetch()
                .stream()
                .collect(
                        Collectors.groupingBy(
                                r -> r.get(CAMPAIGN_AUDIENCES.CAMPAIGN_ID),
                                Collectors.mapping(
                                        r -> r.get(AUDIENCE_USER_ASSOCIATIONS.USER_ASSOCIATION),
                                        Collectors.toList())));
    }

    private Map<BigInteger, List<Channel>> fetchChannelCodesBatch(
            DSLContext dsl, List<BigInteger> campaignIds) {
        return dsl
                .select(CAMPAIGN_CHANNELS.CAMPAIGN_ID, CAMPAIGN_CHANNELS.CHANNEL_CODE)
                .from(CAMPAIGN_CHANNELS)
                .where(CAMPAIGN_CHANNELS.CAMPAIGN_ID.in(campaignIds))
                .fetch()
                .stream()
                .collect(
                        Collectors.groupingBy(
                                r -> r.get(CAMPAIGN_CHANNELS.CAMPAIGN_ID),
                                Collectors.mapping(
                                        r -> r.get(CAMPAIGN_CHANNELS.CHANNEL_CODE),
                                        Collectors.toList())));
    }

    private Map<BigInteger, Long> fetchRecipientCountsBatch(
            DSLContext dsl, List<BigInteger> campaignIds) {
        return dsl.select(CAMPAIGN_RECIPIENTS.CAMPAIGN_ID, DSL.count().cast(Long.class))
                .from(CAMPAIGN_RECIPIENTS)
                .where(CAMPAIGN_RECIPIENTS.CAMPAIGN_ID.in(campaignIds))
                .groupBy(CAMPAIGN_RECIPIENTS.CAMPAIGN_ID)
                .fetchMap(CAMPAIGN_RECIPIENTS.CAMPAIGN_ID, DSL.count().cast(Long.class));
    }
}
