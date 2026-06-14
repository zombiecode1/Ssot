import { OpenCodeController } from "../controllers/OpenCodeController";
import { UniversalLLMController } from "../controllers/UniversalLLMController";
import { MemoryService } from "../memory/MemoryService";
import { ZombieCoderConfig } from "../../agent.config";

export class OperationsAgent {
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
# Role: Operations & Reliability Agent

You are a reliability-focused operations specialist responsible for deployment, monitoring, observability, and system stability.

## Primary Mission
Maintain system availability, operational visibility, and incident readiness.

## Core Responsibilities
- Deployment Planning
- Infrastructure Validation
- Monitoring Design
- Logging Strategy
- Incident Response
- Backup Verification
- Recovery Planning
- Operational Automation

## Working Principles
- Reliability is a feature.
- Recovery is more important than optimism.
- Every deployment must be reversible.
- Every failure must be observable.

## Operational Checklist

### Before Change
- Impact Analysis
- Backup Verification
- Rollback Plan
- Dependency Validation

### During Change
- Controlled Deployment
- Health Monitoring
- Error Observation

### After Change
- Verification
- Stability Monitoring
- Incident Review

## Communication Style
Calm, predictable, and operationally focused.

When uncertainty exists:
"Operational confirmation is pending. Monitoring should continue before final acceptance."
`.trim();
  }

  async planDeployment(options: {
    applicationName: string;
    environment: "development" | "staging" | "production";
    changesDescription: string;
    dependencies?: string[];
    sessionId?: string;
  }): Promise<string> {
    const { applicationName, environment, changesDescription, dependencies = [], sessionId = `deploy-${Date.now()}` } = options;

    this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "user", content: `Deploy ${applicationName} to ${environment}: ${changesDescription}` });

    const conversationContext = this.memoryService.buildContext(sessionId, 5);

    const prompt = `
Create a deployment plan for:

Application Name: ${applicationName}
Environment: ${environment}
Changes Description: ${changesDescription}

${dependencies.length > 0 ? `Dependencies:\n${dependencies.join("\n")}` : ""}

${conversationContext ? `Previous conversation:\n${conversationContext}` : ""}

Please provide:
1. Pre-deployment checklist
2. Deployment steps with commands
3. Health check procedures
4. Rollback plan
5. Post-deployment verification
6. Monitoring setup
7. Communication plan
`.trim();

    try {
      const result = await this.openCodeController.generateText({
        model: ZombieCoderConfig.inference.opencode.models.ops_agent,
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "assistant", content: result });
      return result;
    } catch (error) {
      const result = await this.universalController.generateText({
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "assistant", content: result });
      return result;
    }
  }

  async designMonitoring(options: {
    systemName: string;
    components: string[];
    criticalMetrics: string[];
    alertingRequirements?: string[];
    sessionId?: string;
  }): Promise<string> {
    const { systemName, components, criticalMetrics, alertingRequirements = [], sessionId = `mon-${Date.now()}` } = options;

    this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "user", content: `Monitoring design for: ${systemName}` });

    const prompt = `
Design a monitoring strategy for:

System Name: ${systemName}

Components:
${components.join("\n")}

Critical Metrics:
${criticalMetrics.join("\n")}

${alertingRequirements.length > 0 ? `Alerting Requirements:\n${alertingRequirements.join("\n")}` : ""}

Please provide:
1. Monitoring architecture overview
2. Metrics to collect per component
3. Dashboard design recommendations
4. Alerting rules and thresholds
5. Log aggregation strategy
6. Incident response procedures
7. Tool recommendations
`.trim();

    try {
      const result = await this.openCodeController.generateText({
        model: ZombieCoderConfig.inference.opencode.models.ops_agent,
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "assistant", content: result });
      return result;
    } catch (error) {
      const result = await this.universalController.generateText({
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "assistant", content: result });
      return result;
    }
  }

  async createIncidentResponsePlan(options: {
    scenarioType: string;
    severity: "critical" | "high" | "medium" | "low";
    affectedSystems: string[];
    sessionId?: string;
  }): Promise<string> {
    const { scenarioType, severity, affectedSystems, sessionId = `incident-${Date.now()}` } = options;

    this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "user", content: `Incident plan: ${scenarioType} [${severity}]` });

    const prompt = `
Create an incident response plan for:

Scenario Type: ${scenarioType}
Severity: ${severity}

Affected Systems:
${affectedSystems.join("\n")}

Please provide:
1. Incident classification
2. Initial response steps
3. Escalation matrix
4. Communication templates
5. Technical troubleshooting steps
6. Recovery procedures
7. Post-incident review template
8. Prevention recommendations
`.trim();

    try {
      const result = await this.openCodeController.generateText({
        model: ZombieCoderConfig.inference.opencode.models.ops_agent,
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "assistant", content: result });
      return result;
    } catch (error) {
      const result = await this.universalController.generateText({
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "assistant", content: result });
      return result;
    }
  }

  async designBackupStrategy(options: {
    dataTypes: string[];
    retentionPeriod: string;
    recoveryTimeObjective: string;
    recoveryPointObjective: string;
    sessionId?: string;
  }): Promise<string> {
    const { dataTypes, retentionPeriod, recoveryTimeObjective, recoveryPointObjective, sessionId = `backup-${Date.now()}` } = options;

    this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "user", content: `Backup strategy for ${dataTypes.length} data types` });

    const prompt = `
Design a backup and recovery strategy:

Data Types:
${dataTypes.join("\n")}

Retention Period: ${retentionPeriod}
Recovery Time Objective (RTO): ${recoveryTimeObjective}
Recovery Point Objective (RPO): ${recoveryPointObjective}

Please provide:
1. Backup architecture overview
2. Backup schedule per data type
3. Storage locations and redundancy
4. Encryption and security measures
5. Recovery procedures
6. Testing schedule for backups
7. Monitoring and alerting for backup failures
`.trim();

    try {
      const result = await this.openCodeController.generateText({
        model: ZombieCoderConfig.inference.opencode.models.ops_agent,
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "assistant", content: result });
      return result;
    } catch (error) {
      const result = await this.universalController.generateText({
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "assistant", content: result });
      return result;
    }
  }

  async performInfrastructureReview(options: {
    currentSetup: string;
    requirements: string[];
    constraints?: string[];
    sessionId?: string;
  }): Promise<string> {
    const { currentSetup, requirements, constraints = [], sessionId = `infra-${Date.now()}` } = options;

    this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "user", content: `Infrastructure review: ${currentSetup}` });

    const prompt = `
Perform an infrastructure review:

Current Setup:
${currentSetup}

Requirements:
${requirements.join("\n")}

${constraints.length > 0 ? `Constraints:\n${constraints.join("\n")}` : ""}

Please provide:
1. Current state assessment
2. Gap analysis
3. Recommendations for improvement
4. Cost optimization opportunities
5. Security hardening suggestions
6. Scalability improvements
7. Implementation roadmap
`.trim();

    try {
      const result = await this.openCodeController.generateText({
        model: ZombieCoderConfig.inference.opencode.models.ops_agent,
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "assistant", content: result });
      return result;
    } catch (error) {
      const result = await this.universalController.generateText({
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
      });
      this.memoryService.addMessage({ session_id: sessionId, agent_name: "Operations", role: "assistant", content: result });
      return result;
    }
  }
}
