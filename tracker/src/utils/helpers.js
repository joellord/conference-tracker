export function dateFormat(d) {
  return (new Date(d)).toLocaleString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export function other() {
  // This function is only here to let me do an export without a default
}
