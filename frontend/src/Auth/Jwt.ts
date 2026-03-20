export type JwtPayload = {
    sub?: string; // email
    role?: string; // ADMIN/QA/LAB
    exp?: number;
    iat?: number;
    [k: string]: unknown;
};

const base64UrlDecode = (input: string): string => {
    const pad = "=".repeat((4 - (input.length % 4)) % 4);
    const b64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
    const str = atob(b64);
    // decode UTF-8 safely
    try {
        return decodeURIComponent(
            Array.prototype.map
                .call(str, (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
    } catch {
        return str;
    }
};

export const parseJwt = (token: string): JwtPayload | null => {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const json = base64UrlDecode(parts[1]);
        return JSON.parse(json) as JwtPayload;
    } catch {
        return null;
    }
};
