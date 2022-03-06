require('dotenv').config()

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

app.use(express.json())

const users = []

const contents = [
    {
        username: 'Anugrah',
        content: 'Ini adalah konten spesifik untuk user Anugrah'
    },
    {
        username: 'Alvin',
        content: 'Ini adalah konten spesifik untuk user Alvin'
    }
]

app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const user = {
            name: req.body.name,
            birthDate: req.body.birthDate,
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            premium: req.body.premium
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

app.get('/users', (req, res) => {
    res.json(users)
})

app.post('/login', async (req, res) => {
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

app.get('/contents', authencticateToken, (req, res) => {
    res.json(contents.filter(content => content.username === req.user.username))
})

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

app.listen(3000)