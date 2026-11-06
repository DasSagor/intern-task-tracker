import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const cfg = {
  apiKey: "AIzaSyCz6iWJm6jBMXRfMtKIPUjmkB8yXQlQirw",
  authDomain: "intern-task-tracker-448c0.firebaseapp.com",
  projectId: "intern-task-tracker-448c0",
  storageBucket: "intern-task-tracker-448c0.firebasestorage.app",
  messagingSenderId: "269660995015",
  appId: "1:269660995015:web:f71f94582714f8cbbeade2"
};

const app = initializeApp(cfg);
const db = getFirestore(app);
const auth = getAuth(app);
let allData = [];
let pieChart, barChart;

onAuthStateChanged(auth, function (user) {
  if (!user) { window.location.href = 'auth.html'; return; }
  if (user.email !== 'admin@intern.com') { window.location.href = 'index.html'; return; }
  initDashboard();
});

function showToast(msg, type) {
  type = type || 'success';
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast toast-' + type + ' show';
  setTimeout(function () { toast.classList.remove('show'); }, 3000);
}

function formatDate(ts) {
  if (!ts) return 'N/A';
  try { return ts.toDate().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); }
  catch (e) { return 'N/A'; }
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function badge(status) {
  status = status || 'pending';
  return '<span class="badge badge-' + status + '">' +
         status.charAt(0).toUpperCase() + status.slice(1) + '</span>';
}

function renderTable(data) {
  var tbody = document.getElementById('submissions-table');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999;padding:24px">No submissions yet.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(function (d) {
    var status = d.status || 'pending';
    return '<tr>' +
      '<td><strong>' + escapeHtml(d.internId) + '</strong></td>' +
      '<td>' + escapeHtml(d.name) + '</td>' +
      '<td>' + escapeHtml(d.email) + '</td>' +
      '<td>' + escapeHtml(d.taskTitle) + '</td>' +
      '<td><a href="' + escapeHtml(d.githubLink) + '" target="_blank" rel="noopener" style="color:var(--primary);font-size:12px">View</a></td>' +
      '<td>' + badge(status) + '</td>' +
      '<td>' + formatDate(d.submittedAt) + '</td>' +
      '<td style="display:flex;gap:6px;flex-wrap:wrap">' +
        (status !== 'approved' ? '<button class="btn btn-success btn-sm" onclick="updateStatus(\'' + d.id + '\',\'approved\')">Approve</button>' : '') +
        (status !== 'rejected' ? '<button class="btn btn-danger btn-sm" onclick="updateStatus(\'' + d.id + '\',\'rejected\')">Reject</button>' : '') +
      '</td>' +
    '</tr>';
  }).join('');
}

function updateStats(data) {
  document.getElementById('total-count').textContent    = data.length;
  document.getElementById('pending-count').textContent  = data.filter(function (d) { return (d.status||'pending') === 'pending'; }).length;
  document.getElementById('approved-count').textContent = data.filter(function (d) { return d.status === 'approved'; }).length;
  document.getElementById('rejected-count').textContent = data.filter(function (d) { return d.status === 'rejected'; }).length;
}

function initCharts() {
  pieChart = new Chart(document.getElementById('pieChart').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Pending','Approved','Rejected'],
      datasets: [{ data: [0,0,0], backgroundColor: ['#F59E0B','#10B981','#EF4444'] }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
  barChart = new Chart(document.getElementById('barChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{ label: 'Submissions', data: [], backgroundColor: '#1B2A6B', borderRadius: 6 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function updateCharts(data) {
  pieChart.data.datasets[0].data = [
    data.filter(function (d) { return (d.status||'pending') === 'pending'; }).length,
    data.filter(function (d) { return d.status === 'approved'; }).length,
    data.filter(function (d) { return d.status === 'rejected'; }).length
  ];
  pieChart.update();

  var days = [], counts = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
    var dateStr = d.toDateString();
    counts.push(data.filter(function (s) {
      if (!s.submittedAt || typeof s.submittedAt.toDate !== 'function') return false;
      return s.submittedAt.toDate().toDateString() === dateStr;
    }).length);
  }
  barChart.data.labels = days;
  barChart.data.datasets[0].data = counts;
  barChart.update();
}

function initDashboard() {
  initCharts();
  var q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
  onSnapshot(q, function (snap) {
    allData = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    renderTable(allData);
    updateStats(allData);
    updateCharts(allData);
  }, function (err) {
    showToast('Load failed: ' + err.message, 'error');
  });
}

window.updateStatus = function (id, status) {
  updateDoc(doc(db, 'submissions', id), { status: status })
    .then(function () { showToast('Marked as ' + status); })
    .catch(function (e) { showToast('Update failed: ' + e.message, 'error'); });
};

window.logout = function () {
  signOut(auth).then(function () { window.location.href = 'auth.html'; });
};

window.exportCSV = function () {
  if (!allData.length) return;
  var headers = ['Intern ID','Name','Email','Task Title','Link','Status','Submitted At'];
  var rows = allData.map(function (d) {
    return [
      d.internId || '', d.name || '', d.email || '', d.taskTitle || '',
      d.githubLink || '', d.status || 'pending',
      d.submittedAt && d.submittedAt.toDate ? d.submittedAt.toDate().toLocaleDateString() : 'N/A'
    ];
  });
  var csv = [headers].concat(rows).map(function (r) {
    return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'submissions.csv';
  a.click();
};