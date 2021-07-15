const mongoose = require('mongoose');
const { RateLimiterMongo } = require('rate-limiter-flexible');

const mongoConn = mongoose.connection;

//rate limiter du nombre de requêtes consécutives
const consecutiveRateLimiter = new RateLimiterMongo({
    storeClient : mongoConn,
    keyPrefix: 'login_fail_ip_consecutive',
    points: 5,  //limite à 5 requêtes
    duration: 60 * 60,  //la limite est actualisé après 1h
    blockDuration: 60 * 15,  //bloque pendant 15 min
});

//rate limiter du nombre de requêtes par jour
const slowRateLimiter = new RateLimiterMongo({
    storeClient : mongoConn,
    keyPrefix: 'login_fail_ip_per_day',
    points: 100, //limite à 100 requêtes
    duration: 60 * 60 * 24, //la limite est actualisé après 24h
    blockDuration: 60 * 60 * 24, //bloque pendant 24h
});

const rateLimiter = (req, res, next) => {
    const username = req.body.email;
    const ip = req.ip;
    slowRateLimiter.consume(`${username}_${ip}`) //soustrait 1 point
        .then(() => {
            consecutiveRateLimiter.consume(`${username}_${ip}`) //soustrait 1 point
                .then(() => {
                    next();
                })
                .catch(() => {
                    res.status(429).json({ error :'Trop de requêtes consécutives envoyées !' })
                });
        })
        .catch(() => {
            res.status(429).json({ error: 'Trop de requêtes envoyées dans la journée !' })
        });
};

module.exports = rateLimiter;