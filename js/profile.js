// data + UI

import { getUser, getUserXP, getResults } from "./graphql.js";
// import { calculateTotalXP } from './xp.js';

// Update profile with new data
export async function updateProfileView() {
  try {
    const user = await getUser();
    // Extract the first user object from the user array if available, otherwise use an empty object
    const userInfo = user.user && user.user[0] ? user.user[0] : {};

    const headerEl = document.getElementById('profile-title');
    const usernameEl = document.getElementById('username');
    const idEl = document.getElementById('user-id');
    const emailEl = document.getElementById('user-email');
    const avatarEl = document.getElementById('avatar');
    const totalXpEl = document.getElementById('total-xp');
    const passCountEl = document.getElementById('pass-count');
    const failCountEl = document.getElementById('fail-count');
    const projectsListEl = document.getElementById('projects-list');

    // if string --> object
    let profileObj = {};
    if (userInfo.profile) {
      try {
        profileObj = typeof userInfo.profile === 'string' ? JSON.parse(userInfo.profile) : userInfo.profile;
      } catch (e) {
        profileObj = {};
      }
    }

    const userData = {
      login: userInfo.login || "",
      id: userInfo.id || "",
      firstName: userInfo.firstName || "",
      lastName: userInfo.lastName || "",
      email: userInfo.email || ""
    };

// Build displayName from firstName and lastName, or use login as fallback
let displayName = "";
if (userData.firstName || userData.lastName) {
  displayName = [userData.firstName, userData.lastName].filter(Boolean).join(' ');
} else {
  displayName = userData.login || '';
}

// Fill elements using userData
const headerName = displayName || userData.login || '';
if (headerEl) headerEl.textContent = headerName;

setText(usernameEl, `Username: ${userData.login || '—'}`);
setText(idEl, `ID: ${userData.id || '—'}`);
setText(emailEl, `Email: ${userData.email || '—'}`);

// Fill avatar with initials (use displayName or login as fallback)
if (avatarEl) {
  avatarEl.textContent = generateInitials(displayName || userData.login || '');
}

  // get extra data
    const transactions = await getUserXP();
    const results = await getResults();


    // Use calculateTotalXP to get graphData, and sum XP from it
    const totalXP = transactions.transaction?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;
    if (totalXpEl) totalXpEl.textContent = `Total XP: ${totalXP}`;

    // Calculate pass/fail from graded projects
    const gradedProjects = results.progress?.filter(r => r.object?.type?.toLowerCase() === 'project' && r.grade !== null) || [];
    const passCount = gradedProjects.reduce((count, r) => count + (Number(r.grade) >= 1 ? 1 : 0), 0);
    const failCount = gradedProjects.reduce((count, r) => count + (Number(r.grade) < 1 ? 1 : 0), 0);
    if (passCountEl) passCountEl.textContent = `Passed Projects: ${passCount}`;
    if (failCountEl) failCountEl.textContent = `Failed Projects: ${failCount}`;

    // Build XP map for projects
    const projectXPMap = {};
    transactions.transaction?.forEach(tx => {
      if (tx.object?.type?.toLowerCase() === 'project') {
        const name = tx.object.name || 'Unknown';
        projectXPMap[name] = (projectXPMap[name] || 0) + (Number(tx.amount) || 0);
      }
    });

    // Get top 5 projects
    const sortedProjects = gradedProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    // Build projects list
    let projectsHTML = '<ul class="projects-list-items">';
    sortedProjects.forEach(proj => {
      const name = proj.object?.name || 'Unknown';
      const status = Number(proj.grade) >= 1 ? 'Pass' : 'Fail';
      const xp = projectXPMap[name] || 0;
      const date = new Date(proj.createdAt).toLocaleDateString();
      projectsHTML += `<li class="project-item ${status.toLowerCase()}" data-date="${date}" data-xp="${xp}" data-status="${status}">
        <strong>${name}</strong> - XP: ${xp}
      </li>`;
    });
    projectsHTML += '</ul>';

    if (projectsListEl) projectsListEl.innerHTML = projectsHTML || '<p>No recent projects available</p>';

    // Dispatch event for graphs
    const detail = { transactions, results };
    document.dispatchEvent(new CustomEvent('profileData', { detail }));

    return detail;
  } catch (err) {
    console.error("Error updating profile view:", err);
    throw err;
  }
}

// set text in element and show it if hidden
function setText(el, text) {
  if (el) {
    el.textContent = text;
    el.style.display = '';
  }
}

// avatar
function generateInitials(srcName) {
  const initials = srcName.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('') || srcName.slice(0, 2);
  return initials;
}