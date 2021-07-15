require('dotenv').config();

const cryptoJS = require('crypto-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const User = require('../models/user');

exports.signup = (req, res, next) => {
    if (!validator.isEmail(req.body.email)) {
        return res.status(400).json({ error: "L'e-mail est invalide !" })
    }

    if (!validator.isStrongPassword(req.body.password)) {
        return res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 lettres, avoir une minuscule, une majuscule, un chiffre et un symbole !' })
    }

    bcrypt.hash(req.body.password, 10) //crypte le mot de passe
        .then(hash => {
            //définie les paramètres pour le cryptage de l'email
            const key = cryptoJS.enc.Hex.parse(process.env.CRYPTO_KEY);
            const iv = cryptoJS.enc.Hex.parse(process.env.CRYPTO_IV);

            const user = new User({
                email: cryptoJS.AES.encrypt(req.body.email, key, {iv: iv}).toString(), //crypte l'email, bidirectionelle
                password: hash
            });

            user.save() //enregistre l'utilisateur dans la BDD
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
    //définie les paramètres pour le cryptage de l'email
    const key = cryptoJS.enc.Hex.parse(process.env.CRYPTO_KEY);
    const iv = cryptoJS.enc.Hex.parse(process.env.CRYPTO_IV);

    //recherche le user grâce à l'email de la requête qui est crypté
    User.findOne({ email: cryptoJS.AES.encrypt(req.body.email, key, {iv: iv}).toString() }) 
        .then(user => {

            if (!user) { //si le user n'existe pas
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }

            bcrypt.compare(req.body.password, user.password)  //on compare le mot de passe crypté
                .then(valid => {
                    if (!valid) {  //si le mot de passe est invalide
                        return res.status(401).json({ error: 'Mot de passe incorrecte !' })
                    }

                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(  //ajoute un token crypté
                            { userId: user._id },
                            process.env.TOKEN_KEY,
                            { expiresIn: '1h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};
