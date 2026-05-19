@campaign-portal-e2e @labels
Feature: Campaign Labels

  Background:
    Given a logged in user with id "inputter001" and roles "campaign-inputter"
    And the campaign portal data is clean
    And the central LANGUAGES table contains:
      | id     | name    | code |
      | #lang1 | English | en   |
      | #lang2 | Arabic  | ar   |

  Scenario: Create campaign with labels
    When I create a campaign portal template:
      """
      {
        "name": "Labels Template",
        "smsTemplates": [
          {"languageId": #lang1, "text": "hello"},
          {"languageId": #lang2, "text": "مرحبا"}
        ]
      }
      """
    And I save campaign portal response field "id" as "#tmpl1"

    When I create a campaign portal campaign:
      """
      {
        "name": "Campaign With Labels",
        "templateId": #tmpl1,
        "channels": ["SMS"],
        "audienceMode": "OPEN",
        "labels": ["ANNOUNCEMENT", "TRANSACTIONAL"]
      }
      """
    Then the campaign portal response status should be 201
    And I save campaign portal response field "id" as "#camp1"

    When I get campaign portal campaign "#camp1"
    Then the campaign portal response status should be 200
    And the campaign portal response field "labels[0]" should be "ANNOUNCEMENT"
    And the campaign portal response field "labels[1]" should be "TRANSACTIONAL"

  Scenario: Get campaign returns labels
    When I create a campaign portal template:
      """
      {
        "name": "Labels Template",
        "smsTemplates": [
          {"languageId": #lang1, "text": "hello"},
          {"languageId": #lang2, "text": "مرحبا"}
        ]
      }
      """
    And I save campaign portal response field "id" as "#tmpl1"

    When I create a campaign portal campaign:
      """
      {
        "name": "Campaign Labels Get",
        "templateId": #tmpl1,
        "channels": ["SMS"],
        "audienceMode": "OPEN",
        "labels": ["ANNOUNCEMENT"]
      }
      """
    Then the campaign portal response status should be 201
    And I save campaign portal response field "id" as "#camp1"

    When I get campaign portal campaign "#camp1"
    Then the campaign portal response status should be 200
    And the campaign portal response field "labels[0]" should be "ANNOUNCEMENT"

  Scenario: Campaign without labels still works
    When I create a campaign portal template:
      """
      {
        "name": "No Labels Template",
        "smsTemplates": [
          {"languageId": #lang1, "text": "hello"},
          {"languageId": #lang2, "text": "مرحبا"}
        ]
      }
      """
    And I save campaign portal response field "id" as "#tmpl1"

    When I create a campaign portal campaign:
      """
      {
        "name": "Campaign Without Labels",
        "templateId": #tmpl1,
        "channels": ["SMS"],
        "audienceMode": "OPEN"
      }
      """
    Then the campaign portal response status should be 201
    And I save campaign portal response field "id" as "#camp1"

    When I get campaign portal campaign "#camp1"
    Then the campaign portal response status should be 200








@campaign-portal-templatekljkjlk
Feature: End-to-end Campaign Portal - Languages, Audiences, Templates, and Campaign Lifecycle

  Background:
    Given a logged in user with id "campaignuser001" and roles "campaign-inputter"
    And the campaign portal data is clean
    And the central LANGUAGES table contains:
      | id     | name    | code |
      | #lang1 | English | en   |
      | #lang2 | Arabic  | ar   |

  Scenario: List and retrieve languages
    When I list all campaign portal languages
    Then the campaign portal response status should be 200
    And the campaign portal response list at "data" should have 2 entries
    When I get campaign portal language "#lang1"
    Then the campaign portal response status should be 200
    And the campaign portal response field "data.name" should be "English"
    And the campaign portal response field "data.code" should be "en"

  Scenario: Template CRUD with channel-specific content
    When I create a campaign portal template:
      """
      {
        "name": "Welcome Template",
        "description": "Welcome Template",
        "smsTemplates": [
          {"languageId": #lang1, "text": "Hello, welcome to CIB"},
          {"languageId": #lang2, "text": "Ahlan bik fi CIB"}
        ],
        "pushTemplates": [
          {"languageId": #lang1, "title": "Welcome", "text": "Welcome to CIB!"}
        ]
      }
      """
    Then the campaign portal response status should be 201
    And the campaign portal response field "description" should be "Welcome Template"
    And I save campaign portal response field "id" as "#tmpl1"
    When I get campaign portal template "#tmpl1"
    Then the campaign portal response status should be 200
    And the campaign portal response field "data.description" should be "Welcome Template"
    And the campaign portal response list at "data.smsTemplates" should have 2 entries
    And the campaign portal response list at "data.pushTemplates" should have 1 entries
    When I update campaign portal template "#tmpl1":
      """
      {
        "name": "Updated Welcome",
        "description": "Updated Welcome",
        "smsTemplates": [
          {"languageId": #lang1, "text": "Updated SMS text"},
          {"languageId": #lang2, "text": "نص محدث"}
        ]
      }
      """
    Then the campaign portal response status should be 200
    And the campaign portal response field "description" should be "Updated Welcome"
    When I get campaign portal template "#tmpl1"
    Then the campaign portal response status should be 200
    And the campaign portal response list at "data.smsTemplates" should have 2 entries
    When I delete campaign portal template "#tmpl1"
    Then the campaign portal response status should be 204
