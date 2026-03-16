import 'dotenv/config';
import { Telegraf, session } from 'telegraf';
import { createRelationshipAnalyzer } from './relationshipAnalyzer.js';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const openAiApiKey = process.env.OPENAI_API_KEY;
const openAiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!botToken) {
  throw new Error('TELEGRAM_BOT_TOKEN is required. Add it to .env');
}

const analyzer = createRelationshipAnalyzer({
  apiKey: openAiApiKey,
  model: openAiModel
});

const bot = new Telegraf(botToken);
bot.use(session());

function resetState(ctx) {
  ctx.session = {
    step: 'await_partner_a',
    partnerA: '',
    partnerB: '',
    context: ''
  };
}

bot.start((ctx) => {
  resetState(ctx);
  return ctx.reply(
    'Привет! Я бот для ИИ-анализа отношений пары.\n\n' +
      'Я задам 3 шага:\n' +
      '1) Описание партнера A\n' +
      '2) Описание партнера B\n' +
      '3) Контекст отношений\n\n' +
      'Напиши описание партнера A.'
  );
});

bot.command('reset', (ctx) => {
  resetState(ctx);
  return ctx.reply('Сбросил данные. Напиши описание партнера A.');
});

bot.on('text', async (ctx) => {
  if (!ctx.session?.step) {
    resetState(ctx);
  }

  const text = ctx.message.text.trim();

  if (ctx.session.step === 'await_partner_a') {
    ctx.session.partnerA = text;
    ctx.session.step = 'await_partner_b';
    return ctx.reply('Отлично. Теперь напиши описание партнера B.');
  }

  if (ctx.session.step === 'await_partner_b') {
    ctx.session.partnerB = text;
    ctx.session.step = 'await_context';
    return ctx.reply('Хорошо. Добавь контекст отношений (конфликты, цели, сложности).');
  }

  if (ctx.session.step === 'await_context') {
    ctx.session.context = text;
    ctx.session.step = 'processing';

    await ctx.reply('Анализирую вашу ситуацию... ⏳');

    try {
      const analysis = await analyzer.analyzePair({
        partnerA: ctx.session.partnerA,
        partnerB: ctx.session.partnerB,
        context: ctx.session.context
      });

      await ctx.reply(analysis);
      resetState(ctx);
      await ctx.reply('Если хочешь новый анализ — отправь описание партнера A.');
    } catch (error) {
      console.error('Analysis error:', error);
      resetState(ctx);
      await ctx.reply('Не получилось выполнить анализ. Попробуйте позже или команду /reset.');
    }
  }
});

bot.launch();
console.log('Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
