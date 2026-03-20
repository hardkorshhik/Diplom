import React from "react";
import { Navigate } from "react-router-dom";
import { getTokenFromCookies } from "../Cookie";
import { parseJwt } from "../Auth/Jwt";

type Props = {
    allowed: string[];
    children: React.ReactNode;
};

const RoleRoute: React.FC<Props> = ({ allowed, children }) => {
    const token = getTokenFromCookies();
    if (!token) {
        return <Navigate to="/auth" replace />;
    }

    const payload = parseJwt(token);
    const role = (payload?.role as string | undefined) ?? null;

    if (!role || !allowed.includes(role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default RoleRoute;
