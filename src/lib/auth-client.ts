export async function signOut() {
  await fetch("/login/api", { method: "DELETE" })
}
