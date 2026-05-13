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
