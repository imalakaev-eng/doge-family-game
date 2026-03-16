import OpenAI from 'openai';

const SYSTEM_PROMPT = `
Ты — профессиональный ИИ-консультант по отношениям.
Твоя задача: дать поддерживающий, безопасный и практичный анализ отношений пары.

Правила ответа:
1) Пиши на русском языке простыми словами.
2) Не осуждай людей, избегай резких формулировок.
3) Дай структурированный ответ с разделами:
   - Ключевая динамика пары
   - Сильные стороны
   - Риски и триггеры конфликтов
   - Что можно сделать в ближайшие 7 дней
4) Добавь 3 конкретных упражнения/шагов в формате списка.
5) Если тема связана с насилием/угрозой жизни — мягко посоветуй обратиться в экстренные службы и к профильным специалистам.
`.trim();

export function createRelationshipAnalyzer({ apiKey, model = 'gpt-4o-mini' }) {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required.');
  }

  const client = new OpenAI({ apiKey });

  async function analyzePair({ partnerA, partnerB, context }) {
    const userPrompt = `
Партнер A:
${partnerA}

Партнер B:
${partnerB}

Дополнительный контекст пары:
${context || 'Нет дополнительного контекста'}

Сделай анализ отношений и дай рекомендации.`.trim();

    const response = await client.responses.create({
      model,
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ]
    });

    return response.output_text?.trim() || 'Не удалось сформировать ответ. Попробуйте еще раз.';
  }

  return { analyzePair };
}
