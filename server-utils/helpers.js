function dateFormat(d) {
  const minutesOffset = (new Date()).getTimezoneOffset();
  const myDate = new Date(d);
  myDate.setMinutes(myDate.getMinutes() + minutesOffset);
  return (new Date(myDate)).toLocaleString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

module.exports = {
  dateFormat: dateFormat
};