require("dotenv").config()

const express = require("express")
const app = express()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { request } = require("express")
const mysql = require("mysql")
const res = require("express/lib/response")

app.use(express.json())

const users = [];

const contents = [
    {
        firstName: "Anugrah",
        content: "Ini adalah konten spesifik untuk user Anugrah"
    },
    {
        firstName: "Alvin",
        content: "Ini adalah konten spesifik untuk user Alvin"
    }
]

const db = mysql.createConnection ({
    user: "root",
    host: "localhost",
    password: "",
    database: "kalori_makanan"
})

// register
app.post("/register", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const user = {
            email: req.body.email,
            password: hashedPassword,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            birthDate: req.body.birthDate
        }
        users.push(user)
        res.status(200).send({
            "status": "sukses",
            "message": "Berhasil membuat akun"
        })
    } catch {
        res.status(500).send({
            "status": "error",
            "message": "Gagal membuat akun"
        })
    }
})

// list daftar user
app.get("/users", (req, res) => {
    res.json(users)
})

// login
app.post("/login", async (req, res) => {
    const user = users.find(user => user.email = req.body.email)
    if (user == null) {
        return res.status(404).send('Email tersebut tidak terdaftar')
    }
    try {
        if (await bcrypt.compare(req.body.password, user.password)) {
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
            res.status(200).send({
                "status": "sukses",
                "message": "Berhasil login",
                "accessToken": accessToken 
            })
        }
        else {
            res.status(403).send({
                "status": "error",
                "Message": "Password salah"
            })
        }
    } catch { 
        res.status(403).send({
            "status": "error",
            "message": "Terjadi error pada server"
        })
    }
    
})

// request content
app.get("/contents", authencticateToken, (req, res) => {
    res.json(contents.filter(content => content.firstName === req.user.firstName))
})

// hitung kalori
app.post("/kalori", (req,res) => {
    db.connect(function(err) {
        if (err) throw err;
        db.query("SELECT * FROM makanan", function (err, result, fields) {
          if (err) throw err;
    
          Object.keys(result).forEach(function(key) {
              var nilaiKalori = result[key];
              var kalori = {
                  nasi: req.body.nasi * nilaiKalori.nasi,
                  ayam: req.body.ayam * nilaiKalori.ayam,
                  tahu: req.body.tahu * nilaiKalori.tahu,
                  tempe: req.body.tempe * nilaiKalori.tempe,
              }
              const sumValues = obj => Object.values(obj).reduce((a, b) => a + b);
              const jumlahKalori = sumValues(kalori);
              res.send({
                  "jumlahKalori": jumlahKalori
              })
          });
        });
      });
})

// fungsi untuk memberi token login
function authencticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

app.listen(5000);