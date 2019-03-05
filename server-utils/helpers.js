function dateFormat(d) {
  const minutesOffset = (new Date()).getTimezoneOffset();
  const myDate = new Date(d);
  myDate.setMinutes(myDate.getMinutes() + minutesOffset);
  return (new Date(myDate)).toLocaleString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function convertTimestampToMMDYY(timestamp) {
  let date = new Date(timestamp);
  const minutesOffset = (new Date()).getTimezoneOffset();
  date.setMinutes(date.getMinutes() + minutesOffset);
  let mm = date.getMonth() + 1;
  mm = (mm < 10) ? "0" + mm : mm.toString();
  let d = date.getDate().toString();
  let yy = date.getFullYear().toString().substring(2);
  return `${mm}/${d}/${yy}`;
}

function now() {
  return (new Date()).getTime();
}

function getQuarter(timestamp) {
  let d = new Date(timestamp);
  if (d.getMonth() < 3) {
    return "Q1";
  }
  if (d.getMonth() < 6) {
    return "Q2";
  }
  if (d.getMonth() < 9) {
    return "Q3";
  }
  return "Q4";
}

function buildUrl(url, params) {
  let queryParams = "";
  for (let key in params) {
    queryParams += `${key}=${encodeURIComponent(params[key])}&`;
  }
  return `${url}?${queryParams}`;
}

module.exports = {
  dateFormat: dateFormat,
  now: now,
  convertTimestampToMMDYY: convertTimestampToMMDYY,
  getQuarter: getQuarter,
  buildUrl: buildUrl
};