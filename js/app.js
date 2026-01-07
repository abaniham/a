// SPA

import { initAuth } from "./auth.js";
import { createXPGraph} from './xp.js';
import { calculatePassFail } from './passfail.js';
import { updateProfileView } from './profile.js';

// get from HTML
const loginView = document.getElementById("login-view");
const profileView = document.getElementById("profile-view");
const form = document.getElementById("login-form");
const errorMsg = document.getElementById("error");
const logoutBtn = document.getElementById("logout-btn");

// render function
function render() {
  // if user login --> token = jwt
  const token = localStorage.getItem("jwt");

  if (token) {
    loginView.style.display = "none";
    profileView.style.display = "block";
  } else {
    loginView.style.display = "block";
    profileView.style.display = "none";
  }
}
// Drow Chart
function renderCharts(transactions, results) {
  const txArray = transactions?.transaction ?? transactions ?? [];
  const resArray = results?.progress ?? results ?? [];

  createXPGraph(txArray);
  calculatePassFail(resArray);
}

// Attach auth handlers (login + logout)
initAuth({ form, logoutBtn, errorMsg, render });

// init
render();

async function loadDataIfAuthenticated() {
  const token = localStorage.getItem('jwt');
  if (!token) return;

  try {
    const { transactions, results } = await updateProfileView();
    
    renderCharts(transactions, results);
  } catch (err) {
    console.error('Error loading user data:', err);
  }
}

loadDataIfAuthenticated();

// Update data
document.addEventListener('profileData', (e) => {
  const transactions = e.detail.transactions;
  const results = e.detail.results;
  
  // update graph
  renderCharts(transactions, results);
});