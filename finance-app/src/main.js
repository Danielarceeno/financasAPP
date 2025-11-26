import { v4 as uuidv4 } from 'uuid';
import Chart from 'chart.js/auto';
import { getCurrencyQuotes, getCryptoQuote } from './api.js';

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let myChart = null;

const form = document.getElementById('transaction-form');
const container = document.getElementById('transaction-container');
const tickerDiv = document.getElementById('ticker');
const btnConvert = document.getElementById('btn-convert');
const resultDisplay = document.getElementById('conv-result');

const dashboardTotalDisplay = document.getElementById('dashboard-total');
const historyTotalDisplay = document.getElementById('history-total');
async function init() {
  await updateTicker();
  renderTransactions();
  updateChart();
  updateTotalDisplay();
}

function saveToStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

async function updateTicker() {
  const currencies = await getCurrencyQuotes();
  const crypto = await getCryptoQuote();

  if (currencies && crypto) {
    tickerDiv.innerHTML = `
      🇺🇸 USD: R$ ${currencies.dolar.bid} | 
      🇪🇺 EUR: R$ ${currencies.euro.bid} | 
      ₿ BTC: R$ ${crypto.brl}
    `;
  } else {
    tickerDiv.innerHTML = 'Erro ao carregar cotações.';
  }
}

function updateTotalDisplay() {
  const total = transactions.reduce((acc, current) => {
    if (current.type === 'income') {
      return acc + current.amount;
    } else {
      return acc - current.amount;
    }
  }, 0);

  const formattedTotal = total.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  if (dashboardTotalDisplay) dashboardTotalDisplay.textContent = formattedTotal;
  if (historyTotalDisplay) historyTotalDisplay.textContent = formattedTotal;

  const color = total >= 0 ? 'var(--color-success)' : 'var(--color-error)';

  if (dashboardTotalDisplay) dashboardTotalDisplay.style.color = color;
  if (historyTotalDisplay) historyTotalDisplay.style.color = color;
}

function renderTransactions() {
  container.innerHTML = '';
  transactions.forEach((t) => {
    const div = document.createElement('div');
    div.className = 'transaction-item';

    const color =
      t.type === 'income' ? 'var(--color-success)' : 'var(--color-error)';
    const typeLabel = t.type === 'income' ? 'Entrada' : 'Saída';

    const amountFormatted = t.amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    div.innerHTML = `
      <span>${t.desc}</span>
      <span style="color: ${color}; font-weight: bold">${amountFormatted}</span>
      <span>${typeLabel}</span>
      <div class="actions-col">
        <button class="btn-edit" onclick="window.editTransaction('${t.id}')">✏️</button>
        <button class="btn-delete" onclick="window.removeTransaction('${t.id}')">🗑️</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function updateChart() {
  const ctx = document.getElementById('financeChart').getContext('2d');

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  if (myChart) {
    myChart.destroy();
  }

  myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Entradas', 'Saídas'],
      datasets: [
        {
          data: [income, expense],
          backgroundColor: ['#27ae60', '#ba1a1a'],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const descInput = document.getElementById('desc').value;
  const amountInput = parseFloat(document.getElementById('amount').value);
  const typeInput = document.getElementById('type').value;

  if (amountInput <= 0) {
    alert('Por favor, insira um valor maior que zero.');
    return;
  }

  const newTransaction = {
    id: uuidv4(),
    desc: descInput,
    amount: amountInput,
    type: typeInput,
  };

  transactions.push(newTransaction);
  saveToStorage();
  renderTransactions();
  updateChart();
  updateTotalDisplay();
  form.reset();
});

btnConvert.addEventListener('click', async () => {
  const amountBRL = parseFloat(document.getElementById('conv-amount').value);
  const targetCurrency = document.getElementById('conv-currency').value;

  if (!amountBRL) {
    alert('Digite um valor em R$!');
    return;
  }

  resultDisplay.innerText = 'Calculando...';

  try {
    let rate = 0;
    let symbol = '';

    const currencies = await getCurrencyQuotes();
    const crypto = await getCryptoQuote();

    if (targetCurrency === 'dolar') {
      rate = parseFloat(currencies.dolar.bid);
      symbol = 'US$';
      const final = amountBRL / rate;
      resultDisplay.innerText = `${symbol} ${final.toFixed(2)}`;
    } else if (targetCurrency === 'euro') {
      rate = parseFloat(currencies.euro.bid);
      symbol = '€';
      const final = amountBRL / rate;
      resultDisplay.innerText = `${symbol} ${final.toFixed(2)}`;
    } else if (targetCurrency === 'btc') {
      rate = crypto.brl;
      symbol = 'BTC';
      const final = amountBRL / rate;
      resultDisplay.innerText = `${symbol} ${final.toFixed(8)}`;
    }
  } catch (error) {
    console.error(error);
    resultDisplay.innerText = 'Erro na conversão';
  }
});

window.editTransaction = (id) => {
  const transaction = transactions.find((t) => t.id === id);

  if (transaction) {
    const newDesc = prompt('Edite a descrição:', transaction.desc);

    if (newDesc !== null && newDesc.trim() !== '') {
      transaction.desc = newDesc.trim();
      saveToStorage();
      renderTransactions();
    }
  }
};

window.removeTransaction = (id) => {
  if (confirm('Tem certeza que deseja excluir?')) {
    transactions = transactions.filter((t) => t.id !== id);
    saveToStorage();
    renderTransactions();
    updateChart();
    updateTotalDisplay();
  }
};

init();
