var firebaseConfig = {
  apiKey: "AIzaSyCz6iWJm6jBMXRfMtKIPUjmkB8yXQlQirw",
  authDomain: "intern-task-tracker-448c0.firebaseapp.com",
  projectId: "intern-task-tracker-448c0",
  storageBucket: "intern-task-tracker-448c0.firebasestorage.app",
  messagingSenderId: "269660995015",
  appId: "1:269660995015:web:f71f94582714f8cbbeade2"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
var auth = firebase.auth();
var db   = firebase.firestore();

var authActionInProgress = false;
var firstAuthCheckDone   = false;

auth.onAuthStateChanged(function (user) {
  if (authActionInProgress) return;
  if (!firstAuthCheckDone) {
    firstAuthCheckDone = true;
    if (user) {
      window.location.href = user.email === 'admin@intern.com' ? 'admin.html' : 'index.html';
    }
  }
});

window.doLogin = function () {
  var role     = document.getElementById('login-role').value;
  var email    = document.getElementById('login-email').value.trim();
  var password = document.getElementById('login-password').value;
  var errEl    = document.getElementById('err-login-general');
  var valid    = true;

  if (!email) { document.getElementById('err-login-email').style.display = 'block'; valid = false; }
  else document.getElementById('err-login-email').style.display = 'none';
  if (!password) { document.getElementById('err-login-password').style.display = 'block'; valid = false; }
  else document.getElementById('err-login-password').style.display = 'none';
  if (!valid) return;

  errEl.textContent = '';
  authActionInProgress = true;

  auth.signInWithEmailAndPassword(email, password)
    .then(function (cred) {
      var user = cred.user;
      var isAdmin = (user.email === 'admin@intern.com');

      // Role Validation Check
      if (role === 'admin' && !isAdmin) {
        throw new Error('You do not have Admin privileges.');
      }
      if (role === 'intern' && isAdmin) {
        throw new Error('Please select Admin role to login as Admin.');
      }

      window.location.href = isAdmin ? 'admin.html' : 'index.html';
    })
    .catch(function (err) {
      authActionInProgress = false;
      // If sign in was success but role check failed, we should sign them out
      if (auth.currentUser && err.message.includes('privileges')) {
         auth.signOut();
      }
      if (err.message.includes('privileges') || err.message.includes('Admin role')) {
         errEl.textContent = err.message;
      } else {
         errEl.textContent = 'Invalid email or password. Please try again. (' + err.code + ')';
      }
      errEl.style.color = '#EF4444';
    });
};

window.doRegister = function () {
  var name     = document.getElementById('reg-name').value.trim();
  var internId = document.getElementById('reg-internId').value.trim().toUpperCase();
  var email    = document.getElementById('reg-email').value.trim();
  var password = document.getElementById('reg-password').value;
  var confirm  = document.getElementById('reg-confirm').value;
  var errEl    = document.getElementById('err-reg-general');
  var valid    = true;

  if (!name) { document.getElementById('err-reg-name').style.display = 'block'; valid = false; }
  else document.getElementById('err-reg-name').style.display = 'none';
  if (!internId.startsWith('B21')) { document.getElementById('err-reg-internId').style.display = 'block'; valid = false; }
  else document.getElementById('err-reg-internId').style.display = 'none';
  if (!email || !email.includes('@')) { document.getElementById('err-reg-email').style.display = 'block'; valid = false; }
  else document.getElementById('err-reg-email').style.display = 'none';
  if (password.length < 6) { document.getElementById('err-reg-password').style.display = 'block'; valid = false; }
  else document.getElementById('err-reg-password').style.display = 'none';
  if (password !== confirm) { document.getElementById('err-reg-confirm').style.display = 'block'; valid = false; }
  else document.getElementById('err-reg-confirm').style.display = 'none';
  if (!valid) return;

  errEl.textContent = '';
  authActionInProgress = true;

  auth.createUserWithEmailAndPassword(email, password)
    .then(function (cred) {
      return cred.user.updateProfile({ displayName: name }).then(function () {
        return db.collection('interns').doc(cred.user.uid).set({
          name: name,
          internId: internId,
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
    })
    .then(function () {
      window.location.href = 'index.html';
    })
    .catch(function (err) {
      authActionInProgress = false;
      errEl.textContent = err.code === 'auth/email-already-in-use'
        ? 'Email already registered. Please sign in.'
        : 'Registration failed: ' + err.message + ' (' + err.code + ')';
      errEl.style.color = '#EF4444';
    });
};