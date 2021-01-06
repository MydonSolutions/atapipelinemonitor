const express = require('express')
var fs = require('fs');
const {URLSearchParams} = require('url')

const app = express()
const port = 80
const host = 'localhost'

app.use(express.static('public'));

app.get("/", (req, res) => {
	res.sendFile("public/templates/main.html", {root: __dirname})
})

app.listen(port, host)