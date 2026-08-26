export interface ValidationError {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  entityId?: string;
  entityType?: 'road' | 'node' | 'lane' | 'sidewalk' | 'marking';
}

export class ValidationReport {
  public errors: ValidationError[] = [];
  public checksPassed: string[] = [];

  addError(error: ValidationError): void {
    this.errors.push(error);
  }

  addCheckPassed(checkName: string): void {
    this.checksPassed.push(checkName);
  }

  get isValid(): boolean {
    return !this.errors.some((e) => e.severity === 'error');
  }

  get errorCount(): number {
    return this.errors.filter((e) => e.severity === 'error').length;
  }

  get warningCount(): number {
    return this.errors.filter((e) => e.severity === 'warning').length;
  }

  formatSummary(): string {
    const lines: string[] = [
      '================ WORLD VALIDATION REPORT ================',
      this.isValid ? ' STATUS: VALID ✓' : ' STATUS: INVALID ✗',
      ` Checks Passed: ${this.checksPassed.length}`,
      ` Errors: ${this.errorCount}`,
      ` Warnings: ${this.warningCount}`,
    ];

    if (this.checksPassed.length > 0) {
      lines.push('\nPassed checks:');
      for (const ch of this.checksPassed) {
        lines.push(`  ✓ ${ch}`);
      }
    }

    if (this.errors.length > 0) {
      lines.push('\nIssues found:');
      for (const err of this.errors) {
        const tag = err.severity === 'error' ? '✗ [ERROR]' : '⚠ [WARNING]';
        const entity = err.entityId ? ` (${err.entityType || 'entity'}: ${err.entityId})` : '';
        lines.push(`  ${tag} [${err.code}] ${err.message}${entity}`);
      }
    }

    lines.push('=========================================================');
    return lines.join('\n');
  }
}
