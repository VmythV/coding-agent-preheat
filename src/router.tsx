import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import HomePage from "@/pages/home";
import ToolsPage from "@/pages/tools";
import AIPage from "@/pages/ai";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "tools", element: <ToolsPage /> },
      { path: "ai", element: <AIPage /> },
    ],
  },
]);

export function AppRouter(): React.JSX.Element {
  return <RouterProvider router={router} />;
}
