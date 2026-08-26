import { describe, it, expect } from 'vitest';
import { TEST_SCENARIOS } from '../TestLabScenarios';
import { WorldValidator } from '../../validation/WorldValidator';

describe('Road Engine Test Lab Suite (10 Scenarios)', () => {
  for (const scenario of TEST_SCENARIOS) {
    it(`executes ${scenario.id}: ${scenario.name}`, () => {
      const engine = scenario.createEngine();
      expect(engine).toBeDefined();

      const report = WorldValidator.validate(engine.network);

      if (scenario.id === 'TEST-10') {
        // Le test 10 doit être invalide (détection intentionnelle d'erreurs)
        expect(report.isValid).toBe(false);
        expect(report.errorCount).toBeGreaterThan(0);
      } else {
        // Tous les tests 01 à 09 doivent être 100% valides
        expect(report.isValid).toBe(true);
        expect(report.errorCount).toBe(0);
      }
    });
  }
});
