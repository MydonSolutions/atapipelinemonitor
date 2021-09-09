const express = require('express')
var fs = require('fs');
const {URLSearchParams} = require('url')

const redis = require("redis");
const client = redis.createClient(6379, 'redishost');

const app = express()
const port = 81
const host = '0.0.0.0'

let summary_keys = []
fs.readFile('summary_keys.txt', (err, data) => {
	if (err) throw err;
	summary_keys = data.toString().split("\n")
	console.log(summary_keys)
})

app.use(express.static('public'));

app.get("/", (req, res) => {
	res.sendFile("public/templates/main.html", {root: __dirname})
})

app.get("/node", (req, res) => {
	res.sendFile("public/templates/node.html", {root: __dirname})
})

app.get("/allkeys", (req, res) => {
	client.keys("*", function(err, reply) {
		res.send(reply)
	});
})

app.get("/basics", (req, res) => {
	var url = req.url.split("?")[1]
	urlParams = new URLSearchParams(url)

	let nodenum = urlParams.get("nodenum")
	let instancenum = urlParams.get("instancenum")
	let nodename = "hashpipe://seti-node" + nodenum + "/" + instancenum + "/status"
	client.hmget(nodename, summary_keys,
		function(err, reply){
			let keyvalues = {};
			for (let index = 0; index < summary_keys.length; index++) {
				keyvalues[summary_keys[index]] = reply[index] === null ? "null" : reply[index];
			}
			res.send(keyvalues)
		}
	);
})

app.get("/getall", (req, res) => {
	var url = req.url.split("?")[1]
	urlParams = new URLSearchParams(url)

	var nodenum = urlParams.get("nodenum")
	var instancenum = urlParams.get("instancenum")
	var nodename = "hashpipe://seti-node" + nodenum + "/" + instancenum + "/status"

	client.hgetall(nodename, function(err, reply){
		res.send(reply)
	})
})

app.get('/ping', (req, res) => {
        const ip = req.connection.remoteAddress;
        console.log("Ping at ", new Date(new Date().toUTCString()), " from ", ip)
        res.send('pong')
})

app.listen(port, host)
