export async function readErrorMessage(res: Response) {
  if (res.status == 429) return "Please wait a bit before doing that again.";

  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {
    return `Request failed (${res.status})`;
  }
  return `Request failed (${res.status})`;
}
