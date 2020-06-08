var axios = require("axios");
let equihubAPI = require("./equihubAPI.js");
var _networkHashAVG = 0;

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

function calculateAverages(data, callback) {
  if (_networkHashAVG == 0) {
    console.log("Needed Nethash AVG Exiting....");
    return;
  }
  var immatureEarned = data.immature;
  // console.log("immatureEarned", immatureEarned);

  const sampleWindow =
    (data.history[data.history.length - 1].t - data.history[0].t) / 3600;

  var workerHashAVG = 0;
  var workersHash = 0;
  data.history.forEach((sample) => {
    workersHash += parseInt(sample.h);
  });

  workerHashAVG = workersHash / data.history.length;

  const expectedEarnings =
    (workerHashAVG / _networkHashAVG) * (6912 * (sampleWindow / 24));

  console.log(
    "---------------------------------------------------------------------"
  );
  console.log("-- EQUIHUB MINER: ", data.miner, " --");
  console.log(
    "---------------------------------------------------------------------"
  );
  console.log("   Sample Window:", sampleWindow, "hours");
  console.log("     Nethash AVG:", _networkHashAVG, "sols");
  console.log("  Miner Hash AVG:", workerHashAVG, "sols");
  console.log("Estimated Earned:", expectedEarnings, "VDL");

  callback(expectedEarnings, immatureEarned, sampleWindow, data.miner);
}

function determinePaidOut(
  data,
  expected,
  immatureEarned,
  sampleWindow,
  workerAddress
) {
  var totalPaid = 0;
  var d = new Date();
  var n = d.getTime();
  //We subtract 1.6 hours from sample window time to account for immature block rewards still pending
  // confirmations and not yet paid out
  var sampleWinMS = (sampleWindow - 1.6) * 60 * 60 * 1000;
  data.payments.forEach((payment) => {
    if (payment.time > n - sampleWinMS) {
      //If time is in the sample window
      Object.keys(payment.amounts).forEach((address) => {
        if (address == workerAddress) {
          totalPaid = totalPaid + payment.amounts[address];
        }
      });
    }
  });

  console.log("  Paid + Pending:", totalPaid + immatureEarned, "VDL");
  console.log(
    "Estimate/Reality:",
    (((totalPaid + immatureEarned) / expected) * 100).toFixed(2) + "%"
  );
  console.log(
    "---------------------------------------------------------------------"
  );
}

axios
  .get("https://vdl.equihub.pro/api/stats")
  .then((response) => {
    // console.log(Object.keys(response.data.pools.vidulum.workers));
    var currentMiners = [];
    Object.keys(response.data.workers).forEach((worker) => {
      const m = worker.split(".")[0];
      if (currentMiners.indexOf(m) < 0) currentMiners.push(m);
    });

    for (var i = 0; i < currentMiners.length; i++) {
      console.log(i, ":", currentMiners[i]);
    }

    if (!currentMiners.length) {
      console.log("No VDL Miners Found - Exiting");
      process.exit();
    }

    readline.question(`Select Miner: `, (selection) => {
      // console.log(`Selection: ${selection}!`);
      run(currentMiners[`${selection}`]);
      readline.close();
    });
  })
  .catch((error) => {
    console.log(error);
  });

function run(minersAddress) {
  axios
    .get("https://vdl.equihub.pro/api/network_stats")
    .then((response) => {
      // console.log(response.data);
      _networkHashAVG = equihubAPI.equihubNetworkData(response.data);
    })
    .catch((error) => {
      console.log(error);
    });

  axios
    .get("https://vdl.equihub.pro/api/worker_stats?address=" + minersAddress)
    .then((response) => {
      // console.log(response.data[0].pools.vidulum);
      setTimeout(function () {
        calculateAverages(response.data, function (
          expected,
          immatureEarned,
          sampleWindow,
          workerAddress
        ) {
          axios
            .get("https://vdl.equihub.pro/api/payments")
            .then((response) => {
              // console.log(response.data[0].pools.vidulum);
              determinePaidOut(
                response.data,
                expected,
                immatureEarned,
                sampleWindow,
                workerAddress
              );
            })
            .catch((error) => {
              console.log(error);
            });
        });
      }, 3000);
    })
    .catch((error) => {
      console.log(error);
    });
}
