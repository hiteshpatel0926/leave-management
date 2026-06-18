import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,   // ✅ important: send cookies
});

// No request interceptor for Authorization header – token is in cookie

export default api;