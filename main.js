const express = require('express')
var fs = require('fs');
const {URLSearchParams} = require('url')

const redis = require("redis");
const client = redis.createClient(6379, 'localhost');

const app = express()
const port = 8082
const host = '0.0.0.0'

let summary_keys = []
let functional_keys = ["PKTIDX","PKTSTART","PKTSTOP"]

fs.readFile('summary_keys.txt', (err, data) => {
	if (err) throw err;
	summary_keys = data.toString().split("\n")
})

setInterval(function(){
	fs.readFile('summary_keys.txt', (err, data) => {
		if (err) throw err;
		summary_keys = data.toString().split("\n")
	})
}, 5000)

app.use(express.static('public'));

app.get("/", (req, res) => {
	res.sendFile("public/templates/main.html", {root: __dirname})
})

app.get("/node", (req, res) => {
	res.sendFile("public/templates/node.html", {root: __dirname})
})

app.get("/hashpipesummary", (req, res) => {
	var url = req.url.split("?")[1]
	urlParams = new URLSearchParams(url)

	let nodehostname = urlParams.get("nodehostname")
	let instancenum = urlParams.get("instancenum")
	let redishashname = "hashpipe://" + nodehostname + "/" + instancenum + "/status"

	client.hmget(redishashname, summary_keys.concat(functional_keys),
		function(err, reply){
			let keyvalues = {};
			for (let index = 0; index < summary_keys.length; index++) {
				keyvalues[summary_keys[index]] = reply[index] === null ? "null" : reply[index];
			}
			for (let index = 0; index < functional_keys.length; index++) {
				keyvalues["_"+functional_keys[index]] = reply[summary_keys.length + index] === null ? "null" : reply[summary_keys.length + index];
			}
			res.send(keyvalues)
		}
	);
})

app.get("/hashpipestatus", (req, res) => {
	var url = req.url.split("?")[1]
	urlParams = new URLSearchParams(url)

	var nodehostname = urlParams.get("nodehostname")
	var instancenum = urlParams.get("instancenum")
	var redishashname = "hashpipe://" + nodehostname + "/" + instancenum + "/status"

	client.hgetall(redishashname, function(err, reply){
		res.send(reply)
	})
})

app.get("/postprocstatus", (req, res) => {
	var url = req.url.split("?")[1]
	urlParams = new URLSearchParams(url)

	var nodehostname = urlParams.get("nodehostname")
	var instancenum = urlParams.get("instancenum")
	var redishashname = "postprocpype://" + nodehostname + "/" + instancenum + "/status"

	client.hgetall(redishashname, function(err, reply){
		if (err || reply == null) {
			reply = {POSTPROC: null}
		}

		reply_key_order = Object.keys(reply)
		if ('_DISPORD' in reply_key_order) {
			reply_key_order = reply['_DISPORD'].split(' ')
		}
		else {
			reply_key_order = reply_key_order.sort()
		}

		reply = reply_key_order.reduce(function (result, key) {
			result[key] = reply[key];
			return result;
		}, {});
		res.send(reply)
	})
})

app.get('/ping', (req, res) => {
        const ip = req.connection.remoteAddress;
        // console.log("Ping at ", new Date(new Date().toUTCString()), " from ", ip)
        res.send('pong')
})

app.listen(port, host)
