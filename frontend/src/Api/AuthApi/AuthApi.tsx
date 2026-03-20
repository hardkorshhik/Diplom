import {Login} from "./Types/Login";
import {JWT} from "./Types/JWT";
import {api} from "../index";

export const fetchLogin = async (login: Login): Promise<string | null> => {
    try {
        const response = await fetch(`${api.host}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(login),
        });

        if (!response.ok) return null;

        const data = (await response.json()) as JWT;
        if (!data) return null;

        return data.accessToken;
    } catch { return null; }
}
