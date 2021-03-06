var axios = require("axios");
let equihubAPI = require("./equihubAPI.js");
var _networkHashAVG = 0;

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});

function calculateAverages(data, callback) {
  if (_networkHashAVG == 0) {
    console.log("Needed Nethash AVG Exiting....");
    return;
  }
  var immatureEarned = data.immature;
  const firstWorker = Object.keys(data.workers)[0];

  const sampleWindow =
    (data.history[firstWorker][data.history[firstWorker].length - 1].time - data.history[firstWorker][0].time) / 3600;

  if (sampleWindow < 1) {
    console.log("I want at least 1 hour of data; 3+ is preferred -- exiting...");
    process.exit();
  }

  var workerHashAVG = 0;
  Object.keys(data.workers).forEach(worker => {
    var workersHash = 0;
    data.history[worker].forEach(sample => {
      workersHash += parseInt(sample.hashrate);
    });
    workerHashAVG = workerHashAVG + (workersHash * 2) / data.history[worker].length / 1000000;
  });

  const expectedEarnings = (workerHashAVG / _networkHashAVG) * (6912 * (sampleWindow / 24));

  console.log(" Total Workers:", Object.keys(data.workers).length);
  console.log("---------------------------------------------------------------------");
  console.log("-- RAPTOR 2 MINER: ", data.miner, " --");
  console.log("---------------------------------------------------------------------");
  console.log("   Sample Window:", sampleWindow, "hours");
  console.log("     Nethash AVG:", _networkHashAVG, "sols");
  console.log("  Miner Hash AVG:", workerHashAVG, "sols");
  console.log("Estimated Earned:", expectedEarnings, "VDL");

  callback(expectedEarnings, immatureEarned, sampleWindow, data.miner);
}

function determinePaidOut(data, expected, immatureEarned, sampleWindow, workerAddress) {
  var totalPaid = 0;
  data.forEach(coin => {
    if (coin.name == "vidulum") {
      var d = new Date();
      var n = d.getTime();
      //We subtract 1.6 hours from sample window time to account for immature block rewards still pending
      // confirmations and not yet paid out
      var sampleWinMS = (sampleWindow - 1.6) * 60 * 60 * 1000;
      coin.payments.forEach(payment => {
        if (payment.time > n - sampleWinMS) {
          //If time is in the sample window
          Object.keys(payment.amounts).forEach(address => {
            if (address == workerAddress) {
              totalPaid = totalPaid + payment.amounts[address];
            }
          });
        }
      });
    }
  });

  console.log("  Paid + Pending:", totalPaid + immatureEarned, "VDL");
  // console.log("    Earned Paid:", totalPaid, "VDL");
  console.log("Estimate/Reality:", (((totalPaid + immatureEarned) / expected) * 100).toFixed(2) + "%");
  console.log("---------------------------------------------------------------------");
}

axios
  .get("http://vdl2.raptorpool.org/api/stats")
  .then(response => {
    // console.log(Object.keys(response.data.pools.vidulum.workers));
    var currentMiners = [];
    Object.keys(response.data.pools.vidulum.workers).forEach(worker => {
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

    readline.question(`Select Miner: `, selection => {
      // console.log(`Selection: ${selection}!`);
      run(currentMiners[`${selection}`]);
      readline.close();
    });
  })
  .catch(error => {
    console.log(error);
  });

function run(minersAddress) {
  axios
    .get("https://vdl.equihub.pro/api/network_stats")
    .then(response => {
      // console.log(response.data);
      _networkHashAVG = equihubAPI.equihubNetworkData(response.data);
    })
    .catch(error => {
      console.log(error);
    });

  axios
    .get("http://vdl2.raptorpool.org/api/worker_stats?" + minersAddress)
    .then(response => {
      // console.log(response.data[0].pools.vidulum);
      setTimeout(function() {
        calculateAverages(response.data, function(expected, immatureEarned, sampleWindow, workerAddress) {
          axios
            .get("http://vdl2.raptorpool.org/api/payments")
            .then(response => {
              // console.log(response.data[0].pools.vidulum);
              determinePaidOut(response.data, expected, immatureEarned, sampleWindow, workerAddress);
            })
            .catch(error => {
              console.log(error);
            });
        });
      }, 3000);
    })
    .catch(error => {
      console.log(error);
    });
}
