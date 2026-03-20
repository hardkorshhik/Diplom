import React, {JSX} from 'react';
import { Navigate } from 'react-router-dom';
import {isAuthenticated} from "../Cookie";

interface Props { children: JSX.Element }

const PublicRoute: React.FC<Props> = ({ children }) => {
    return !isAuthenticated()
        ? children
        : <Navigate to="/dashboard" replace />;
};

export default PublicRoute;