var dotenv = require("dotenv"),
	dotenv.load(),
	http = require("http"),
    util = require("util"),
    beep = require("beepbeep"),
    PushBullet = require("pushbullet"),
    pusher = new PushBullet(process.env.pushbulletkey),
	cron = require("cron");


// setup pushbullet devices
var pushOptions = {
    limit: 2
};

var currentIden = "";
var alertSent = false;
var testWorked = false;

pusher.me(function(err, response) {
    currentIden = response["iden"];
});

var otherDevices = [];

pusher.devices(pushOptions, function(err, response) {
    for (var i in response["devices"]) {
        if (response["devices"][i]["iden"] === currentIden) {

        } else {
            otherDevices.push(response["devices"][i]["iden"]);
            util.log(response["devices"][i]["iden"]);
        }
    }
});

var sendAlert = function sendAlert(flag, devices, extra) {
	var params = extra || null;
    for (var device of devices) {
        if (flag === 1) {
            pusher.note(device, "PATCH ALERT", "yo the patch notes are probably out", function(err, response) {
                // callback, should probably error check or some shit YOLO...

                //if (err === 200) {
                //    alertSent = true;
                //}

            });
            alertSent = true;
        } else if (flag === 2) {
            pusher.note(device, "Logging Alert", "Patch Note Updates are now streaming to this device.", function(err, response) {
                // callback, should probably error check or some shit YOLO...
                //figure this shit out later I guess
                //if (err === 200) {
                //    testWorked = true;
                //}
            });
            testWorked = true;
        } else if (flag === 3) {
            pusher.note(device, "Something Happened...", "Bot might have been klined or something. Response code: " + params.responseCode, function(err, response) {
                // callback, should probably error check or some shit YOLO...
                //figure this shit out later I guess
                //if (err === 200) {
                //    testWorked = true;
                //}
            });
        }
    }
};

var options = {
    host: "www.dota2.com",
    port: 80,
    path: "/685"
};

var cronJob = cron.job("*/15 * * * * *", function() {
    // perform operation e.g. GET request http.get() etc.
    http.get(options, function(res) {
        if (res.statusCode === 302) {
            util.log("Got response: " + res.statusCode + "\n\t\t- No patch notes yet...")

            if (!testWorked) {
                sendAlert(2, otherDevices);
            }
        } else if (res.statusCode === 200) {
            beep(10);

            if (!alertSent) {
                sendAlert(1, otherDevices);
            }

            util.log("MOTHER FUCKING PATCH HYPE!\n\n");

            util.log("Dumping HTML Below\n\n\n:");

            res.on("data", function(chunk) {
                console.log(chunk);
            });
            res.on("end", function() {
                console.log("No more data in response.")
            });

        } else {
            util.log("Unknown response from server: " + res.statusCode + "\n\n\n");

            sendAlert(3, otherDevices, {responseCode: res.statusCode});

            res.on("data", function(chunk) {
                console.log(chunk);
            });
            res.on("end", function() {
                console.log("No more data in response.")
            });
        }

    }).on("error", function(e) {
        console.log("Got error: " + e.message);
    });
});

cronJob.start();
