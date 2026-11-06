import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const cfg = {
  apiKey: "AIzaSyCz6iWJm6jBMXRfMtKIPUjmkB8yXQlQirw",
  authDomain: "intern-task-tracker-448c0.firebaseapp.com",
  projectId: "intern-task-tracker-448c0",
  storageBucket: "intern-task-tracker-448c0.firebasestorage.app",
  messagingSenderId: "269660995015",
  appId: "1:269660995015:web:f71f94582714f8cbbeade2"
};

const app = initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, function (user) {
  if (!user) window.location.href = 'auth.html';
});

function formatDate(ts) {
  if (!ts) return 'N/A';
  try { return ts.toDate().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); }
  catch (e) { return 'N/A'; }
}

function badgeHTML(status) {
  status = status || 'pending';
  return '<span class="badge badge-' + status + '">' +
         status.charAt(0).toUpperCase() + status.slice(1) + '</span>';
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

window.searchIntern = function () {
  var name  = document.getElementById('searchName').value.trim();
  var id    = document.getElementById('searchId').value.trim().toUpperCase();
  var email = document.getElementById('searchEmail').value.trim().toLowerCase();
  var area  = document.getElementById('result-area');
  var errEl = document.getElementById('err-search-general');

  if (!name) {
    document.getElementById('err-searchName').style.display = 'block';
    return;
  }
  document.getElementById('err-searchName').style.display = 'none';

  if (!id && !email) {
    errEl.textContent = 'Please provide either Intern ID or Email.';
    errEl.style.color = '#EF4444';
    return;
  }
  errEl.textContent = '';

  area.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">Searching...</div>';

  var searchQuery;
  if (id) {
    searchQuery = getDocs(query(collection(db, 'submissions'), where('internId', '==', id)));
  } else {
    searchQuery = getDocs(query(collection(db, 'submissions'), where('email', '==', email)));
  }

  searchQuery.then(function (snap) {
    if (snap.empty) {
      area.innerHTML = '<div style="padding:20px;background:#FEF3C7;border-radius:10px;color:#92400E">No submission found. Please check your details.</div>';
      return;
    }

    // Match ANY doc whose name fuzzy-matches input
    var inputName = name.toLowerCase();
    var matchDoc = null;
    snap.forEach(function (doc) {
      if (matchDoc) return;
      var d = doc.data();
      var dn = String(d.name || '').toLowerCase();
      if (dn.includes(inputName.split(' ')[0]) || inputName.includes(dn.split(' ')[0])) {
        matchDoc = d;
      }
    });

    if (!matchDoc) {
      area.innerHTML = '<div style="padding:20px;background:#FEE2E2;border-radius:10px;color:#991B1B">Name does not match our records. Please check and try again.</div>';
      return;
    }

    var data = matchDoc;
    area.innerHTML =
      '<div class="result-card">' +
        '<div class="result-card-header">' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<div>' +
              '<div style="font-size:20px;font-weight:700">' + escapeHtml(data.name) + '</div>' +
              '<div style="font-size:13px;opacity:0.80;margin-top:3px">' +
                escapeHtml(data.internId) + ' &middot; ' + escapeHtml(data.email) +
              '</div>' +
            '</div>' +
            badgeHTML(data.status) +
          '</div>' +
        '</div>' +
        '<div class="result-card-body">' +
          '<div class="result-field"><label>Task Title</label><p>' + escapeHtml(data.taskTitle) + '</p></div>' +
          '<div class="result-field"><label>Link</label><p><a href="' + escapeHtml(data.githubLink) + '" target="_blank" rel="noopener" style="color:var(--primary)">' + escapeHtml(data.githubLink) + '</a></p></div>' +
          '<div class="result-field"><label>Description</label><p style="color:var(--text-muted)">' + escapeHtml(data.description) + '</p></div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
            '<div class="result-field"><label>Submission Date</label><p>' + escapeHtml(data.submissionDate || 'N/A') + '</p></div>' +
            '<div class="result-field"><label>Submitted At</label><p>' + formatDate(data.submittedAt) + '</p></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }).catch(function (err) {
    area.innerHTML = '<div style="color:var(--danger)">Error: ' + escapeHtml(err.message) + '</div>';
  });
};

window.doLogout = function () {
  signOut(auth).then(function () { window.location.href = 'auth.html'; });
};