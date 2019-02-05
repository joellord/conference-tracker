export function dateFormat(d) {
  const minutesOffset = (new Date()).getTimezoneOffset();
  const myDate = new Date(d);
  myDate.setMinutes(myDate.getMinutes() + minutesOffset);
  return (new Date(myDate)).toLocaleString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export const EXPENSES_COVERED = {
  NO: 0,
  YES: 1,
  TBD: -1
};

export function expensesCovered(val) {
  if (val === EXPENSES_COVERED.NO) return "No";
  if (val === EXPENSES_COVERED.YES) return "Yes";
  return "TBD / Unsure";
}
