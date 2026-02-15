const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
    const res = await fetch(`${API}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : "{}" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function apiPatch<T>(path: string, body?: any): Promise<T> {
    const res = await fetch(`${API}${path}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : "{}" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
    const res = await fetch(`${API}${path}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
