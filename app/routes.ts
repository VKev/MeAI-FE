import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("", "layouts/guest-layout.tsx", [
    index("routes/guest/home.tsx"),
    route("about", "routes/guest/about.tsx"),
    route("contact", "routes/guest/contact.tsx"),
    route("pricing", "routes/guest/pricing.tsx"),
  ]),
  route("auth", "layouts/auth-layout.tsx", [
    index("routes/auth/_index.tsx"),
    route("login", "routes/auth/login.tsx"),
    route("signup", "routes/auth/signup.tsx"),
    route("forgot-password", "routes/auth/forgot-password.tsx"),
  ]),
  route("admin", "layouts/admin-layout.tsx", [
    index("routes/admin/_index.tsx"),
    route("dashboard", "routes/admin/dashboard.tsx"),
  ]),
  route("user", "layouts/user-layout.tsx", [
    index("routes/user/_index.tsx"),
    route("dashboard", "routes/user/dashboard.tsx"),
  ]),
] satisfies RouteConfig;
