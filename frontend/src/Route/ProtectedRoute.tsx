import React, {JSX} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {isAuthenticated} from "../Cookie";

interface Props { children: JSX.Element }

const ProtectedRoute: React.FC<Props> = ({ children }) => {
    const location = useLocation();
    return isAuthenticated()
        ? children
        : <Navigate to="/auth" replace state={{ from: location }} />;
};

export default ProtectedRoute;