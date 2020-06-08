function equihubNetworkData(data) {
  var netTotal = 0;
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
    // poolTotal += parseInt(sample.ph); //equihub pro pool hash
  });

  console.log(" ");
  console.log(" ");
  console.log("------- EQUIHUB.PRO API NETWORK DATA -------");
  console.log(" Sample Window:", sampleWindow / 3600, "hours");
  console.log("   Nethash AVG:", netTotal / data.length, "sols");
  console.log("   Max Nethash:", peakNethash, "sols");
  console.log("   Min Nethash:", pocketNethash, "sols");
  console.log("--------------------------------------------");
  console.log(" ");
  console.log(" ");

  return netTotal / data.length;
}

module.exports = {
  equihubNetworkData,
};
