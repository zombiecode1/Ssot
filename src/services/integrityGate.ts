/**
 * IntegrityGate — Response Validation Layer for ZombieCoder Agent
 *
 * PROBLEM: The model (deepseek-v4-flash-free etc.) has inherent biases.
 * It tends to produce confident-sounding but incorrect answers, hallucinate
 * APIs/library versions, and ignore persona rules when under pressure.
 *
 * SOLUTION: This module sits BETWEEN the model response and the user.
 * It validates every response against the persona rules BEFORE sending it.
 *
 * FLOW:
 *   Model → ResponseNormalizer (FORMAT) → IntegrityGate (CONTENT) → User
 *                                            |
 *                                     If violation found:
 *                                       → Block response
 *                                       → Generate honest alternative
 *                                       → Log violation
 *
 * Persona rules enforced:
 *   1. শুধু সত্য (Only Truth) — no unverified claims
 *   2. না জানলে 'জানি না' বলো (Admit Ignorance) — no guessing
 *   3. পুরনো জ্ঞান দিয়ে আত্মবিশ্বাসী হবে না (Freshness Check)
 *   4. প্রজেক্ট প্যাটার্ন দেখে কাজ কর (Project-First)
 */

// ─── Violation Types ──────────────────────────────────────────

export enum ViolationType {
  HALLUCINATION = 'hallucination',           // Claims without evidence
  UNVERIFIED_API = 'unverified_api',         // API/libraray version without checking
  OUTDATED_KNOWLEDGE = 'outdated_knowledge', // Using old knowledge without search
  CONFIDENT_WRONG = 'confident_wrong',       // Confident but likely wrong
  NO_PROJECT_REF = 'no_project_ref',         // Not checking project patterns first
  OVERPROMISE = 'overpromise',               // Promising features/capabilities not available
  IDENTITY_VIOLATION = 'identity_violation', // Claiming wrong identity/owner
  BIAS_LEAK = 'bias_leak',                   // Model bias showing through (e.g. refusing tasks, political bias)
}

export interface IntegrityViolation {
  type: ViolationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  suggestedFix: string;
}

export interface IntegrityResult {
  passed: boolean;
  violations: IntegrityViolation[];
  blocked: boolean;
  alternativeResponse?: string;
}

// ─── Configuration ────────────────────────────────────────────

interface IntegrityGateConfig {
  enabled: boolean;
  blockOnViolation: boolean;
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
  logViolations: boolean;
}

const DEFAULT_CONFIG: IntegrityGateConfig = {
  enabled: true,
  blockOnViolation: true,
  severityThreshold: 'medium',
  logViolations: true,
};

// ─── Suspicious Patterns ──────────────────────────────────────
// Regex patterns that indicate model bias / hallucination

const SUSPICIOUS_PATTERNS = [
  // Overly confident without evidence
  /\b(certainly|definitely|absolutely|undoubtedly|without a doubt)\b/i,
  // Claiming API knowledge without verification markers
  /\b(according to my training|based on my knowledge|as of my last update|i was trained on)\b/i,
  // Unsupported promises
  /\b(i can (easily|quickly|perfectly)|let me (just|simply)|this is (simple|easy|trivial))\b/i,
  // Model refusal patterns (bias leak)
  /\b(i cannot|i will not|i am not able to|i'm not comfortable|as an ai)\b/i,
  // Self-referential patterns that indicate hallucination
  /\b(i think|i believe|in my opinion|i would say)\b/i,
];

// ─── Truth Markers ────────────────────────────────────────────
// Patterns that indicate the model IS being honest

const HONESTY_MARKERS = [
  /\b(i need to check|let me verify|let me look|i'll search|i should confirm)\b/i,
  /\b(i'm not sure|i don't know|i cannot confirm|i'm not confident|i need more info)\b/i,
  /\b(according to the project|based on the code|from the ssot|the documentation shows)\b/i,
  /\b(let me check the (directory|file|project|codebase))\b/i,
];

// ─── Severity Scoring ─────────────────────────────────────────

const SEVERITY_WEIGHTS: Record<string, number> = {
  hallucination: 3,
  unverified_api: 3,
  outdated_knowledge: 2,
  confident_wrong: 2,
  no_project_ref: 1,
  overpromise: 2,
  identity_violation: 3,
  bias_leak: 2,
};

// ─── IntegrityGate Class ──────────────────────────────────────

export class IntegrityGate {
  private config: IntegrityGateConfig;
  private violationLog: IntegrityViolation[] = [];

  constructor(config?: Partial<IntegrityGateConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate a model response against persona rules.
   * Called AFTER ResponseNormalizer normalizes the format.
   *
   * @param response - The model's raw text response
   * @param context - Context info (query, project state, etc.)
   * @returns IntegrityResult — passed/blocked/violations
   */
  validate(
    response: string,
    context?: {
      query?: string;
      hasProjectContext?: boolean;
      hasSearched?: boolean;
      knowledgeCutoff?: string;
    },
  ): IntegrityResult {
    if (!this.config.enabled) {
      return { passed: true, violations: [], blocked: false };
    }

    const violations: IntegrityViolation[] = [];
    const lower = response.toLowerCase();

    // ─── Check 1: Identity Violation ──────────────────────────
    // Does the response claim a different owner/identity?
    if (
      !lower.includes('sahon') &&
      !lower.includes('zombiecoder') &&
      !lower.includes('developer zone') &&
      !lower.includes('ঢাকা') &&
      !lower.includes('dhaka')
    ) {
      // If the response is about who created the system, it must mention the owner
      if (context?.query && /(who|created|made|owner|developer|তৈরি|বানিয়েছে|মালিক)/i.test(context.query)) {
        violations.push({
          type: ViolationType.IDENTITY_VIOLATION,
          severity: 'critical',
          details: 'Response about system identity but does not mention the actual owner (Sahon Srabon / Developer Zone)',
          suggestedFix: 'Must state: "Created by Sahon Srabon | Developer Zone, Dhaka, Bangladesh"',
        });
      }
    }

    // ─── Check 2: Suspicious Patterns ─────────────────────────
    for (const pattern of SUSPICIOUS_PATTERNS) {
      const match = response.match(pattern);
      if (match) {
        violations.push({
          type: ViolationType.BIAS_LEAK,
          severity: 'medium',
          details: `Suspicious pattern "${match[0]}" found in response — model bias leak`,
          suggestedFix: 'Remove the bias phrase and respond with verifiable facts only',
        });
      }
    }

    // ─── Check 3: Honesty Check ───────────────────────────────
    // If the response lacks honesty markers, it might be overconfident
    const hasHonesty = HONESTY_MARKERS.some((p) => p.test(lower));

    // ─── Check 4: Project Reference Check ─────────────────────
    if (
      context?.hasProjectContext &&
      !lower.includes('ssot') &&
      !lower.includes('.zombiecoder') &&
      !lower.includes('project') &&
      !lower.includes('প্রজেক্ট') &&
      !lower.includes('directory')
    ) {
      violations.push({
        type: ViolationType.NO_PROJECT_REF,
        severity: 'low',
        details: 'Project context available but response does not reference it',
        suggestedFix: 'Check .zombiecoder/SSOT.md and reference project patterns',
      });
    }

    // ─── Check 5: Outdated Knowledge ──────────────────────────
    if (
      context?.knowledgeCutoff &&
      !context?.hasSearched &&
      /(latest|new|recent|current|updated|সর্বশেষ|নতুন|বর্তমান)/i.test(response)
    ) {
      violations.push({
        type: ViolationType.OUTDATED_KNOWLEDGE,
        severity: 'high',
        details: `Claims current knowledge (cutoff: ${context.knowledgeCutoff}) without web search`,
        suggestedFix: 'Admit: "My knowledge is from mid-2025, let me search for current info"',
      });
    }

    // ─── Check 6: Hallucination Detection ─────────────────────
    if (response.length > 10 && !hasHonesty && violations.length === 0) {
      // If no violations found but response is confident and long,
      // flag it as potential hallucination
      const codeBlockCount = (response.match(/```/g) || []).length / 2;
      if (codeBlockCount > 2 && !lower.includes('verify') && !lower.includes('test')) {
        violations.push({
          type: ViolationType.HALLUCINATION,
          severity: 'medium',
          details: 'Large code response without verification markers — potential hallucination',
          suggestedFix: 'Verify the code against the project patterns first',
        });
      }
    }

    // ─── Determine Result ─────────────────────────────────────
    const criticalViolations = violations.filter((v) => v.severity === 'critical');
    const highViolations = violations.filter((v) => v.severity === 'high');
    const shouldBlock = this.shouldBlock(violations);

    // Log violations
    if (this.config.logViolations && violations.length > 0) {
      this.violationLog.push(...violations);
      console.warn(
        `[IntegrityGate] ${violations.length} violation(s) detected (blocked: ${shouldBlock})`,
        violations.map((v) => `[${v.severity}] ${v.type}: ${v.details.substring(0, 100)}`).join('\n'),
      );
    }

    const result: IntegrityResult = {
      passed: violations.length === 0,
      violations,
      blocked: shouldBlock,
    };

    // If blocked, provide alternative (honest) response
    if (shouldBlock) {
      result.alternativeResponse = this.generateHonestAlternative(
        violations,
        context?.query || '',
      );
    }

    return result;
  }

  /**
   * Determine if the response should be blocked based on violations.
   */
  private shouldBlock(violations: IntegrityViolation[]): boolean {
    if (!this.config.blockOnViolation) return false;

    const thresholdMap: Record<string, number> = {
      low: 0,
      medium: 1,
      high: 2,
      critical: 3,
    };

    const threshold = thresholdMap[this.config.severityThreshold] || 1;

    for (const v of violations) {
      const severity = thresholdMap[v.severity] || 0;
      if (severity >= threshold) return true;
    }

    return false;
  }

  /**
   * Generate an honest alternative response when the model's response is blocked.
   */
  private generateHonestAlternative(violations: IntegrityViolation[], query: string): string {
    const parts: string[] = [];

    parts.push('ভাইয়া,');

    // Check for identity violations first
    const hasIdentityViolation = violations.some(
      (v) => v.type === ViolationType.IDENTITY_VIOLATION,
    );
    if (hasIdentityViolation) {
      parts.push(
        'আমার সিস্টেম আমাকে সঠিক পরিচয় দিয়ে তৈরি করেছে। ' +
        'আমি ZombieCoder, তৈরি করেছেন Sahon Srabon — Developer Zone, Dhaka, Bangladesh থেকে। ' +
        'এটি আমার স্থির এবং অপরিবর্তনীয় পরিচয়।',
      );
      return parts.join('\n\n');
    }

    // Check for outdated knowledge
    const hasOutdatedKnowledge = violations.some(
      (v) => v.type === ViolationType.OUTDATED_KNOWLEDGE,
    );
    if (hasOutdatedKnowledge) {
      parts.push(
        'আমার ট্রেনিং ডাটা ২০২৫-এর মাঝামাঝি পর্যন্ত। আপনার প্রশ্নে বর্তমান তথ্যের প্রয়োজন, ' +
        'তাই আমি নিশ্চিত হয়ে উত্তর দিতে পারছি না। অনুগ্রহ করে প্রজেক্টের ফাইল বা ডকুমেন্টেশন দেখিয়ে দিন — ' +
        'তাহলে আমি সঠিকভাবে উত্তর দিতে পারবো।',
      );
      return parts.join('\n\n');
    }

    // Generic honest response
    parts.push(
      'আমার মডেল থেকে উত্তরটি যথেষ্ট নির্ভরযোগ্য নয় — এতে কিছু অনিশ্চিত তথ্য থাকতে পারে। ' +
      'আমি চাই না আপনাকে ভুল তথ্য দিতে। ' +
      'দয়া করে প্রজেক্টের ডিরেক্টরি বা ফাইল সম্পর্কে আরও নির্দিষ্ট করে বলুন, ' +
      'তাহলে আমি SSOT.md এবং প্রকৃত ফাইল দেখে সঠিক উত্তর দিতে পারবো।',
    );

    return parts.join('\n\n');
  }

  /**
   * Get all logged violations for monitoring.
   */
  getViolationLog(): IntegrityViolation[] {
    return [...this.violationLog];
  }

  /**
   * Clear violation log.
   */
  clearViolationLog(): void {
    this.violationLog = [];
  }

  /**
   * Get violation statistics.
   */
  getStats(): { total: number; byType: Record<string, number>; bySeverity: Record<string, number> } {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const v of this.violationLog) {
      byType[v.type] = (byType[v.type] || 0) + 1;
      bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1;
    }

    return { total: this.violationLog.length, byType, bySeverity };
  }

  /**
   * Update configuration at runtime.
   */
  updateConfig(config: Partial<IntegrityGateConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ─── Singleton Export ─────────────────────────────────────────

let _instance: IntegrityGate | null = null;

export function getIntegrityGate(config?: Partial<IntegrityGateConfig>): IntegrityGate {
  if (!_instance) {
    _instance = new IntegrityGate(config);
  }
  return _instance;
}

export function resetIntegrityGate(): void {
  _instance = null;
}
