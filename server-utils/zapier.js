const axios = require("axios");
const Pageres = require("pageres");
const cloudinary = require("cloudinary");

let creds;

if (process.env.NODE_ENV === "prod") {
  creds = process.env;
} else {
  creds = require("../credentials");
}

const URL = {
  addConferenceToSheet: "https://hooks.zapier.com/hooks/catch/3069472/w12ikq/",
  createSLK: "https://hooks.zapier.com/hooks/catch/3069472/w14rak/",
  sendSlackMessage: "https://hooks.zapier.com/hooks/catch/3069472/kiv6sa/",
  addToEvangelistCalendar: "https://hooks.zapier.com/hooks/catch/3069472/ks3xs7/"
};

function buildUrl(url, params) {
  let queryParams = "";
  for (let key in params) {
    queryParams += `${key}=${params[key]}&`;
  }
  return `${url}?${queryParams}`;
}

Zapier = {
  approved: (data) => {
    let promiseArray = [
      Zapier.addConferenceToSheet(data),
      Zapier.createSLK(data),
      Zapier.sendSlackMessage(data),
      Zapier.addToEvangelistCalendar(data)
    ];

    Promise.all(promiseArray).then(data => {
      console.log("Done with Zapier");
    });
  },
  addConferenceToSheet: (data) => {
    let url = buildUrl(URL.addConferenceToSheet, data);
    return axios.get(url).catch(err => {
      console.log("Error adding to sheet", err);
    });
  },
  createSLK: (data) => {
    // Get Screenshot
    let pageres = new Pageres({delay: 0})
      .src(data.website, ['iphone 5s'], {crop: true})
      .dest(__dirname + "/tmp")
      .run();
    return pageres.then(data => {
      //Upload to cloudinary
      cloudinary.config({
        cloud_name: creds.CLOUDINARY.CLOUD_NAME,
        api_key: creds.CLOUDINARY.API_KEY,
        api_secret: creds.CLOUDINARY.API_SECRET
      });

      return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload(__dirname + "/tmp/" + data[0].filename, function(err, result) {
          if (err) return reject(err);
          resolve(result);
        });
      });
    }).then(result => {
      // Add image URL
      data.image = result.secure_url;
    }).then(() => {
      let url = buildUrl(URL.createSLK, data);
      return axios.get(url);
    }).catch(err => {
      console.log("Error creating SLK", err);
    });
  },
  sendSlackMessage: (data) => {
    let url = buildUrl(URL.sendSlackMessage, data);
    return axios.get(url).catch(err => {
      console.log("Error sending message on Slack", err);
    });
  },
  addToEvangelistCalendar: (data) => {
    let url = buildUrl(URL.addToEvangelistCalendar, data);
    return axios.get(url).catch(err => {
      console.log("Error adding to calendar", err);
    });
  }
};

module.exports = Zapier;