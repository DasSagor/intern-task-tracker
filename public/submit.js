import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, where, getDocs,
  serverTimestamp, doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

document.getElementById('submissionDate').valueAsDate = new Date();

onAuthStateChanged(auth, function (user) {
  if (!user) { window.location.href = 'auth.html'; return; }
  if (user.email === 'admin@intern.com') { window.location.href = 'admin.html'; return; }

  getDoc(doc(db, 'interns', user.uid))
    .then(function (snap) {
      if (snap.exists()) {
        var data = snap.data();
        document.getElementById('internId').value = data.internId || '';
        document.getElementById('name').value     = data.name     || '';
        document.getElementById('email').value    = data.email    || '';
      } else {
        document.getElementById('name').value  = user.displayName || '';
        document.getElementById('email').value = user.email       || '';
      }
    })
    .catch(function (err) {
      document.getElementById('name').value  = user.displayName || '';
      document.getElementById('email').value = user.email       || '';
    });
});

function showToast(msg, type) {
  type = type || 'success';
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast toast-' + type + ' show';
  setTimeout(function () { toast.classList.remove('show'); }, 3500);
}

function validate() {
  var fields = ['internId','name','email','taskTitle','taskCategory','submissionRound','submissionDate','description'];
  var valid = true;
  fields.forEach(function (id) {
    var val = document.getElementById(id).value.trim();
    var err = document.getElementById('err-' + id);
    if (err) {
      if (!val) { err.style.display = 'block'; valid = false; }
      else err.style.display = 'none';
    }
  });
  
  var link = document.getElementById('githubLink').value.trim();
  if (link && !/^https?:\/\//i.test(link)) {
    var errL = document.getElementById('err-githubLink');
    errL.textContent = 'Must start with http:// or https://';
    errL.style.display = 'block';
    valid = false;
  } else {
    document.getElementById('err-githubLink').style.display = 'none';
  }
  return valid;
}

window.submitTask = function () {
  if (!validate()) return;

  var internId       = document.getElementById('internId').value.trim();
  var name           = document.getElementById('name').value.trim();
  var email          = document.getElementById('email').value.trim();
  var taskTitle      = document.getElementById('taskTitle').value.trim();
  var taskCategory   = document.getElementById('taskCategory').value;
  var submissionRound= document.getElementById('submissionRound').value;
  var githubLink     = document.getElementById('githubLink').value.trim();
  var submissionDate = document.getElementById('submissionDate').value;
  var description    = document.getElementById('description').value.trim();
  var btn            = document.getElementById('btn-submit');

  btn.disabled = true;
  btn.textContent = 'Submitting...';

  getDocs(query(collection(db, 'submissions'), where('internId', '==', internId)))
    .then(function (existing) {
      if (!existing.empty) {
        showToast('Already submitted! Use Track page to check status.', 'error');
        btn.textContent = 'Submit Task';
        btn.disabled = false;
        return;
      }
      
      return addDoc(collection(db, 'submissions'), {
        internId: internId,
        name: name,
        email: email,
        taskTitle: taskTitle,
        taskCategory: taskCategory,
        submissionRound: submissionRound,
        githubLink: githubLink,
        submissionDate: submissionDate,
        description: description,
        status: 'pending',
        submittedAt: serverTimestamp()
      }).then(function () {
        var user = auth.currentUser;
        if (user) {
          updateDoc(doc(db, 'interns', user.uid), {
             internId: internId, name: name, email: email
          }).catch(function(e){ console.log('Profile update skipped:', e); });
        }

        showToast('Task submitted successfully!');
        resetForm();
        btn.textContent = 'Submit Task';
        btn.disabled = false;
      });
    })
    .catch(function (err) {
      showToast('Error: ' + err.message, 'error');
      btn.textContent = 'Submit Task';
      btn.disabled = false;
    });
};

window.resetForm = function () {
  ['taskTitle','githubLink','description'].forEach(function (id) {
    document.getElementById(id).value = '';
  });
  document.getElementById('taskCategory').value = '';
  document.getElementById('submissionRound').value = '';
  document.getElementById('submissionDate').valueAsDate = new Date();
};

window.doLogout = function () {
  signOut(auth).then(function () { window.location.href = 'auth.html'; });
};