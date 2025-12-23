import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("", "layouts/guest-layout.tsx", [
    index("routes/guest/home.tsx"),
    route("about", "routes/guest/about.tsx"),
  ]),
] satisfies RouteConfig;
