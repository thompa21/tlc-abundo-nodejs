var appath = "./";
require('dotenv').config({path: appath + '.env'});
const cron = require('node-cron');
var fs = require('fs');

const nodeMailer = require('nodemailer');
let transporter = nodeMailer.createTransport({
    host: 'send.one.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
    }
});
let mailOptions = {
    from: '"No Reply" <noreply@tlcgolfit.se>', // sender address
    to: "thomas.lind@tlcgolfit.se", // list of receivers
    subject: "Abundo", // Subject line
    text: "", // plain text body
    html: "" // html body
};

const axios = require('axios');

var mysql = require('mysql')
//DB Connect
/*
var con = mysql.createConnection({
    host: "hyper-v1.lib.kth.se",
    port: "3306",
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
  });
  
  con.connect(function(error) {
      if (error) {
          currentdate = new Date();
          fs.appendFile(appath + 'harvest.log', addZero(currentdate.getHours()) + ":" + addZero(currentdate.getMinutes()) + ":" + addZero(currentdate.getSeconds()) + " Harvest, Connection error: \n" + error, function (err) {
              if (err) throw err;
          });
          //throw error;
      }
  });

*/




function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function checkabundo(abundoendpoint) {
	axios.get(abundoendpoint)
		.then(abundores => {
            
			for (var key in abundores.data.events) {
                var send = true;
                var currentdate = new Date();
                currentdate.setTime(currentdate.getTime()-8*60*60*1000);
                var updatedate = new Date(abundores.data.events[key].updated_at);
                if(updatedate > currentdate){
                    console.log("Nytt event");
                    //console.log(abundores.data.events[key].name);
                    //console.log(updatedate);
                    var remindedevents;
                    filedata = fs.readFileSync('abundo.json', 'utf8');
                    remindedevents = JSON.parse(filedata); //now it an object
                    //console.log ("remindedevents: " + remindedevents.remindedevents);
                    for (var jsonindex in remindedevents.remindedevents) {
                        //console.log (remindedevents.remindedevents[jsonindex].id + " == "  + abundores.data.events[key].id);
                        if (remindedevents.remindedevents[jsonindex].id == abundores.data.events[key].id) {
                            send = false;
                            console.log("ID Match!");
                        }
                    }
                    if (send) {
                        console.log("reminder sent!");
                        remindedevents.remindedevents.push({id: abundores.data.events[key].id, remindersent:true}); //add some data
                        json = JSON.stringify(remindedevents); //convert it back to json
                        fs.writeFileSync('abundo.json', json, 'utf8'); // write it back 
                        mailOptions.text = abundores.data.events[key].name;
                        mailOptions.html = "<p>" + abundores.data.events[key].name + "</p>";
                        /*transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                return console.log(error);
                            }
                            console.log('Message %s sent: %s', info.messageId, info.response);
                            res.render('index');
                        });*/
                    }
                }
			}
		})
		.catch(error => {
			console.log("GoogleError: " + error);
		});
}

//Hämta eventuella argument (node abundo.js 2)
process.argv.forEach(function (val, index, array) {
	if(index == 2) {
	}
});

var abundoendpoint = "https://abundolive.se/api/v1/city_events/59a1f5c0a51e4120d6f8dc1b";

currentdate = new Date();
fs.appendFile(appath + 'abundo.log', addZero(currentdate.getHours()) + ":" + addZero(currentdate.getMinutes()) + ":" + addZero(currentdate.getSeconds()) + " Abundo started. \n", function (err) {
	if (err) throw err;
});


cron.schedule('*/5 * * * * *', () => {
    console.log('running a task every 30 sec');
    checkabundo(abundoendpoint);
  });
