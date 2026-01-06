import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Titulos from "./pages/Titles";
import Clientes from "./pages/Clients";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "titulos", element: <Titulos /> },
      { path: "clientes", element: <Clientes /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
