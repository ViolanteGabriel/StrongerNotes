import { describe, it, expect } from 'vitest';
import { buildProgressData } from './exercises.service.js';

// buildProgressData é uma função PURA: recebe dados e devolve dados, sem tocar no banco. Por isso testamos ela DIRETAMENTE, sem mock nenhum, é o tipo mais limpo e elegante de teste de unidade.
const dateMap = new Map([['s1', new Date('2024-01-01T10:00:00Z')]]);

describe('buildProgressData', () => {
  it('calcula o ponto de progresso para FORÇA (escolhe o de maior 1RM estimado)', () => {
    const sets = [
      { session: 's1', weightKg: 100, reps: 5 },
      { session: 's1', weightKg: 80, reps: 10 },
    ];
    const result = buildProgressData({ category: 'strength' }, sets as never, dateMap);
    expect(result).toHaveLength(1);
    // 100kg x 5 reps tem 1RM estimado maior que 80kg x 10 reps
    expect(result[0]).toMatchObject({ maxWeight: 100, reps: 5 });
  });

  it('trata valores nulos em FORÇA (peso/reps ausentes viram 0; reps=1 usa o próprio peso)', () => {
    // peso e reps nulos exercitam os "?? 0" / "?? 1" e o ramo "reps === 1"
    const sets = [{ session: 's1', weightKg: null, reps: null }];
    const result = buildProgressData({ category: 'strength' }, sets as never, dateMap);
    expect(result[0]).toMatchObject({ maxWeight: 0, reps: 0 });
  });

  it('calcula o ponto de progresso para CARDIO (usa a maior duração)', () => {
    const sets = [
      { session: 's1', durationSecs: 600, restSecs: 60 },
      { session: 's1', durationSecs: 300, restSecs: 30 },
    ];
    const result = buildProgressData({ category: 'cardio' }, sets as never, dateMap);
    expect(result[0]).toMatchObject({ maxDuration: 600, restSecs: 60 });
  });

  it('trata valores nulos em CARDIO (duração/descanso ausentes)', () => {
    const sets = [{ session: 's1', durationSecs: null, restSecs: null }];
    const result = buildProgressData({ category: 'cardio' }, sets as never, dateMap);
    expect(result[0]).toMatchObject({ maxDuration: 0, restSecs: null });
  });

  it('ignora séries cuja sessão não tem data conhecida', () => {
    const sets = [{ session: 'desconhecida', weightKg: 50, reps: 5 }];
    const result = buildProgressData({ category: 'strength' }, sets as never, dateMap);
    expect(result).toHaveLength(0); // o "if (!date) continue" pula essa série
  });
});
