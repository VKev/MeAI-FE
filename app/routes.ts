import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // ===== UI ROUTES =====
  route("", "layouts/guest-layout.tsx", [
    index("routes/guest/home.tsx"),
    route("about", "routes/guest/about.tsx"),
    route("contact", "routes/guest/contact.tsx"),
    route("pricing", "routes/guest/pricing.tsx"),
  ]),
  route("auth", "layouts/auth-layout.tsx", [
    index("routes/auth/_index.tsx"),
    route("sign-in", "routes/auth/sign-in.tsx"),
    route("sign-up", "routes/auth/sign-up.tsx"),
    route("forgot-password", "routes/auth/forgot-password.tsx"),
    route("logout", "routes/auth/logout.tsx"),
    route("send-verification-code", "routes/auth/send-verification-code.tsx"),
    route("login-with-google", "routes/auth/login-with-google.tsx"),
    route("threads/callback", "routes/auth/threads.callback.tsx"),
    route("tiktok/callback", "routes/auth/tiktok.callback.tsx"),
  ]),
  route("admin", "layouts/admin-layout.tsx", [
    index("routes/admin/_index.tsx"),
    route("dashboard", "routes/admin/dashboard.tsx"),
  ]),
  route("checkout/:planId", "routes/checkout/stripe-checkout.tsx"),

  route("user", "layouts/user-layout.tsx", [
    index("routes/user/_index.tsx"),
    // UI Pages
    route("dashboard", "routes/user/dashboard.tsx"),
    route("plans", "routes/user/plan.tsx"),
    route("social-links", "routes/user/social-links.tsx"),
    route("user-settings", "routes/user/user-settings.tsx"),
    route("product", "routes/user/product.tsx"),
    route("library", "routes/user/library.tsx"),
    route("workspace", "routes/user/workspace.tsx"),
  ]),

  route("workspace/:workspaceId", "layouts/workspace-layout.tsx", [
    index("routes/workspace/_index.tsx"),
    route("dashboard", "routes/workspace/workspace-home.tsx"),
    route("settings", "routes/workspace/workspace-settings.tsx"),
  ]),

  // ===== API ROUTES (ACTION ONLY) =====
  // Auth routes
  route("api/User/auth/refresh", "routes/api/refresh.ts"),
  route("api/session-check", "routes/api/session-check.ts"),

  // ===== ERROR ROUTES =====
  route("forbidden", "routes/errors/forbidden.tsx"),
  route("server-error", "routes/errors/server-error.tsx"),
  route("*", "routes/errors/notfound.tsx"),
] satisfies RouteConfig;
