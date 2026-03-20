export type Api = {
    host: string
}

export const api = {
    host: process.env.REACT_APP_API_HOST || "http://localhost:8080",
}
