import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Oddiy importlar, lazy kerak emas
import Main from "../components/layouts/main";
import Dashboard from "../pages/dashboard";
import SignIn from "../pages/sign-in";
import ForgotPassword from "../pages/forgot-password";

import DashboardPage from "../page/dashboard";
import Report from "../page/report";
import Expertise from "../page/expertise";
import Mobile from "../page/mobile";
import Daily from "../page/daily";
import Furniture from "../page/furniture";
import Development from "../page/development";
import Usefull from "../page/usefull";
import Viewer from "../page/viewer";
import ChatPage from "../page/chat";
import Word from "../page/word";
import WordTwo from "../page/word2";
import UserAdd from "../page/user-add";
import ViewProfile from "../page/view-profile";
import Vuln from "../page/vuln";
import { SystemWord } from "../page";

const AppRouter = () => {
  const [isUser, setIsUser] = useState(!!localStorage.getItem("checkUser"));

  useEffect(() => {
    const onAuthChange = () => setIsUser(!!localStorage.getItem("checkUser"));
    const onStorage = (e) => {
      if (e.key === "checkUser") onAuthChange();
    };

    window.addEventListener("authChanged", onAuthChange);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("authChanged", onAuthChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isUser ? <Navigate to="/" replace /> : <SignIn />} />
        <Route path="/forgot-password" element={isUser ? <Navigate to="/" replace /> : <ForgotPassword />} />

        {isUser ? (
          <Route element={<Main />}>
            <Route path="/page/dashboard" element={<DashboardPage />} />
            <Route path="/page/report" element={<Report />} />
            <Route path="/page/expertise" element={<Expertise />} />
            <Route path="/page/mobile" element={<Mobile />} />
            <Route path="/page/daily" element={<Daily />} />
            <Route path="/page/furniture" element={<Furniture />} />
            <Route path="/page/development" element={<Development />} />
            <Route path="/page/usefull" element={<Usefull />} />
            <Route path="/page/viewer" element={<Viewer />} />
            <Route path="/page/chat" element={<ChatPage />} />
            <Route path="/page/word/:id" element={<Word />} />
            <Route path="/page/word2" element={<WordTwo />} />
            <Route path="/page/user-add" element={<UserAdd />} />
            <Route path="/page/view-profile" element={<ViewProfile />} />
            <Route path="/page/vuln" element={<Vuln />} />
            <Route path="/page/system-doc/:id" element={<SystemWord />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
};

export default AppRouter;
