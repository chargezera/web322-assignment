const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const nodemailer = require("nodemailer");

const app=express();

const HTTP_PORT = process.env.PORT || 8080;

function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/registration", (req, res) => {
  res.sendFile(path.join(__dirname, "registration.html"));
});

app.get("/roomlisting", (req, res) => {
  res.sendFile(path.join(__dirname, "roomlisting.html"));
});

app.use(express.static(path.join(__dirname, "./")));

app.use(bodyParser.urlencoded({ extended: true }));

const transport = nodemailer.createTransport({
  host: "smtp.mail.yahoo.com",
  port: 587,
  secure: false, 
  service: 'yahoo',
  auth: {
      user: "book.aplace@yahoo.com", 
      pass: "wzjglsdenuzzbjxg"
  },
  logger: true
});

app.post("/log", async (req, res) => {
  console.log(req.body);
  const email = req.body["email"];
  const pass = req.body["password1"];
  if (req.body["email"] != "" && req.body["password1"] != "") {
    res.status(200).send(`Logged in ${req.body.email}`);
}else{
  res.status(500).send('Bad input. Please meet the criteria for login and try again.');
}
});

app.post("/reg", async (req, res) => {
  const emailReg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const capReg = /[A-Z]/;
  const digitReg = /\d/;
  const email = req.body["email"];
  const pass = req.body["password"];
  if (capReg.test(pass) && emailReg.test(email) && digitReg.test(pass) && pass.length >= 6 && pass.length <= 12 && req.body["birthday"] !== ""  && req.body["firstName"] !== "" && req.body["lastName"] !== "" ) {
    res.sendFile(path.join(__dirname, "dashboard.html"));
    let guestEmailInfo = await transport.sendMail({
      from: 'book.aplace@yahoo.com',
      to: email, 
      subject: "Book-a-Place registration success", 
      html: `<h1> WELCOME! </h1> <h2>Hey ${req.body.firstName} ${req.body.lastName}! We are glad that you registered to our booking website. Feel yourself comfortable.</h2><br><h4>Regards, Book-a-Place team</h4>`,
  });
}else{
  res.status(500).send('Bad input. Please meet the criteria for registration and try again.')
}
});


app.listen(HTTP_PORT, onHttpStart);
