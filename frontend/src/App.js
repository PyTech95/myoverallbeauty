import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Book from "./pages/Book";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Account from "./pages/Account";
import Studio from "./pages/Studio";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Accessibility from "./pages/Accessibility";
import Cookies from "./pages/Cookies";
import Faq from "./pages/Faq";
import { AuthProvider } from "./lib/auth";
import { ContentProvider } from "./lib/contentContext";
import { RequireAuth } from "./lib/RequireAuth";
import MobileActionBar from "./components/MobileActionBar";
import LiveEditToolbar from "./lib/liveEdit";
import "./App.css";

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <AuthProvider>
                    <ContentProvider>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/book" element={<Book />} />
                            <Route path="/signin" element={<SignIn />} />
                            <Route path="/signup" element={<SignUp />} />
                            <Route
                                path="/account"
                                element={
                                    <RequireAuth>
                                        <Account />
                                    </RequireAuth>
                                }
                            />
                            <Route
                                path="/studio"
                                element={
                                    <RequireAuth staffOnly>
                                        <Studio />
                                    </RequireAuth>
                                }
                            />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route path="/terms" element={<Terms />} />
                            <Route
                                path="/accessibility"
                                element={<Accessibility />}
                            />
                            <Route path="/cookies" element={<Cookies />} />
                            <Route path="/faq" element={<Faq />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                        <MobileActionBar />
                        <LiveEditToolbar />
                    </ContentProvider>
                </AuthProvider>
            </BrowserRouter>
            <Toaster
                position="bottom-center"
                theme="dark"
                toastOptions={{
                    style: {
                        background: "#0A0A0A",
                        border: "1px solid rgba(212,175,55,0.35)",
                        color: "#F9F6F0",
                        fontFamily: "Manrope, sans-serif",
                    },
                }}
            />
        </div>
    );
}

export default App;
