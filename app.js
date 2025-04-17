// app.js

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let customerSuggestions = [];
let fileId = null;

const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'; // Replace with your Google client ID
const API_KEY = 'YOUR_GOOGLE_API_KEY'; // Replace with your API key
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive.file";

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(() => {
    document.getElementById('loginBtn').onclick = () => {
      gapi.auth2.getAuthInstance().signIn().then(() => {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        loadFromDrive();
      });
    }
  });
}

gapi.load('client:auth2', initClient);

function renderTransactions() {
  const entriesDiv = document.getElementById('entries');
  entriesDiv.innerHTML = '';
  transactions.forEach((t, index) => {
    const div = document.createElement('div');
    div.className = 'entry';
    div.innerHTML = `<b class="${t.type}">${t.type.toUpperCase()}</b>: ${t.name} - ${t.amount} 
      <button onclick="editTransaction(${index})">Edit</button>
      <button onclick="deleteTransaction(${index})">Delete</button>`;
    div.onclick = () => showCustomerReport(t.name);
    entriesDiv.appendChild(div);
  });
}

function addTransaction() {
  const nameInput = document.getElementById('customerName');
  const amountInput = document.getElementById('amount');
  const typeInput = document.getElementById('type');

  if (nameInput.value && amountInput.value) {
    transactions.push({
      name: nameInput.value,
      amount: parseFloat(amountInput.value),
      type: typeInput.value
    });
    localStorage.setItem('transactions', JSON.stringify(transactions));
    customerSuggestions.push(nameInput.value);
    renderTransactions();
    uploadToDrive();
    nameInput.value = '';
    amountInput.value = '';
  }
}

function editTransaction(index) {
  const newAmount = prompt("Enter new amount:", transactions[index].amount);
  if (newAmount !== null) {
    transactions[index].amount = parseFloat(newAmount);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    renderTransactions();
    uploadToDrive();
  }
}

function deleteTransaction(index) {
  if (confirm("Are you sure?")) {
    transactions.splice(index, 1);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    renderTransactions();
    uploadToDrive();
  }
}

function showCustomerReport(customerName) {
  const report = transactions.filter(t => t.name === customerName);
  let message = `Transactions for ${customerName}:
`;
  let balance = 0;
  report.forEach(t => {
    message += `${t.type.toUpperCase()}: ${t.amount}
`;
    balance += t.type === 'receive' ? t.amount : -t.amount;
  });
  message += `
Balance: ${balance}`;
  alert(message);
}

// Cloud sync functions
function uploadToDrive() {
  const fileContent = JSON.stringify(transactions);
  const file = new Blob([fileContent], {type: 'application/json'});

  if (!fileId) {
    const metadata = {
      name: 'bakir_khata_data.json',
      mimeType: 'application/json',
      parents: []
    };

    gapi.client.drive.files.create({
      resource: metadata,
      media: {
        mimeType: 'application/json',
        body: file
      }
    }).then(res => {
      fileId = res.result.id;
    });
  } else {
    gapi.client.request({
      path: `/upload/drive/v3/files/${fileId}`,
      method: 'PATCH',
      params: {uploadType: 'media'},
      body: file
    });
  }
}

function loadFromDrive() {
  // (Optional advanced) Implement if needed
}