/** Formats a date as dd/mm/yyyy. */
export function formatDate(value: Date | string): string {
  const d = new Date(value)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${dd}/${mm}/${d.getFullYear()}`
}
