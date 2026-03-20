export const putTokenInCookie = (token: string): void => {
    document.cookie = [
        `jwt=${token}`,
        'path=/',
        `max-age=${60*60*24}`,
    ].join('; ');
}

export const getTokenFromCookies = (): string | null => {
    const match = document.cookie.match(new RegExp('(?:^|; )jwt=([^;]+)'));
    return match ? match[1] : null;
};

export const clearTokenCookie = () => {
    document.cookie = [
        'jwt=',
        'path=/',
        'expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ].join('; ');
};


export const isAuthenticated = (): boolean => Boolean(getTokenFromCookies());