import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { RootLayout } from './Layout/RootLayout.jsx';
import { AuthProvider } from './Context/AuthProvider.jsx';

import { Register } from './components/Register/Register.jsx';

import { MyProducts } from './components/MyProduct/MyProducts';
import { MyBids } from './components/MyBids/MyBids';
import Home from './components/Home/Home.jsx';
import { NotFound } from './components/NotFound/NotFound.jsx';
import Bills from './components/BillsPage/BillsPage.jsx';
import BillDetails from './components/BillsDetails/BillsDetails.jsx';
import MyPayBills from './components/MyPayBills/MyPayBills.jsx';
import PrivateRoute from './components/privateRoute/PrivateRoute.jsx';
import AddBill from './components/AddBill/AddBill.jsx';
import { MainRegister } from './components/MainRegister/MainRegister.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />, 
    children: [
      { index: true, element: <Home /> },
      
      { path: "register", element: <Register /> },
       { path: "bills/:id", element: <PrivateRoute><BillDetails /></PrivateRoute> },

      { path: "bills", element: <Bills /> },
      { path: "bills-details/:id", element: <PrivateRoute><BillDetails /></PrivateRoute> },
      { path: "my-bills", element: <PrivateRoute><MyPayBills /></PrivateRoute> },
      { path: "add-bill", element: <PrivateRoute><AddBill /></PrivateRoute> },
      {path:"/mainRegister",element:<MainRegister></MainRegister>},
      { path: "*", element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
