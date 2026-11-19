// FreeProjectAPI host verified from the User App practice documentation.
// The API catalogue shows requests under https://api.freeprojectapi.com/api/...
const API_BASE = "https://api.freeprojectapi.com";

async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem("accessToken");
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (token && options.auth !== false) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
  });

  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; }
  catch { data = raw; }

  if (!response.ok) {
    const message = data?.message || data?.title || `HTTP ${response.status}`;
    throw new Error(message);
  }
  if (data && typeof data === "object" && data.result === false) {
    throw new Error(data.message || "The API reported that the request failed.");
  }
  return data;
}

const UserAPI = {
  register: body => apiRequest("/api/UserApp/CreateNewUser", { method: "POST", body, auth: false }),
  login: body => apiRequest("/api/UserApp/login", { method: "POST", body, auth: false }),
  refresh: body => apiRequest("/api/UserApp/refresh", { method: "POST", body, auth: false }),
  getAllUsers: () => apiRequest("/api/UserApp/GetAllUsers"),
  searchUsers: (searchText, pageNumber, pageSize) =>
    apiRequest(`/api/UserApp/searchUsers?searchText=${encodeURIComponent(searchText)}&pageNumber=${pageNumber}&pageSize=${pageSize}`),
  sendResetOtp: emailId =>
    apiRequest(`/api/UserApp/send-reset-otp?emailId=${encodeURIComponent(emailId)}`, { method: "POST", auth: false }),
  verifyOtpResetPassword: body =>
    apiRequest("/api/UserApp/verify-otp-reset-password", { method: "POST", body, auth: false }),
  updatePassword: (customerId, body) =>
    apiRequest(`/api/UserApp/update-password/${encodeURIComponent(customerId)}`, { method: "PUT", body })
};

function unwrapData(response) {
  return response && typeof response === "object" && "data" in response ? response.data : response;
}

function saveAuth(response, fallbackEmail) {
  const payload = unwrapData(response) || {};
  const accessToken = payload.token || payload.accessToken || payload.jwtToken || payload.access_token;
  const refreshToken = payload.refreshToken || payload.refresh_token;
  if (accessToken) sessionStorage.setItem("accessToken", accessToken);
  if (refreshToken) sessionStorage.setItem("refreshToken", refreshToken);
  if (payload.emailId || fallbackEmail) sessionStorage.setItem("emailId", payload.emailId || fallbackEmail);
  sessionStorage.setItem("userData", JSON.stringify(payload));
  return payload;
}
