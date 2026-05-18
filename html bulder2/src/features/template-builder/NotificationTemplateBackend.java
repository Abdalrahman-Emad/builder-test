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
    ON DELETE CASCADE;/*******************/
package com.example.project.controller.v1;

import com.example.project.dto.label.LabelRequestDto;
import com.example.project.dto.label.LabelResponseDto;
import com.example.project.service.LabelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/labels")
@RequiredArgsConstructor
public class LabelsControllerV1 {

    private final LabelService labelService;

    @GetMapping
    public List<LabelResponseDto> getAllLabels() {
        return labelService.getAllLabels();
    }

    @GetMapping("/{id}")
    public LabelResponseDto getLabelById(@PathVariable Long id) {
        return labelService.getLabelById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LabelResponseDto createLabel(
            @Valid @RequestBody LabelRequestDto request
    ) {
        return labelService.createLabel(request);
    }

    @PutMapping("/{id}")
    public LabelResponseDto updateLabel(
            @PathVariable Long id,
            @Valid @RequestBody LabelRequestDto request
    ) {
        return labelService.updateLabel(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLabel(@PathVariable Long id) {
        labelService.deleteLabel(id);
    }
}
