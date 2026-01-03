Telegram.WebApp.ready();

let points = 0;
let record = 0;
let level = 1;
let familySize = 1;
let referrals = 0;
let clan = null;
const API_URL = 'https://your-backend.vercel.app'; // Замени на свой, если есть

const riddles = [
  { question: "У отца 3 сына. Каждый сын имеет сестру. Сколько детей у отца?", answer: "4", hint: "Сестра общая для всех." },
  { question: "Что идет вверх и вниз, но остается на месте?", answer: "температура", hint: "Это связано с термометром." },
  { question: "Сколько месяцев имеют 28 дней?", answer: "12", hint: "Все месяцы имеют хотя бы 28 дней." },
  { question: "Что можно увидеть с закрытыми глазами?", answer: "сон", hint: "Это не реальность." },
  { question: "Что имеет шею, но нет головы?", answer: "бутылка", hint: "Из кухни." },
  { question: "Что всегда перед тобой, но ты не можешь его увидеть?", answer: "будущее", hint: "Время." },
  { question: "Что мокнет, когда сушит?", answer: "полотенце", hint: "Используется в ванной." },
  { question: "Какое слово начинается с 'е' и заканчивается 'е', но имеет только одну букву?", answer: "конверт", hint: "Для писем." },
  { question: "Что имеет кольцо, но нет пальца?", answer: "телефон", hint: "Звонит." },
  { question: "Что имеет голову и хвост, но нет тела?", answer: "монета", hint: "Деньги." },
  { question: "Что можно сломать, но не потрогать?", answer: "обещание", hint: "Слова." },
  { question: "Что имеет корни, которые никто не видит?", answer: "гора", hint: "Природа." },
  { question: "Что тяжелее: килограмм ваты или килограмм железа?", answer: "одинаково", hint: "Вес." },
  { question: "Что всегда возвращается, но никогда не уходит?", answer: "бумеранг", hint: "Игрушка." },
  { question: "Что имеет дно на вершине?", answer: "нога", hint: "Часть тела." },
  { question: "Что имеет уши, но не слышит?", answer: "кукуруза", hint: "Овощ." },
  { question: "Что светит, но не греет?", answer: "луна", hint: "Ночь." },
  { question: "Что растет вниз?", answer: "сосулька", hint: "Зима." },
  { question: "Что можно держать, но не потрогать?", answer: "дыхание", hint: "Воздух." },
  { question: "Что имеет города, но нет домов; леса, но нет деревьев; реки, но нет воды?", answer: "карта", hint: "Бумага." }
  // Добавь больше, если нужно
];

function loadGame() {
  const saved = localStorage.getItem('familyBrain');
  if (saved) {
    const data = JSON.parse(saved);
    points = data.points || 0;
    record = data.record || 0;
    level = data.level || 1;
    familySize = data.familySize || 1;
    referrals = data.referrals || 0;
    clan = data.clan || null;
  }
  updateUI();
  loadTasks();
}
loadGame();

function saveGame() {
  const data = { points, record, level, familySize, referrals, clan };
  localStorage.setItem('familyBrain', JSON.stringify(data));
}

function updateUI() {
  document.getElementById('points').textContent = points;
  document.getElementById('record').textContent = record;
  document.getElementById('level').textContent = level;
  document.getElementById('familySize').textContent = familySize;
}

function loadTasks() {
  const list = document.getElementById('task-list');
  list.innerHTML = '';
  riddles.slice(0, 10).forEach((riddle, index) => { // 10 заданий на старте
    const div = document.createElement('div');
    div.classList.add('task');
    div.innerHTML = `
      <p>${riddle.question}</p>
      <input type="text" placeholder="Ответ" data-index="${index}">
      <button onclick="checkAnswer(${index})">Проверить</button>
      <p class="result" id="result-${index}"></p>
      <button class="hint-btn">Подсказка</button>
    `;
    list.appendChild(div);
  });
}

function checkAnswer(index) {
  const input = document.querySelector(`input[data-index="${index}"]`);
  const result = document.getElementById(`result-${index}`);
  const answer = input.value.trim().toLowerCase();
  if (answer === riddles[index].answer.toLowerCase()) {
    points += 50;
    record = Math.max(record, points);
    result.textContent = 'Правильно! +50 очков 🎉';
    result.style.color = '#4caf50';
    // Конфетти анимация
    Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    levelUp();
  } else {
    result.textContent = 'Неправильно 😔';
    result.style.color = '#f44336';
  }
  saveGame();
  updateUI();
}

function levelUp() {
  if (points >= level * 200) level++;
}

document.querySelectorAll('.hint-btn').forEach((btn, index) => {
  btn.addEventListener('click', () => alert(riddles[index].hint));
});

// Табы, кланы, рефералка, лидерборд — как в предыдущем коде, адаптируй (убери майнинг, добавь очки в клан)

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab, .tab-content').forEach(el => el.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// ... остальной код для кланов и приглашений как раньше
