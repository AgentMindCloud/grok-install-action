import type { Issue, Severity } from './types.js';
import type { LoadedYaml } from './yaml-lines.js';

export interface RuleContext {
  manifest: LoadedYaml;
  capabilities: LoadedYaml;
  manifestPath: string;
  capabilitiesPath: string;
}

export interface Rule {
  id: string;
  severity: Severity;
  run(ctx: RuleContext): Issue[];
}

const ALLOWED_PLATFORMS = ['x', 'grok-cli', 'grokagents.dev'] as const;

const PROFILE_CAPS: Record<string, number> = {
  standard: 60,
  verified: 300,
  custom: Infinity,
};

export const RULES: Rule[] = [
  {
    id: 'grokinstall.platform-enum',
    severity: 'error',
    run(ctx) {
      const hit = ctx.manifest.at<string>(['runtime', 'platform']);
      if (!hit) return [];
      if ((ALLOWED_PLATFORMS as readonly string[]).includes(hit.value)) return [];
      return [
        {
          ruleId: 'grokinstall.platform-enum',
          severity: 'error',
          file: ctx.manifestPath,
          line: hit.line,
          message: `runtime.platform must be one of 'x', 'grok-cli', 'grokagents.dev'. Got '${hit.value}'.`,
        },
      ];
    },
  },
  {
    id: 'grokinstall.rate-limit-exceeds-profile',
    severity: 'error',
    run(ctx) {
      const profileHit = ctx.capabilities.at<string>(['profile']);
      const profile = profileHit?.value ?? 'standard';
      const cap = PROFILE_CAPS[profile] ?? Infinity;
      const rateHit = ctx.capabilities.at<number>(['rate', 'max_replies_per_hour']);
      if (!rateHit) return [];
      if (rateHit.value <= cap) return [];
      return [
        {
          ruleId: 'grokinstall.rate-limit-exceeds-profile',
          severity: 'error',
          file: ctx.capabilitiesPath,
          line: rateHit.line,
          message: `max_replies_per_hour=${rateHit.value} exceeds the '${profile}' profile cap of ${cap}/hour. Lower the value or switch to a custom profile.`,
        },
      ];
    },
  },
  {
    id: 'grokinstall.manifest-schema',
    severity: 'error',
    run(ctx) {
      const required = ['name', 'version', 'runtime'] as const;
      const issues: Issue[] = [];
      for (const key of required) {
        if (ctx.manifest.at([key]) === undefined) {
          issues.push({
            ruleId: 'grokinstall.manifest-schema',
            severity: 'error',
            file: ctx.manifestPath,
            line: 1,
            message: `manifest is missing required field '${key}'.`,
          });
        }
      }
      return issues;
    },
  },
  {
    id: 'grokinstall.capabilities-schema',
    severity: 'error',
    run(ctx) {
      const issues: Issue[] = [];
      if (ctx.capabilities.at(['profile']) === undefined) {
        issues.push({
          ruleId: 'grokinstall.capabilities-schema',
          severity: 'error',
          file: ctx.capabilitiesPath,
          line: 1,
          message: `capabilities is missing required field 'profile'.`,
        });
      }
      return issues;
    },
  },
  {
    id: 'grokinstall.version-pin',
    severity: 'warning',
    run(ctx) {
      const hit = ctx.manifest.at<string>(['version']);
      if (!hit || typeof hit.value !== 'string') return [];
      if (/^\d+\.\d+\.\d+$/.test(hit.value)) return [];
      return [
        {
          ruleId: 'grokinstall.version-pin',
          severity: 'warning',
          file: ctx.manifestPath,
          line: hit.line,
          message: `version '${hit.value}' should be pinned to a semver triple like '1.0.0'.`,
        },
      ];
    },
  },
  {
    id: 'grokinstall.description-length',
    severity: 'info',
    run(ctx) {
      const hit = ctx.manifest.at<string>(['description']);
      if (!hit || typeof hit.value !== 'string') return [];
      if (hit.value.length >= 20) return [];
      return [
        {
          ruleId: 'grokinstall.description-length',
          severity: 'info',
          file: ctx.manifestPath,
          line: hit.line,
          message: `description is shorter than 20 characters; consider expanding for marketplace clarity.`,
        },
      ];
    },
  },
];
