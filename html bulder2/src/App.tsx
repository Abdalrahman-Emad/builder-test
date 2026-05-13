import TemplateBuilderPage from "./features/template-builder/TemplateBuilderPage"

function App() {

  return (
    <>
      <TemplateBuilderPage />
    </>
  )
}

export default App




package com.cibeg.digital.notifications.api.dto.campaign;

import com.cibeg.digital.notifications.sms.dispatcher.central.repository.model.TemplateSchemaType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateRequestDto {

    @NotBlank private String name;

    private String description;

    private TemplateSchemaType schemaType;

    private List<TemplateContentRequestDto> contents;

    private List<SmsTemplateRequestDto> smsTemplates;

    private List<PushTemplateRequestDto> pushTemplates;

    private List<InboxTemplateRequestDto> inboxTemplates;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TemplateContentRequestDto {
        @NotNull private Long languageId;
        private String title;
        @NotBlank private String text;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SmsTemplateRequestDto {
        @NotNull private Long languageId;
        @NotBlank private String text;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PushTemplateRequestDto {
        @NotNull private Long languageId;
        @NotBlank private String title;
        @NotBlank private String text;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InboxTemplateRequestDto {
        @NotNull private Long languageId;
        @NotBlank private String subject;
        @NotBlank private String text;
    }
}
//////////////////////////***************/
package com.cibeg.digital.notifications.api.dto.campaign;

import com.cibeg.digital.notifications.sms.dispatcher.central.repository.model.TemplateSchemaType;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.ALWAYS)
public class TemplateResponseDto {

    private Long id;
    private String name;
    private String description;
    private TemplateSchemaType schemaType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
    private List<TemplateContentResponseDto> contents;
    private List<SmsTemplateResponseDto> smsTemplates;
    private List<PushTemplateResponseDto> pushTemplates;
    private List<InboxTemplateResponseDto> inboxTemplates;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TemplateContentResponseDto {
        private Long languageId;
        private String languageCode;
        private String title;
        private String text;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SmsTemplateResponseDto {
        private Long languageId;
        private String languageCode;
        private String text;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PushTemplateResponseDto {
        private Long languageId;
        private String languageCode;
        private String title;
        private String text;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InboxTemplateResponseDto {
        private Long languageId;
        private String languageCode;
        private String subject;
        private String text;
    }
}
/*************************/
package com.cibeg.digital.notifications.api.controller.campaign;

import com.cibeg.digital.notifications.api.dto.campaign.*;
import com.cibeg.digital.notifications.api.service.campaign.TemplateService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/templates")
@RequiredArgsConstructor
public class TemplateControllerV1 {

    private final TemplateService templateService;

    @PreAuthorize("hasAuthority('campaign-inputter')")
    @PostMapping
    public ResponseEntity<TemplateResponseDto> create(
            @Valid @RequestBody TemplateRequestDto request) {
        TemplateResponseDto created = templateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PreAuthorize("hasAnyAuthority('campaign-inputter', 'campaign-authorizer')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TemplateResponseDto>> getById(@PathVariable Long id) {
        TemplateResponseDto found = templateService.getById(id);
        return ResponseEntity.ok(ApiResponse.<TemplateResponseDto>builder().data(found).build());
    }

    @PreAuthorize("hasAnyAuthority('campaign-inputter', 'campaign-authorizer')")
    @GetMapping
    public ApiCursorResponse<List<TemplateResponseDto>> getAll(
            @Valid @ModelAttribute CursorPaginationRequest request) {
        CursorPage<TemplateResponseDto> response = templateService.getAll(request);
        return ApiCursorResponse.<List<TemplateResponseDto>>builder()
                .data(response.getData())
                .cursor(response.getNextCursor())
                .hasNext(response.isHasNextPage())
                .build();
    }

    @PreAuthorize("hasAuthority('campaign-inputter')")
    @PutMapping("/{id}")
    public ResponseEntity<TemplateResponseDto> update(
            @PathVariable Long id, @Valid @RequestBody TemplateRequestDto request) {
        TemplateResponseDto updated = templateService.update(id, request);
        return ResponseEntity.ok(updated);
    }

    @PreAuthorize("hasAuthority('campaign-inputter')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        templateService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
/******service*************/
package com.cibeg.digital.notifications.api.service.campaign;

import com.cibeg.digital.notifications.api.dto.campaign.CursorPage;
import com.cibeg.digital.notifications.api.dto.campaign.CursorPaginationRequest;
import com.cibeg.digital.notifications.api.dto.campaign.TemplateRequestDto;
import com.cibeg.digital.notifications.api.dto.campaign.TemplateResponseDto;

public interface TemplateService {

    TemplateResponseDto create(TemplateRequestDto request);

    TemplateResponseDto getById(Long id);

    CursorPage<TemplateResponseDto> getAll(CursorPaginationRequest request);

    TemplateResponseDto update(Long id, TemplateRequestDto request);

    void delete(Long id);

    void validateSchema(String schema);
}



/****************************/
package com.cibeg.digital.notifications.api.mapper;

import com.cibeg.digital.notifications.api.dto.InboxMessageDetailDto;
import com.cibeg.digital.notifications.api.dto.InboxMessageListItemDto;
import com.cibeg.digital.notifications.sms.dispatcher.central.repository.model.InboxMessage;
import org.mapstruct.*;

@Mapper(
        componentModel = MappingConstants.ComponentModel.SPRING,
        nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS,
        collectionMappingStrategy = CollectionMappingStrategy.TARGET_IMMUTABLE)
public interface InboxMessageMapper {

    @Mapping(target = "read", source = "read")
    InboxMessageListItemDto toListItem(InboxMessage entity);

    @Mapping(target = "read", source = "entity.read")
    @Mapping(target = "totalNumOfUnread", source = "totalNumOfUnread")
    InboxMessageDetailDto toDetail(InboxMessage entity, long totalNumOfUnread);
}
