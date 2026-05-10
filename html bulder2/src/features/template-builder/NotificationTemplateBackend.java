// ─────────────────────────────────────────────────────────────────────────────
// Spring Boot Backend — Notification Template API
// Package: com.yourapp.notifications.template
//
// Files in this snippet (one per section):
//   1. NotificationTemplateDto.java
//   2. NotificationTemplate.java       (JPA Entity)
//   3. NotificationTemplateRepository.java
//   4. NotificationTemplateService.java
//   5. NotificationTemplateController.java
//   6. TemplateVariableExtractor.java  (utility)
// ─────────────────────────────────────────────────────────────────────────────

// ════════════════════════════════════════════════════════════════════
// 1. NotificationTemplateDto.java
// ════════════════════════════════════════════════════════════════════
/*
package com.yourapp.notifications.template;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public record NotificationTemplateDto(

    @NotBlank(message = "templateKey is required")
    @Pattern(regexp = "^[a-z0-9_]+$", message = "templateKey must be snake_case")
    String templateKey,

    @NotBlank(message = "name is required")
    String name,

    int version,

    @NotBlank(message = "html is required")
    String html,

    // GrapesJS project JSON — stored as TEXT/JSON column for re-editing
    Object project,

    List<String> variables
) {}
*/

// ════════════════════════════════════════════════════════════════════
// 2. NotificationTemplate.java  (JPA Entity)
// ════════════════════════════════════════════════════════════════════
/*
package com.yourapp.notifications.template;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "notification_templates")
public class NotificationTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // Human-readable unique key: "payment_success"
    @Column(nullable = false, unique = true, length = 128)
    private String templateKey;

    @Column(nullable = false, length = 256)
    private String name;

    @Column(nullable = false)
    private int version = 1;

    // Production-ready HTML with embedded CSS
    @Column(nullable = false, columnDefinition = "TEXT")
    private String html;

    // GrapesJS project JSON — serialized as JSONB (Postgres) or TEXT (MySQL)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Object project;

    // Extracted variable keys: ["name", "amount", "date"]
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> variables;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() { this.updatedAt = Instant.now(); }

    // ── Getters / Setters (or use Lombok @Data) ─────────────────────
    public String getId() { return id; }
    public String getTemplateKey() { return templateKey; }
    public void setTemplateKey(String k) { this.templateKey = k; }
    public String getName() { return name; }
    public void setName(String n) { this.name = n; }
    public int getVersion() { return version; }
    public void setVersion(int v) { this.version = v; }
    public String getHtml() { return html; }
    public void setHtml(String h) { this.html = h; }
    public Object getProject() { return project; }
    public void setProject(Object p) { this.project = p; }
    public List<String> getVariables() { return variables; }
    public void setVariables(List<String> v) { this.variables = v; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant u) { this.updatedAt = u; }
}
*/

// ════════════════════════════════════════════════════════════════════
// 3. NotificationTemplateRepository.java
// ════════════════════════════════════════════════════════════════════
/*
package com.yourapp.notifications.template;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface NotificationTemplateRepository
        extends JpaRepository<NotificationTemplate, String> {

    Optional<NotificationTemplate> findByTemplateKey(String templateKey);
    boolean existsByTemplateKey(String templateKey);
    void deleteByTemplateKey(String templateKey);
}
*/

// ════════════════════════════════════════════════════════════════════
// 4. NotificationTemplateService.java
// ════════════════════════════════════════════════════════════════════
/*
package com.yourapp.notifications.template;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional
public class NotificationTemplateService {

    private final NotificationTemplateRepository repo;

    public NotificationTemplateService(NotificationTemplateRepository repo) {
        this.repo = repo;
    }

    // ── Create ─────────────────────────────────────────────────────
    public NotificationTemplate create(NotificationTemplateDto dto) {
        if (repo.existsByTemplateKey(dto.templateKey())) {
            throw new IllegalArgumentException(
                "Template key already exists: " + dto.templateKey());
        }
        return repo.save(fromDto(new NotificationTemplate(), dto));
    }

    // ── Update (new version) ────────────────────────────────────────
    public NotificationTemplate update(String key, NotificationTemplateDto dto) {
        NotificationTemplate existing = repo.findByTemplateKey(key)
            .orElseThrow(() -> new IllegalArgumentException("Not found: " + key));

        return repo.save(fromDto(existing, dto));
    }

    // ── Get by key ─────────────────────────────────────────────────
    public NotificationTemplate getByKey(String key) {
        return repo.findByTemplateKey(key)
            .orElseThrow(() -> new IllegalArgumentException("Not found: " + key));
    }

    // ── List all ───────────────────────────────────────────────────
    public List<NotificationTemplate> getAll() {
        return repo.findAll();
    }

    // ── Delete ─────────────────────────────────────────────────────
    public void deleteByKey(String key) {
        repo.deleteByTemplateKey(key);
    }

    // ── Render: replace {{var}} with actual values ──────────────────
    public String render(String templateKey, Map<String, String> variables) {
        NotificationTemplate template = getByKey(templateKey);
        String html = template.getHtml();

        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "\\{\\{" + Pattern.quote(entry.getKey()) + "\\}\\}";
            html = html.replaceAll(placeholder,
                Matcher.quoteReplacement(entry.getValue()));
        }
        return html;
    }

    // ── Helper ─────────────────────────────────────────────────────
    private NotificationTemplate fromDto(NotificationTemplate t,
                                         NotificationTemplateDto dto) {
        t.setTemplateKey(dto.templateKey());
        t.setName(dto.name());
        t.setVersion(dto.version() > 0 ? dto.version() : 1);
        t.setHtml(dto.html());
        t.setProject(dto.project());
        t.setVariables(dto.variables() != null
            ? dto.variables()
            : TemplateVariableExtractor.extract(dto.html()));
        return t;
    }
}
*/

// ════════════════════════════════════════════════════════════════════
// 5. NotificationTemplateController.java
// ════════════════════════════════════════════════════════════════════
/*
package com.yourapp.notifications.template;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications/templates")
@CrossOrigin(origins = "*")  // tighten in production
public class NotificationTemplateController {

    private final NotificationTemplateService service;

    public NotificationTemplateController(NotificationTemplateService service) {
        this.service = service;
    }

    // POST /api/notifications/templates
    @PostMapping
    public ResponseEntity<NotificationTemplate> create(
            @Valid @RequestBody NotificationTemplateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                             .body(service.create(dto));
    }

    // GET /api/notifications/templates
    @GetMapping
    public List<NotificationTemplate> getAll() {
        return service.getAll();
    }

    // GET /api/notifications/templates/{key}
    @GetMapping("/{key}")
    public NotificationTemplate getByKey(@PathVariable String key) {
        return service.getByKey(key);
    }

    // PUT /api/notifications/templates/{key}
    @PutMapping("/{key}")
    public NotificationTemplate update(
            @PathVariable String key,
            @Valid @RequestBody NotificationTemplateDto dto) {
        return service.update(key, dto);
    }

    // DELETE /api/notifications/templates/{key}
    @DeleteMapping("/{key}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String key) {
        service.deleteByKey(key);
    }

    // POST /api/notifications/templates/{key}/render
    // Body: { "name": "John", "amount": "$120.00" }
    // Returns: rendered HTML string (ready to send as notification body)
    @PostMapping("/{key}/render")
    public ResponseEntity<String> render(
            @PathVariable String key,
            @RequestBody Map<String, String> variables) {
        String html = service.render(key, variables);
        return ResponseEntity.ok()
                             .header("Content-Type", "text/html; charset=UTF-8")
                             .body(html);
    }
}
*/

// ════════════════════════════════════════════════════════════════════
// 6. TemplateVariableExtractor.java
// ════════════════════════════════════════════════════════════════════
/*
package com.yourapp.notifications.template;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class TemplateVariableExtractor {

    private static final Pattern VAR_PATTERN =
        Pattern.compile("\\{\\{([a-zA-Z0-9_]+)\\}\\}");

    private TemplateVariableExtractor() {}

    // Extracts unique variable keys from template HTML
    // "Hello {{name}}, your order {{orderId}} is ready."
    // → ["name", "orderId"]
    public static List<String> extract(String html) {
        if (html == null || html.isBlank()) return List.of();
        LinkedHashSet<String> found = new LinkedHashSet<>();
        Matcher m = VAR_PATTERN.matcher(html);
        while (m.find()) {
            found.add(m.group(1));
        }
        return new ArrayList<>(found);
    }
}
*/

// ════════════════════════════════════════════════════════════════════
// SQL — Liquibase / Flyway migration
// ════════════════════════════════════════════════════════════════════
/*
-- V1__create_notification_templates.sql

CREATE TABLE notification_templates (
    id              VARCHAR(36)  NOT NULL PRIMARY KEY,
    template_key    VARCHAR(128) NOT NULL UNIQUE,
    name            VARCHAR(256) NOT NULL,
    version         INT          NOT NULL DEFAULT 1,
    html            TEXT         NOT NULL,
    project         JSONB        NOT NULL,
    variables       JSONB,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_templates_key ON notification_templates(template_key);
*/