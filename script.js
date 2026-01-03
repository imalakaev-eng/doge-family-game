Telegram.WebApp.ready();
let balance = 0, level = 1, energy = 1000, maxEnergy = 1000, miningPower = 1, familySize = 1, referrals = 0;
let clan = null;
const API_URL = 'https://doge-family-empire-backend.vercel.app/api'; // Замени на свой!
const userId = Telegram.WebApp.initDataUnsafe.user?.id || Math.floor(Math.random()*1e9);
const boosts = { puppies: {level:1,cost:200}, family:{level:1,cost:800}, vacation:{level:0,cost:5000} };
const tasks = { tap:{goal:10000,progress:0,reward:5000,claimed:false}, invite:{goal:1,progress:0,reward:20000,claimed:false} };

function loadGame() {
  const saved = localStorage.getItem('dogeFamily');
  if (saved) Object.assign(this, JSON.parse(saved));
  familySize = 1 + referrals;
  updateAll();
}
loadGame();

function saveGame() { localStorage.setItem('dogeFamily', JSON.stringify(this)); }

function updateUI() {
  document.getElementById('balance').textContent = Math.floor(balance).toLocaleString();
  document.getElementById('level').textContent = level;
  document.getElementById('energy').textContent = Math.floor(energy);
  document.getElementById('maxEnergy').textContent = maxEnergy;
  document.getElementById('familySize').textContent = familySize;
  document.querySelectorAll('.boost-item').forEach(item => {
    const id = item.dataset.id; const b = boosts[id];
    item.querySelector('.lvl').textContent = b.level;
    item.querySelector('.cost').textContent = b.cost.toLocaleString();
  });
}

function updateTasks() {
  tasks.tap.progress = balance;
  tasks.invite.progress = referrals;
  ['tap','invite'].forEach(id => {
    const prog = document.querySelector(`.task[data-id="${id}"] .progress`);
    prog.textContent = `${Math.min(tasks[id].progress, tasks[id].goal)}/${tasks[id].goal}`;
    const btn = prog.nextElementSibling;
    if (!tasks[id].claimed && tasks[id].progress >= tasks[id].goal) {
      btn.disabled = false;
      btn.onclick = () => {
        balance += tasks[id].reward; tasks[id].claimed = true;
        btn.textContent = '✓'; btn.disabled = true;
        updateAll(); saveGame();
      };
    }
  });
}

async function updateLeaderboard() {
  try {
    const res = await fetch(`${API_URL}/leaderboard`);
    const clans = await res.json();
    const list = document.getElementById('top-list');
    list.innerHTML = '';
    clans.slice(0,10).forEach((c,i) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${i+1}. ${c.name}</strong> <span>${(c.score/1e6).toFixed(1)}м</span>`;
      list.appendChild(li);
    });
    document.getElementById('my-score').textContent = Math.floor(balance).toLocaleString();
    document.getElementById('my-rank').textContent = `#${Math.max(1,100-referrals*5)}`;
  } catch(e) { console.log('Leaderboard load error'); }
}

function updateClanUI() {
  const info = document.getElementById('clan-info');
  if (clan) info.textContent = `Клан: ${clan.name} (${clan.members} чел.)`;
  else info.textContent = 'Не в клане';
}

async function createClan() {
  const name = document.getElementById('clan-name').value || 'Моя семья';
  try {
    const res = await fetch(`${API_URL}/create-clan`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({userId, name})
    });
    const data = await res.json();
    if (data.success) {
      clan = {id: data.clanId, name, members:1};
      miningPower *= 1.1; // Бонус
      updateClanUI(); saveGame();
      Telegram.WebApp.showAlert('Клан создан! Код: ' + data.code);
    }
  } catch(e) { console.error(e); }
}

async function joinClan() {
  const code = document.getElementById('clan-code').value.toUpperCase();
  try {
    const res = await fetch(`${API_URL}/join-clan`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({userId, clanId: code})
    });
    const data = await res.json();
    if (data.success) {
      // Загрузи данные клана
      const clanRes = await fetch(`${API_URL}/clan/${code}`);
      clan = await clanRes.json();
      balance += 50000; // Бонус
      updateClanUI(); updateAll(); saveGame();
      Telegram.WebApp.showAlert('Вступил в клан!');
    } else {
      Telegram.WebApp.showAlert(data.error || 'Ошибка');
    }
  } catch(e) { console.error(e); }
}

async function updateClanScore(score) {
  if (clan) {
    try {
      await fetch(`${API_URL}/update-score`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({userId, score: Math.floor(score * 0.1)})
      });
    } catch(e) {}
  }
}

function updateAll() { updateUI(); updateTasks(); updateClanUI(); }

// Тап
document.getElementById('doge').addEventListener('click', (e) => {
  if (energy <= 0) return;
  energy -= 1;
  const gain = miningPower;
  balance += gain;
  updateClanScore(gain); // Клан!
  // Анимация
  const effect = document.getElementById('tap-effect');
  effect.textContent = `+${gain}`;
  effect.style.opacity = 1;
  setTimeout(() => { effect.style.opacity = 0; }, 600);
  updateAll(); saveGame();
});

// Восстановление энергии
setInterval(() => {
  if (energy < maxEnergy) {
    energy = Math.min(maxEnergy, energy + 5);
    document.getElementById('energy').textContent = Math.floor(energy);
  }
}, 1000);

// Лидерборд каждые 30с
setInterval(updateLeaderboard, 30000);
updateLeaderboard();

// Табы
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab, .tab-content').forEach(el => el.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Бусты
document.querySelectorAll('.boost-item button').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.boost-item');
    const id = item.dataset.id;
    const cost = boosts[id].cost;
    if (balance >= cost) {
      balance -= cost;
      boosts[id].level++;
      boosts[id].cost = Math.floor(cost * 1.8);
      if (id === 'puppies') miningPower += 2;
      if (id === 'family') maxEnergy += 800;
      if (id === 'vacation') miningPower *= 2; // Временный x2
      updateAll(); saveGame();
      Telegram.WebApp.HapticFeedback.impactOccurred('light');
    } else {
      Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
  });
});

// Кланы
document.getElementById('create-clan').onclick = createClan;
document.getElementById('join-clan').onclick = joinClan;

// Рефералка
document.getElementById('invite-btn').onclick = () => {
  referrals++;
  familySize++;
  balance += 20000;
  tasks.invite.progress++;
  updateAll(); saveGame();
  const url = `https://t.me/${Telegram.WebApp.initDataUnsafe.bot_username}?start=ref${userId}`;
  Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=🐶 Присоединяйся к DogeFamily Empire! 👨‍👩‍👧‍👦`);
};