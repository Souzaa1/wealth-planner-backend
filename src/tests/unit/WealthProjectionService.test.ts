import { Decimal } from '@prisma/client/runtime/library';
import { WealthProjectionService } from '../../services/WealthProjectionService';
import { Event } from '../../types';

describe('WealthProjectionService', () => {
  describe('simulateWealthCurve', () => {
    it('should calculate simple compound growth without events', () => {
      const params = {
        initialValue: 100000,
        interestRate: 0.12, 
        events: [] as Event[],
        projectionYears: 1
      };

      const result = WealthProjectionService.simulateWealthCurve(params);
      
      expect(result).toHaveLength(2); 
      expect(result[0].projectedValue).toBe(100000);
      
      const expectedValue = 100000 * Math.pow(1 + 0.12/12, 12);
      expect(result[1].projectedValue).toBeCloseTo(expectedValue, 0);
    });

    it('should apply monthly income events correctly', () => {
      const monthlyIncomeEvent: Event = {
        id: 'test-1',
        clientId: 'client-1',
        type: 'INCOME',
        description: 'Salário mensal',
        value: new Decimal(5000),
        frequency: 'MONTHLY',
        startDate: new Date('2024-01-01'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        client: null as any
      };

      const params = {
        initialValue: 100000,
        interestRate: 0.04, 
        events: [monthlyIncomeEvent],
        projectionYears: 1
      };

      const result = WealthProjectionService.simulateWealthCurve(params);
      
      const finalValue = result[result.length - 1].projectedValue;
      expect(finalValue).toBeGreaterThan(100000 + 12 * 5000); // Pelo menos o valor sem juros
    });

    it('should apply one-time events only once', () => {
      const oneTimeEvent: Event = {
        id: 'test-2',
        clientId: 'client-1',
        type: 'BONUS',
        description: 'Bônus único',
        value: new Decimal(50000),
        frequency: 'ONCE',
        startDate: new Date('2024-06-01'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        client: null as any
      };

      const params = {
        initialValue: 100000,
        interestRate: 0.04,
        events: [oneTimeEvent],
        projectionYears: 2
      };

      const result = WealthProjectionService.simulateWealthCurve(params);
      
      const finalValue = result[result.length - 1].projectedValue;
      expect(finalValue).toBeGreaterThan(100000 + 50000);
    });

    it('should handle negative events (expenses)', () => {
      const expenseEvent: Event = {
        id: 'test-3',
        clientId: 'client-1',
        type: 'EXPENSE',
        description: 'Gasto mensal',
        value: new Decimal(3000),
        frequency: 'MONTHLY',
        startDate: new Date('2024-01-01'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        client: null as any
      };

      const params = {
        initialValue: 100000,
        interestRate: 0.04,
        events: [expenseEvent],
        projectionYears: 1
      };

      const result = WealthProjectionService.simulateWealthCurve(params);
      
      const finalValue = result[result.length - 1].projectedValue;
      expect(finalValue).toBeLessThan(100000);
    });

    it('should not allow negative values', () => {
      const largeExpenseEvent: Event = {
        id: 'test-4',
        clientId: 'client-1',
        type: 'EXPENSE',
        description: 'Gasto muito grande',
        value: new Decimal(200000),
        frequency: 'ONCE',
        startDate: new Date('2024-01-01'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        client: null as any
      };

      const params = {
        initialValue: 100000,
        interestRate: 0.04,
        events: [largeExpenseEvent],
        projectionYears: 1
      };

      const result = WealthProjectionService.simulateWealthCurve(params);
      
      result.forEach(point => {
        expect(point.projectedValue).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('generateAutoSuggestions', () => {
    it('should congratulate when target is already achieved', () => {
      const suggestions: { type: string }[] = WealthProjectionService.generateAutoSuggestions(
        1000000, 
        800000,  
        10,      
        5000     
      );

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].type).toBe('CONGRATULATIONS');
    });

    it('should suggest contribution increase when there is a gap', () => {
      const suggestions = WealthProjectionService.generateAutoSuggestions(
        500000,  
        1000000,  
        2000      
      );

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s: { type: string }) => s.type === 'INCREASE_CONTRIBUTION')).toBe(true);
    });

    it('should suggest allocation adjustment for large gaps', () => {
      const suggestions = WealthProjectionService.generateAutoSuggestions(
        200000,  
        1000000, 
        15,      
        1000     
      );

      expect(suggestions.some((s: { type: string }) => s.type === 'ADJUST_ALLOCATION')).toBe(true);
    });
  });

  describe('calculatePortfolioMetrics', () => {
    it('should calculate CAGR correctly', () => {
      const projectionData = [
        { year: 2024, projectedValue: 100000 },
        { year: 2025, projectedValue: 110000 },
        { year: 2026, projectedValue: 121000 }
      ];

      const metrics = WealthProjectionService.calculatePortfolioMetrics(projectionData, 100000);
      
      expect(metrics).not.toBeNull();
      expect(metrics!.finalValue).toBe(121000);
      expect(metrics!.totalGain).toBe(21000);
      expect(metrics!.totalGainPercent).toBe(21);
      expect(metrics!.projectionYears).toBe(2);
      expect(metrics!.cagr).toBeCloseTo(10, 0); 
    });

    it('should handle empty projection data', () => {
      const metrics = WealthProjectionService.calculatePortfolioMetrics([], 100000);
      expect(metrics).toBeNull();
    });
  });
});

