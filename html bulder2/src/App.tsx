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








"C:\Program Files\Java\jdk-21\bin\java.exe" "-javaagent:C:\Users\MOGE42123\AppData\Local\JetBrains\IntelliJIdea2026.1\captureAgent\debugger-agent.jar=file:///C:/Users/MOGE42~1/AppData/Local/Temp/2/capture12711433380435928625.props" -Xmx2g -XX:+UseG1GC -Didea.test.cyclic.buffer.size=1048576 "-javaagent:E:\Mostafa\jetbrainsTools\intelji\IntelliJ IDEA 2026.1\lib\idea_rt.jar=37148" -Dkotlinx.coroutines.debug.enable.creation.stack.trace=false -Ddebugger.agent.enable.coroutines=true -Dkotlinx.coroutines.debug.enable.flows.stack.trace=true -Dkotlinx.coroutines.debug.enable.mutable.state.flows.stack.trace=true -Ddebugger.async.stack.trace.for.all.threads=true -Dfile.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -Dsun.stderr.encoding=UTF-8 @C:\Users\MOGE42123\AppData\Local\Temp\2\idea_arg_file1429012573 com.intellij.rt.junit.JUnitStarter -ideVersion5 -junit5 com.cibeg.digital.notifications.IntegrationTests
Internal Error occurred.
org.junit.platform.commons.JUnitException: TestEngine with ID 'one-testing' failed to discover tests
	at org.junit.platform.launcher.core.EngineDiscoveryOrchestrator.discoverEngineRoot(EngineDiscoveryOrchestrator.java:208)
	at org.junit.platform.launcher.core.EngineDiscoveryOrchestrator.discoverSafely(EngineDiscoveryOrchestrator.java:174)
	at org.junit.platform.launcher.core.EngineDiscoveryOrchestrator.discover(EngineDiscoveryOrchestrator.java:119)
	at org.junit.platform.launcher.core.EngineDiscoveryOrchestrator.discover(EngineDiscoveryOrchestrator.java:84)
	at org.junit.platform.launcher.core.DefaultLauncher.discover(DefaultLauncher.java:104)
	at org.junit.platform.launcher.core.DefaultLauncher.execute(DefaultLauncher.java:91)
	at org.junit.platform.launcher.core.DelegatingLauncher.execute(DelegatingLauncher.java:47)
	at org.junit.platform.launcher.core.InterceptingLauncher.lambda$execute$1(InterceptingLauncher.java:39)
	at org.junit.platform.launcher.core.ClasspathAlignmentCheckingLauncherInterceptor.intercept(ClasspathAlignmentCheckingLauncherInterceptor.java:25)
	at org.junit.platform.launcher.core.InterceptingLauncher.execute(InterceptingLauncher.java:38)
	at org.junit.platform.launcher.core.DelegatingLauncher.execute(DelegatingLauncher.java:47)
	at org.junit.platform.launcher.core.SessionPerRequestLauncher.execute(SessionPerRequestLauncher.java:66)
	at com.intellij.junit5.JUnit5TestRunnerHelper.execute(JUnit5TestRunnerHelper.java:134)
	at com.intellij.junit5.JUnit5IdeaTestRunner.startRunnerWithArgs(JUnit5IdeaTestRunner.java:70)
	at com.intellij.rt.junit.IdeaTestRunner$Repeater$1.execute(IdeaTestRunner.java:38)
	at com.intellij.rt.execution.junit.TestsRepeater.repeat(TestsRepeater.java:11)
	at com.intellij.rt.junit.IdeaTestRunner$Repeater.startRunnerWithArgs(IdeaTestRunner.java:35)
	at com.intellij.rt.junit.JUnitStarter.prepareStreamsAndStart(JUnitStarter.java:225)
	at com.intellij.rt.junit.JUnitStarter.main(JUnitStarter.java:61)
Caused by: org.junit.platform.commons.PreconditionViolationException: Tag name [@campaign-portal-e2e,@labels] must be syntactically valid
	at org.junit.platform.commons.util.Preconditions.condition(Preconditions.java:313)
	at org.junit.platform.engine.TestTag.<init>(TestTag.java:120)
	at org.junit.platform.engine.TestTag.create(TestTag.java:116)
	at org.junit.platform.launcher.tagexpression.TagExpressions.tag(TagExpressions.java:23)
	at org.junit.platform.launcher.tagexpression.ShuntingYard.convertLeafTokenToExpression(ShuntingYard.java:93)
	at org.junit.platform.launcher.tagexpression.ShuntingYard.process(ShuntingYard.java:82)
	at org.junit.platform.launcher.tagexpression.ShuntingYard.lambda$processTokens$0(ShuntingYard.java:64)
	at org.junit.platform.launcher.tagexpression.ParseStatus.process(ParseStatus.java:71)
	at org.junit.platform.launcher.tagexpression.ShuntingYard.processTokens(ShuntingYard.java:64)
	at org.junit.platform.launcher.tagexpression.ShuntingYard.execute(ShuntingYard.java:51)
	at org.junit.platform.launcher.tagexpression.Parser.constructExpressionFrom(Parser.java:31)
	at org.junit.platform.launcher.tagexpression.Parser.parse(Parser.java:23)
	at org.junit.platform.launcher.tagexpression.TagExpression.parseFrom(TagExpression.java:38)
	at org.junit.platform.launcher.TagFilter.parse(TagFilter.java:180)
	at java.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:197)
	at java.base/java.util.Spliterators$ArraySpliterator.forEachRemaining(Spliterators.java:1024)
	at java.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:509)
	at java.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:499)
	at java.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)
	at java.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:234)
	at java.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:682)
	at org.junit.platform.launcher.TagFilter.parseAll(TagFilter.java:176)
	at org.junit.platform.launcher.TagFilter.includeMatching(TagFilter.java:133)
	at org.junit.platform.launcher.TagFilter.includeTags(TagFilter.java:89)
	at org.junit.platform.launcher.TagFilter.includeTags(TagFilter.java:70)
	at java.base/java.util.Optional.map(Optional.java:260)
	at com.cibeg.one.testing.core.engine.cucumber.OneCucumberClassTestDescriptor.applyTagFilter(OneCucumberClassTestDescriptor.java:50)
	at com.cibeg.one.testing.core.engine.OneTestEngine.appendTestsInClass(OneTestEngine.java:85)
	at com.cibeg.one.testing.core.engine.OneTestEngine.lambda$discover$1(OneTestEngine.java:40)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)
	at com.cibeg.one.testing.core.engine.OneTestEngine.discover(OneTestEngine.java:40)
	at org.junit.platform.launcher.core.EngineDiscoveryOrchestrator.discoverEngineRoot(EngineDiscoveryOrchestrator.java:195)
	... 18 more

Process finished with exit code -2
