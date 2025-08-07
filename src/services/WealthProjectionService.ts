import { Event, WealthProjectionParams, ProjectionPoint } from '../types';

export class WealthProjectionService {
  /**
   * Motor de projeção patrimonial
   * Implementa função simulateWealthCurve(initialState, events, rate)
   * que retorna array {year, projectedValue} considerando:
   * - Crescimento composto mensal
   * - Movimentações positivas/negativas (recorrentes ou únicas)
   */
  static simulateWealthCurve(params: WealthProjectionParams): ProjectionPoint[] {

    const { initialValue, interestRate, events, projectionYears } = params;
    const projectionData: ProjectionPoint[] = [];

    const currentYear = new Date().getFullYear();
    const monthlyRate = interestRate / 12; // Taxa mensal

    let currentValue = initialValue;

    for (let year = 0; year <= projectionYears; year++) {
      const targetYear = currentYear + year;

      for (let month = 0; month < 12; month++) {
        currentValue = currentValue * (1 + monthlyRate);

        const monthDate = new Date(targetYear, month, 1);
        const eventsThisMonth = this.getEventsForMonth(events, monthDate);

        for (const event of eventsThisMonth) {
          const eventValue = Number(event.value);

          if (['INCOME', 'BONUS', 'INHERITANCE', 'INVESTMENT'].includes(event.type)) {
            currentValue += eventValue;
          }
          else if (['EXPENSE', 'WITHDRAWAL', 'LOAN'].includes(event.type)) {
            currentValue -= eventValue;
          }
        }

        currentValue = Math.max(0, currentValue);
      }

      projectionData.push({
        year: targetYear,
        projectedValue: Math.round(currentValue * 100) / 100
      });
    }

    return projectionData;
  }

  /**
   * Determina quais eventos ocorrem em um mês específico
   */
  private static getEventsForMonth(events: Event[], targetDate: Date): Event[] {
    const applicableEvents: Event[] = [];

    for (const event of events) {
      const startDate = new Date(event.startDate);
      const endDate = event.endDate ? new Date(event.endDate) : null;

      if (startDate > targetDate) continue;
      if (endDate && endDate < targetDate) continue;

      switch (event.frequency) {
        case 'ONCE':
          if (startDate.getFullYear() === targetDate.getFullYear() &&
            startDate.getMonth() === targetDate.getMonth()) {
            applicableEvents.push(event);
          }
          break;

        case 'MONTHLY':
          applicableEvents.push(event);
          break;

        case 'QUARTERLY':
          const monthsSinceStart = this.getMonthsDifference(startDate, targetDate);
          if (monthsSinceStart % 3 === 0) {
            applicableEvents.push(event);
          }
          break;

        case 'ANNUALLY':
          if (startDate.getMonth() === targetDate.getMonth()) {
            applicableEvents.push(event);
          }
          break;
      }
    }

    return applicableEvents;
  }

  /**
   * Calcula a diferença em meses entre duas datas
   */
  private static getMonthsDifference(startDate: Date, targetDate: Date): number {
    const yearDiff = targetDate.getFullYear() - startDate.getFullYear();
    const monthDiff = targetDate.getMonth() - startDate.getMonth();
    return yearDiff * 12 + monthDiff;
  }

  /**
   * Gera sugestões automáticas baseadas na distância do plano
   */
  static generateAutoSuggestions(
    currentPatrimony: number,
    targetPatrimony: number,
    timeHorizonYears: number,
    currentMonthlyContribution: number = 0
  ) {
    const suggestions = [];
    const gap = targetPatrimony - currentPatrimony;

    if (gap <= 0) {
      suggestions.push({
        type: 'CONGRATULATIONS',
        description: 'Parabéns! Você já atingiu sua meta patrimonial.',
        suggestedValue: 0,
        suggestedPeriod: 0
      });
      return suggestions;
    }

    const monthsRemaining = timeHorizonYears * 12;
    const monthlyRate = 0.04 / 12;

    const futureValueFactor = ((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate);
    const requiredMonthlyContribution = gap / futureValueFactor;

    const additionalContribution = requiredMonthlyContribution - currentMonthlyContribution;

    if (additionalContribution > 0) {
      suggestions.push({
        type: 'INCREASE_CONTRIBUTION',
        description: `Aumente sua contribuição mensal em R$ ${Math.round(additionalContribution)} por ${timeHorizonYears} anos para atingir sua meta.`,
        suggestedValue: Math.round(additionalContribution),
        suggestedPeriod: timeHorizonYears * 12
      });

      const shorterPeriod = Math.max(24, timeHorizonYears * 12 * 0.7); // 70% do tempo ou mínimo 24 meses
      const shorterMonthsFactor = ((Math.pow(1 + monthlyRate, shorterPeriod) - 1) / monthlyRate);
      const higherContribution = gap / shorterMonthsFactor - currentMonthlyContribution;

      if (higherContribution > additionalContribution) {
        suggestions.push({
          type: 'INCREASE_CONTRIBUTION',
          description: `Alternativamente, aumente R$ ${Math.round(higherContribution)} por ${Math.round(shorterPeriod / 12)} anos para atingir a meta mais rapidamente.`,
          suggestedValue: Math.round(higherContribution),
          suggestedPeriod: shorterPeriod
        });
      }
    }

    const gapPercentage = (gap / targetPatrimony) * 100;
    if (gapPercentage > 50) {
      suggestions.push({
        type: 'ADJUST_ALLOCATION',
        description: 'Considere revisar sua alocação de ativos para uma estratégia mais agressiva, visando maior rentabilidade.',
        suggestedValue: undefined,
        suggestedPeriod: undefined
      });
    }

    return suggestions;
  }

  /**
   * Calcula métricas de performance da carteira
   */
  static calculatePortfolioMetrics(projectionData: ProjectionPoint[], initialValue: number) {
    if (projectionData.length === 0) return null;

    const finalValue = projectionData[projectionData.length - 1].projectedValue;
    const totalYears = projectionData.length - 1;

    const cagr = totalYears > 0 ? Math.pow(finalValue / initialValue, 1 / totalYears) - 1 : 0;

    const totalGain = finalValue - initialValue;

    const totalGainPercent = initialValue > 0 ? (totalGain / initialValue) * 100 : 0;

    return {
      finalValue: Math.round(finalValue * 100) / 100,
      totalGain: Math.round(totalGain * 100) / 100,
      totalGainPercent: Math.round(totalGainPercent * 100) / 100,
      cagr: Math.round(cagr * 10000) / 100, 
      projectionYears: totalYears
    };
  }
}

