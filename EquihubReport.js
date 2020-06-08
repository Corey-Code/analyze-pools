var axios = require("axios");

function calculateAverages(data) {
  var netTotal = 0;
  var poolTotal = 0;
  var peakNethash = 0;
  var pocketNethash = 99999;
  const sampleWindow = data[data.length - 1].t - data[0].t;
  data.forEach((sample) => {
    // console.log(sample);
    netTotal += parseInt(sample.nh); //nethash per equihub pro node
    if (parseInt(sample.nh) > peakNethash) {
      peakNethash = parseInt(sample.nh);
    }
    if (parseInt(sample.nh) < pocketNethash) {
      pocketNethash = parseInt(sample.nh);
    }
    poolTotal += parseInt(sample.ph); //equihub pro pool hash
  });
  console.log("----- EQUIHUB.PRO SAMPLE WINDOW AVGS -----");
  console.log("  Sample Window:", sampleWindow / 3600, "hours");
  console.log("  Nethash AVG:", netTotal / data.length, "sols");
  console.log("  Pool Hash AVG:", poolTotal / data.length, "sols");
  console.log("  Pools Share:", poolTotal / netTotal, "%");
  console.log("  Blocks Share:", (poolTotal / netTotal) * 1440, "Blocks");
  console.log("-------------------------------------------");
  console.log("  Peak Nethash:", peakNethash, "sols");
  console.log("  Pocket Nethash:", pocketNethash, "sols");
  console.log("-------------------------------------------");
}

axios
  .get("https://vdl.equihub.pro/api/network_stats")
  .then((response) => {
    // console.log(response.data);
    calculateAverages(response.data);
  })
  .catch((error) => {
    console.log(error);
  });
