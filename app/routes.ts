import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // UI ROUTES
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
    route("users", "routes/admin/admin-users.tsx"),
    route("subscriptions", "routes/admin/admin-subscriptions.tsx"),
    route("transactions", "routes/admin/admin-transactions.tsx"),
    route("config", "routes/admin/admin-config.tsx"),
  ]),
  route("checkout/:planId", "routes/checkout/stripe-checkout.tsx"),
  route("checkout/result", "routes/checkout/stripe-result.tsx"),

  route("user", "layouts/user-layout.tsx", [
    index("routes/user/_index.tsx"),
    // UI Pages
    route("dashboard", "routes/user/dashboard.tsx"),
    route("plans", "routes/user/plan.tsx"),
    route("social-links", "routes/user/social-links.tsx"),
    route("user-settings", "routes/user/user-settings.tsx"),
    route("product", "routes/user/product.tsx"),
    route("product/:postId", "routes/user/product-detail.tsx"),
    route("library", "routes/user/library.tsx"),
    route("workspace", "routes/user/workspace.tsx"),
    route("billing-history", "routes/user/billing-history.tsx"),
  ]),

  route("workspace/:workspaceId", "layouts/workspace-layout.tsx", [
    index("routes/workspace/_index.tsx"),
    // Workspace Pages
    route("dashboard", "routes/workspace/workspace-home.tsx"),
    route("product", "routes/workspace/workspace-product.tsx"),
    route("product/:postId", "routes/workspace/workspace-product-detail.tsx"),
    route("library", "routes/workspace/workspace-library.tsx"),
    route("settings", "routes/workspace/workspace-settings.tsx"),
    route("ai-generation/:sessionId/:mode?", "routes/workspace/workspace-generation.tsx"),
  ]),

  route("post-builder/:id", "routes/post-builder/_index.tsx"),

  // Auth routes
  route("api/User/auth/refresh", "routes/api/refresh.ts"),
  route("api/session-check", "routes/api/session-check.ts"),
  route("api/logout", "routes/api/logout.ts"),
  route("api/*", "routes/api/proxy.ts"),

  // ERROR ROUTES
  route("forbidden", "routes/errors/forbidden.tsx"),
  route("server-error", "routes/errors/server-error.tsx"),
  route("*", "routes/errors/notfound.tsx"),
] satisfies RouteConfig;
