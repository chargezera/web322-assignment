const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const nodemailer = require("nodemailer");
const exphbs = require("express-handlebars");
const session = require('express-session');
const { User, Room } = require('./models');
const multer = require('multer')
const upload = multer({ dest: 'images/' })
const bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);
const app = express();


const HTTP_PORT = process.env.PORT || 8080;

function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}
app.engine(".hbs", exphbs({
  extname: ".hbs",
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
  }
}));
app.set("view engine", "hbs");

app.use(session({ secret: process.env.SECRET, cookie: { secure: false } }));

app.get("/", (req, res) => {
  const logged = req.session.logged;
  res.render('index.hbs', {
    layout: false,
    logged
  });
});

app.get("/registration", (req, res) => {
  const logged = req.session.logged;
  res.render('registration.hbs', {
    layout: false,
    logged
  })
});

app.get("/roomlisting", async (req, res) => {
  const logged = req.session.logged;
  const loc = await Room.findAll({})
  const gde = "All";
  const isAdmin = req.session.isAdmin;
  res.render('roomlisting.hbs', {
    layout: false,
    logged,
    loc,
    gde,
    isAdmin
  })
});

app.get("/login", (req, res) => {
  const logged = req.session.logged;
  res.render('login.hbs', {
    layout: false,
    logged
  })
});

app.get("/dashboard", (req, res) => {
  const logged = req.session.logged;
  const lastN = req.session.lastN;
  const firstN = req.session.firstN;
  const isAdmin = req.session.isAdmin;
  res.render('dashboard.hbs', {
    layout: false,
    logged,
    lastN,
    firstN,
    isAdmin
  })
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
  const email = req.body["email"];
  const pass = req.body["password1"];
  if (req.body["email"] != "" && req.body["password1"] != "") {
    const user = await User.findOne({ where: { email: email } });
    if (user != null) {
      const what = bcrypt.compareSync(pass, user.pass);
      if (what) {
        const firstN = user.fName;
        const lastN = user.lName;
        req.session.logged = true;
        req.session.firstN = firstN;
        req.session.lastN = lastN;
        const logged = req.session.logged;
        if (user.type == "Admin") {
          console.log('success');
          req.session.isAdmin = true;
          res.render('dashboard.hbs', {
            layout: false,
            isAdmin: true,
            logged,
            firstN,
            lastN,
          })
        } else {
          req.session.isAdmin = false;
          req.session.logged = true;
          const logged = req.session.logged;
          res.render('dashboard.hbs', {
            layout: false,
            isAdmin: false,
            logged,
            firstN,
            lastN
          })
        }
      } else {
        res.render('login.hbs', {
          layout: false,
          wrongLog: true
        })
      }
    } else {
      res.render('login.hbs', {
        layout: false,
        wrongLog: true
      })
    }
  } else {
    res.render('login.hbs', {
      layout: false,
      wrongLog: true
    })
  }
});

app.post("/reg", async (req, res) => {
  const emailReg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const capReg = /[A-Z]/;
  const digitReg = /\d/;
  const email = req.body["email"];
  const pass = req.body["password"];
  const exist = await User.findOne({ where: { email: email } });
  if (exist == null) {
    if (capReg.test(pass) && emailReg.test(email) && digitReg.test(pass) && pass.length >= 6 && pass.length <= 12 && req.body["birthday"] !== "" && req.body["firstName"] !== "" && req.body["lastName"] !== "") {
      const hash = bcrypt.hashSync(pass, salt);
      const firstN = req.body["firstName"];
      const lastN = req.body["lastName"];
      const uType = "User";
      User.create({
        type: uType,
        fName: firstN,
        lName: lastN,
        email,
        pass: hash
      })
      req.session.logged = true;
      req.session.firstN = firstN;
      req.session.lastN = lastN;
      const logged = req.session.logged;
      res.render('dashboard', {
        layout: false,
        firstN,
        lastN,
        logged
      });
      let guestEmailInfo = await transport.sendMail({
        from: 'book.aplace@yahoo.com',
        to: email,
        subject: "Book-a-Place registration success",
        html: `<h1> WELCOME! </h1> <h2>Hey ${req.body.firstName} ${req.body.lastName}! We are glad that you registered to our booking website. Feel yourself comfortable.</h2><br><h4>Regards, Book-a-Place team</h4>`,
      });
    } else {
      res.render('registration.hbs', {
        layout: false,
        falselog: true,
      })
    }
  } else {
    res.render('registration.hbs', {
      layout: false,
      exists: true,
    })
  }
});

app.get("/logout", async (req, res) => {
  req.session.destroy(function (err) {
    // cannot access session here
  });
  res.render('dashboard', {
    layout: false
  })
});

app.post("/search", async (req, res) => {
  const logged = req.session.logged;
  const gde = req.body["city1"];
  console.log(gde);
  const loc = await Room.findAll({ where: { location: gde } })
  res.render('roomlisting.hbs', {
    layout: false,
    logged,
    loc,
    gde
  })
});

app.post("/addlist", upload.single('listPhoto'), async (req, res, next) => {
  const title = req.body["rTitle"];
  const description = req.body["rDescription"];
  const location = req.body["city"];
  const price = req.body["rPrice"];
  console.log(title, description, location, price);
  const name = req.file.filename;
  Room.create({
    title,
    description,
    location,
    price,
    photoname: name
  })
  const logged = req.session.logged;
  const added = true;
  const firstN = req.session.firstN;
  const lastN = req.session.lastN;
  const isAdmin = true;
  res.render('dashboard.hbs', {
    layout: false,
    logged,
    firstN,
    lastN,
    added,
    isAdmin
  })
});

app.listen(HTTP_PORT, onHttpStart);
