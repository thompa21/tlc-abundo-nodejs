var appath = "./";
require('dotenv').config({path: appath + '.env'});
const cron = require('node-cron');
var fs = require('fs');

const nodeMailer = require('nodemailer');
let transporter = nodeMailer.createTransport({
    host: 'send.one.com',
    port: 587,
    secure: false,
    //port: 465,
    //secure: true,
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
                //Kolla om det finns events med nyare datum än 8 timmar tillbaks
                if(updatedate > currentdate){
                    //Läs in id som redan har fått reminders skickade
                    var remindedevents;
                    filedata = fs.readFileSync('abundo.json', 'utf8');
                    remindedevents = JSON.parse(filedata);
                    for (var jsonindex in remindedevents.remindedevents) {
                        //om reminder redan skickats
                        if (remindedevents.remindedevents[jsonindex].id == abundores.data.events[key].id) {
                            send = false;
                        }
                    }
                    //Skicka endast om reminder inte redan skickats
                    if (send) {
                        //Spara att det skickats reminder på detta ID
                        remindedevents.remindedevents.push({id: abundores.data.events[key].id, remindersent:true});
                        json = JSON.stringify(remindedevents);
                        fs.writeFileSync('abundo.json', json, 'utf8');
                        //Skicka ut reminder(mail) 
                        mailOptions.text = abundores.data.events[key].name;
                        mailOptions.html = "<a href='https://abundolive.se/event/stockholm/" + abundores.data.events[key].slug + "'>" + abundores.data.events[key].name + "</a>" + 
                        "<img src='" + "https://cdn.abundolive.se/download/" + abundores.data.events[key].pictures[0] + "-size-500'>";
                        //console.log(mailOptions.text);
                        
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                currentdate = new Date();
                                fs.appendFile(appath + 'abundo.log', addZero(currentdate.getHours()) + ":" + addZero(currentdate.getMinutes()) + ":" + addZero(currentdate.getSeconds()) + " Abundo, error: " + error + "\n", function (err) {
                                    if (err) throw err;
                                });
                            } else {
                                currentdate = new Date();
                                fs.appendFile(appath + 'abundo.log', addZero(currentdate.getHours()) + ":" + addZero(currentdate.getMinutes()) + ":" + addZero(currentdate.getSeconds()) + " Abundo, message sent\n", function (err) {
                                    if (err) throw err;
                                });
                            }
                        });
                    
                    }
                }
			}
		})
		.catch(error => {
			currentdate = new Date();
            fs.appendFile(appath + 'abundo.log', addZero(currentdate.getHours()) + ":" + addZero(currentdate.getMinutes()) + ":" + addZero(currentdate.getSeconds()) + " Abundo, error: " + error + "\n", function (err) {
                if (err) throw err;
            });
		});
}

//Hämta eventuella argument (node abundo.js 2)
process.argv.forEach(function (val, index, array) {
	if(index == 2) {
	}
});

var abundoendpoint = "https://abundolive.se/api/v1/open_events/city/59a1f5c0a51e4120d6f8dc1b";
currentdate = new Date();
fs.appendFile(appath + 'abundo.log', addZero(currentdate.getFullYear())  + "-" + addZero(currentdate.getMonth() + 1)  + "-" + addZero(currentdate.getDate()) + " " + addZero(currentdate.getHours()) + ":" + addZero(currentdate.getMinutes()) + ":" + addZero(currentdate.getSeconds()) + " Abundo started. \n", function (err) {
	if (err) throw err;
});


cron.schedule('*/30 * * * * *', () => {
    currentdate = new Date();
    console.log(addZero(currentdate.getFullYear())  + "-" + addZero(currentdate.getMonth() + 1)  + "-" + addZero(currentdate.getDate()) + " " + addZero(currentdate.getHours()) + ":" + addZero(currentdate.getMinutes()) + ":" + addZero(currentdate.getSeconds()) + ' running a task every 30 sec');
    checkabundo(abundoendpoint);
});
