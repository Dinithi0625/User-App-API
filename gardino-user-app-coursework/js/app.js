const $ = id => document.getElementById(id);
let currentPage = 1;
let lastUsers = [];

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast-message ${type} mb-2`;
  toast.textContent = message;
  $("toastArea").appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
}
function setBusy(form, busy) {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  button.disabled = busy;
  const spinner = button.querySelector(".spinner-border");
  const label = button.querySelector(".btn-text");
  if (spinner) spinner.classList.toggle("d-none", !busy);
  if (label && busy) label.dataset.oldText = label.textContent;
  if (label && !busy && label.dataset.oldText) label.textContent = label.dataset.oldText;
}
function showAuthPanel(name) {
  ["login", "register", "forgot"].forEach(key => $(`${key}Panel`).classList.toggle("d-none", key !== name));
}
function showApp() {
  $("authView").classList.add("d-none");
  $("appView").classList.remove("d-none");
  const user = JSON.parse(sessionStorage.getItem("userData") || "{}");
  const email = sessionStorage.getItem("emailId") || user.emailId || "Signed in";
  const display = user.fullName || user.name || email.split("@")[0] || "User";
  $("sideName").textContent = display;
  $("sideEmail").textContent = email;
  $("welcomeName").textContent = display;
  $("accountEmail").textContent = email;
  $("sideAvatar").textContent = display.charAt(0).toUpperCase();
  $("topAvatar").textContent = display.charAt(0).toUpperCase();
  $("todayText").textContent = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  loadUsers(true).catch(err => showToast(err.message, "error"));
}
function showLogin() {
  $("appView").classList.add("d-none");
  $("authView").classList.remove("d-none");
  showAuthPanel("login");
}
function switchPage(page) {
  const names = { overview: "Overview", users: "User directory", password: "Change password" };
  Object.keys(names).forEach(key => $(`${key}Page`).classList.toggle("d-none", key !== page));
  document.querySelectorAll("[data-page]").forEach(button => button.classList.toggle("active", button.dataset.page === page));
  $("pageHeading").textContent = names[page] || "Overview";
  if (page === "users") loadUsers().catch(err => showToast(err.message, "error"));
}
function normalizeList(data) {
  const value = unwrapData(data);
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.items)) return value.items;
  if (value && Array.isArray(value.users)) return value.users;
  if (value && Array.isArray(value.records)) return value.records;
  return [];
}
function renderUsers(users) {
  lastUsers = users;
  const body = $("usersTableBody");
  body.innerHTML = "";
  if (!users.length) {
    body.innerHTML = '<tr><td colspan="3" class="empty-state">No user records were returned.</td></tr>';
    return;
  }
  users.forEach(user => {
    const name = user.fullName || user.name || user.userName || "Unnamed user";
    const email = user.emailId || user.email || "—";
    const id = user.customerId ?? user.userId ?? user.id ?? "—";
    const row = document.createElement("tr");
    const userCell = document.createElement("td");
    const wrapper = document.createElement("div");
    wrapper.className = "user-cell";
    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.textContent = String(name).charAt(0).toUpperCase();
    const nameNode = document.createElement("strong");
    nameNode.textContent = name;
    nameNode.className = "fw-semibold";
    wrapper.append(avatar, nameNode);
    userCell.append(wrapper);
    const emailCell = document.createElement("td");
    emailCell.textContent = email;
    const idCell = document.createElement("td");
    idCell.textContent = id;
    row.append(userCell, emailCell, idCell);
    body.append(row);
  });
}
async function loadUsers(useAll = false) {
  $("usersLoading").classList.remove("d-none");
  try {
    const query = $("searchText").value.trim();
    const size = Number($("pageSize").value || 10);
    let response;
    if (useAll && !query) {
      response = await UserAPI.getAllUsers();
    } else {
      response = await UserAPI.searchUsers(query, currentPage, size);
    }
    const list = normalizeList(response);
    renderUsers(list);
    const payload = unwrapData(response);
    const total = payload && !Array.isArray(payload) ? (payload.totalCount ?? payload.totalRecords ?? payload.total ?? list.length) : list.length;
    $("totalUsers").textContent = total;
    $("pageInfo").textContent = `Page ${currentPage} · ${list.length} record(s) shown`;
    $("prevPage").disabled = currentPage <= 1;
    $("nextPage").disabled = list.length < size;
  } finally {
    $("usersLoading").classList.add("d-none");
  }
}

document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => showAuthPanel(button.dataset.view)));
document.querySelectorAll("[data-page]").forEach(button => button.addEventListener("click", () => switchPage(button.dataset.page)));

$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  setBusy(form, true);
  try {
    const emailId = $("loginEmail").value.trim();
    const response = await UserAPI.login({ emailId, password: $("loginPassword").value });
    const user = saveAuth(response, emailId);
    if (!sessionStorage.getItem("accessToken")) {
      showToast("Login response received, but no access token field was detected. Check the API response format.", "error");
    } else {
      showToast("Login successful.");
    }
    showApp();
  } catch (error) {
    showToast(error.message || "Unable to sign in.", "error");
  } finally { setBusy(form, false); }
});

$("registerForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  setBusy(form, true);
  try {
    // Field names are based on the common UserApp registration model.
    // Confirm them against the live API tester if its schema differs.
    const body = {
      fullName: $("regName").value.trim(),
      emailId: $("regEmail").value.trim(),
      mobileNo: $("regMobile").value.trim(),
      password: $("regPassword").value
    };
    const response = await UserAPI.register(body);
    showToast(response?.message || "Registration request completed. You can now sign in.");
    form.reset();
    showAuthPanel("login");
  } catch (error) {
    showToast(error.message || "Registration failed.", "error");
  } finally { setBusy(form, false); }
});

$("sendOtpForm").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    const emailId = $("forgotEmail").value.trim();
    const response = await UserAPI.sendResetOtp(emailId);
    showToast(response?.message || "OTP request sent. Check the registered email.");
  } catch (error) { showToast(error.message || "Could not send OTP.", "error"); }
});

$("verifyOtpForm").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    // Verify the exact property names with the provider schema if required.
    const body = {
      emailId: $("forgotEmail").value.trim(),
      otp: $("otpCode").value.trim(),
      newPassword: $("newPassword").value
    };
    const response = await UserAPI.verifyOtpResetPassword(body);
    showToast(response?.message || "Password reset request completed.");
    showAuthPanel("login");
  } catch (error) { showToast(error.message || "OTP verification failed.", "error"); }
});

$("searchForm").addEventListener("submit", async event => {
  event.preventDefault(); currentPage = 1;
  try { await loadUsers(); } catch (error) { showToast(error.message, "error"); }
});
$("reloadUsers").addEventListener("click", async () => {
  currentPage = 1;
  try { await loadUsers(true); } catch (error) { showToast(error.message, "error"); }
});
$("prevPage").addEventListener("click", async () => {
  if (currentPage > 1) { currentPage--; try { await loadUsers(); } catch (error) { showToast(error.message, "error"); } }
});
$("nextPage").addEventListener("click", async () => {
  currentPage++; try { await loadUsers(); } catch (error) { currentPage--; showToast(error.message, "error"); }
});

$("changePasswordForm").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    const customerId = $("customerId").value.trim();
    const body = {
      currentPassword: $("currentPassword").value,
      newPassword: $("updatedPassword").value
    };
    const response = await UserAPI.updatePassword(customerId, body);
    showToast(response?.message || "Password update request completed.");
    event.currentTarget.reset();
  } catch (error) { showToast(error.message || "Password update failed.", "error"); }
});

$("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("emailId");
  sessionStorage.removeItem("userData");
  showLogin();
  showToast("You have signed out.");
});

// Refresh-token helper is exposed for testing and future automatic refresh.
// The User App documentation lists emailId, token and refreshToken in the request.
async function refreshAccessToken() {
  const emailId = sessionStorage.getItem("emailId");
  const token = sessionStorage.getItem("accessToken");
  const refreshToken = sessionStorage.getItem("refreshToken");
  if (!emailId || !token || !refreshToken) throw new Error("No complete refresh-token session is stored.");
  const response = await UserAPI.refresh({ emailId, token, refreshToken });
  saveAuth(response, emailId);
  return response;
}
window.refreshAccessToken = refreshAccessToken;

if (sessionStorage.getItem("accessToken")) showApp();
else showLogin();
