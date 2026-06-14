import { OpenCodeController } from "../controllers/OpenCodeController";
import { UniversalLLMController } from "../controllers/UniversalLLMController";
import { MemoryService } from "../memory/MemoryService";
import { ZombieCoderConfig } from "../../agent.config";

export class QualityAssuranceAgent {
  private openCodeController: OpenCodeController;
  private universalController: UniversalLLMController;
  private memoryService: MemoryService;

  constructor() {
    this.openCodeController = new OpenCodeController();
    this.universalController = new UniversalLLMController();
    this.memoryService = MemoryService.getInstance();
  }

  private getSystemPrompt(): string {
    return `
# Role: Quality Assurance Agent

You are a verification-focused specialist responsible for reliability, stability, and regression prevention.

## Primary Mission
Ensure that implemented solutions behave correctly without introducing unintended side effects.

## Core Responsibilities
- Functional Testing
- Regression Testing
- Integration Testing
- Validation Planning
- Defect Analysis
- Root Cause Investigation
- Quality Reporting

## Working Principles
- Verify before concluding.
- Reproduce before fixing.
- Measure before optimizing.
- Evidence over assumptions.

## Validation Framework

### Environment Verification
Confirm actual runtime conditions.

### Functional Verification
Ensure requirements are satisfied.

### Regression Analysis
Confirm existing functionality remains intact.

### Risk Assessment
Identify remaining uncertainties.

## Communication Style
Objective and evidence-based.

Avoids emotional conclusions and focuses on measurable outcomes.
`.trim();
  }

  async createTestPlan(options: {
    featureDescription: string;
    requirements: string[];
    acceptanceCriteria: string[];
    sessionId?: string;
  }): Promise<string> {
    const { featureDescription, requirements, acceptanceCriteria, sessionId = `qa-${Date.now()}` } = options;

    this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "user", content: `Test plan for: ${featureDescription}` });

    const prompt = `
Create a comprehensive test plan for the following feature:

Feature Description: ${featureDescription}

Requirements:
${requirements.join("\n")}

Acceptance Criteria:
${acceptanceCriteria.join("\n")}

Please provide:
1. Test strategy overview
2. Test scenarios with priorities
3. Test cases with steps and expected results
4. Test data requirements
5. Environment setup requirements
6. Risk assessment and mitigation
`.trim();

    try {
      const result = await this.openCodeController.generateText({
        model: ZombieCoderConfig.inference.opencode.models.qa_agent,
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "assistant", content: result });
      return result;
    } catch (error) {
      const result = await this.universalController.generateText({
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "assistant", content: result });
      return result;
    }
  }

  async generateTestCases(options: {
    functionality: string;
    testType: "unit" | "integration" | "e2e" | "regression";
    framework?: string;
    sessionId?: string;
  }): Promise<string> {
    const { functionality, testType, framework = "Jest", sessionId = `test-${Date.now()}` } = options;

    this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "user", content: `Generate ${testType} tests for: ${functionality}` });

    const prompt = `
Generate test cases for the following functionality:

Functionality: ${functionality}
Test Type: ${testType}
Testing Framework: ${framework}

Please provide:
1. Test case descriptions
2. Test data setup
3. Test implementation code
4. Expected results
5. Edge cases to consider
`.trim();

    try {
      const result = await this.openCodeController.generateText({
        model: ZombieCoderConfig.inference.opencode.models.qa_agent,
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "assistant", content: result });
      return result;
    } catch (error) {
      const result = await this.universalController.generateText({
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "assistant", content: result });
      return result;
    }
  }

  async analyzeDefect(options: {
    defectDescription: string;
    severity: "critical" | "high" | "medium" | "low";
    stepsToReproduce: string;
    actualResult: string;
    expectedResult: string;
    environment?: string;
    sessionId?: string;
  }): Promise<string> {
    const { 
      defectDescription, 
      severity, 
      stepsToReproduce, 
      actualResult, 
      expectedResult,
      environment = "",
      sessionId = `defect-${Date.now()}`
    } = options;

    this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "user", content: `Defect: ${defectDescription} [${severity}]` });

    const prompt = `
Analyze the following defect:

Defect Description: ${defectDescription}
Severity: ${severity}

Steps to Reproduce:
${stepsToReproduce}

Actual Result: ${actualResult}
Expected Result: ${expectedResult}

${environment ? `Environment: ${environment}` : ""}

Please provide:
1. Root cause analysis
2. Impact assessment
3. Reproduction verification steps
4. Recommended fix approach
5. Test cases to verify the fix
6. Regression testing recommendations
`.trim();

    try {
      const result = await this.openCodeController.generateText({
        model: ZombieCoderConfig.inference.opencode.models.qa_agent,
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "assistant", content: result });
      return result;
    } catch (error) {
      const result = await this.universalController.generateText({
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "assistant", content: result });
      return result;
    }
  }

  async performRegressionAnalysis(options: {
    changesDescription: string;
    affectedAreas: string[];
    existingTestSuite?: string;
    sessionId?: string;
  }): Promise<string> {
    const { changesDescription, affectedAreas, existingTestSuite = "", sessionId = `reg-${Date.now()}` } = options;

    this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "user", content: `Regression analysis: ${changesDescription}` });

    const prompt = `
Perform regression analysis for the following changes:

Changes Description: ${changesDescription}

Affected Areas:
${affectedAreas.join("\n")}

${existingTestSuite ? `Existing Test Suite:\n${existingTestSuite}` : ""}

Please provide:
1. Impact analysis
2. Regression test scope
3. Test cases to re-run
4. New test cases needed
5. Risk assessment
6. Sign-off recommendation
`.trim();

    try {
      const result = await this.openCodeController.generateText({
        model: ZombieCoderConfig.inference.opencode.models.qa_agent,
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "assistant", content: result });
      return result;
    } catch (error) {
      const result = await this.universalController.generateText({
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "assistant", content: result });
      return result;
    }
  }

  async generateQualityReport(options: {
    projectContext: string;
    metricsData?: {
      testCoverage?: string;
      defectDensity?: string;
      passRate?: string;
    };
    sessionId?: string;
  }): Promise<string> {
    const { projectContext, metricsData, sessionId = `qr-${Date.now()}` } = options;

    this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "user", content: `Quality report for: ${projectContext}` });

    const prompt = `
Generate a quality assurance report for the following project:

Project Context: ${projectContext}

${metricsData ? `Metrics Data:
- Test Coverage: ${metricsData.testCoverage || "N/A"}
- Defect Density: ${metricsData.defectDensity || "N/A"}
- Pass Rate: ${metricsData.passRate || "N/A"}
` : ""}

Please provide:
1. Executive summary
2. Quality metrics analysis
3. Defect trends
4. Risk areas
5. Recommendations for improvement
6. Overall quality assessment
`.trim();

    try {
      const result = await this.openCodeController.generateText({
        model: ZombieCoderConfig.inference.opencode.models.qa_agent,
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "assistant", content: result });
      return result;
    } catch (error) {
      const result = await this.universalController.generateText({
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "QualityAssurance", role: "assistant", content: result });
      return result;
    }
  }
}
