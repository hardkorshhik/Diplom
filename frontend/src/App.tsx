import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import PublicRoute from "./Route/PublicRoute";
import ProtectedRoute from "./Route/ProtectedRoute";
import { AuthPage } from "./Pages/AuthPage";
import { DashboardPage } from "./Pages/DashboardPage/DashboardPage";
import { BatchesPage } from "./Pages/BatchesPage";
import { NewBatchPage } from "./Pages/NewBatchPage";
import { getTokenFromCookies } from "./Cookie";
import RoleRoute from "./Route/RoleRoute";
import { StaffPage } from "./Pages/StaffPage";
import { BatchDetailsPage } from "./Pages/BatchDetailsPage/BatchDetailsPage";

function App() {
    const isAuthenticated = Boolean(getTokenFromCookies());

    return (
        <Routes>
            <Route
                path="/auth"
                element={
                    <PublicRoute>
                        <AuthPage />
                    </PublicRoute>
                }
            />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/batches"
                element={
                    <ProtectedRoute>
                        <BatchesPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/batches/new"
                element={
                    <ProtectedRoute>
                        <NewBatchPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/batches/:id"
                element={
                    <ProtectedRoute>
                        <BatchDetailsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/staff"
                element={
                    <RoleRoute allowed={["ADMIN"]}>
                        <StaffPage />
                    </RoleRoute>
                }
            />

            <Route
                path="*"
                element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />}
            />
        </Routes>
    );
}

export default App;
