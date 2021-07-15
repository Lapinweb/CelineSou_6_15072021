const fs = require('fs');
const validator = require('validator');

const Sauce = require('../models/sauce');

exports.getAllSauces = (req, res, next) => {
    //Récupère toutes les sauces
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
    //Récupère une sauce en cherchant celle avec le bon id
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);  //récupère le corps de la réponse convertie en JS

    //Vérifie les valeurs entrées
    const validateName = validator.isAlphanumeric(sauceObject.name, 'fr-FR', {ignore: ' -'});
    const validateManufacturer = validator.isAlphanumeric(sauceObject.manufacturer, 'fr-FR', {ignore: ' -'});
    const validateMainPepper = validator.isAlphanumeric(sauceObject.manufacturer, 'fr-FR', {ignore: ' -'});
    
    if (!validateName || !validateManufacturer || !validateMainPepper) {
        return res.status(400).json({ error: 'Champ invalide, seuls les lettres, les chiffres, les espaces et les tirets sont acceptés !' })
    }

    //Crée un nouvel objet avec les valeurs du corps de la réponse
    const sauce = new Sauce({
        ...sauceObject,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: [],
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });

    //Enregistre le nouvel objet
    sauce.save()
        .then( () => res.status(201).json({ message: 'Sauce enregistrée !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.modifySauce = (req, res, next) => {
    //Vérifie si l'image a été modifiée
    const sauceObject = req.file ?
    {
        ...JSON.parse(req.body.sauce),   //si oui, récupère l'objet sauce dans la requête et modifie l'URL de l'image
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body};   //si non, on récupère juste le corps de la requête
    
    //Vérifie les valeurs entrées
    const validateName = validator.isAlphanumeric(sauceObject.name, 'fr-FR', {ignore: ' -'});
    const validateManufacturer = validator.isAlphanumeric(sauceObject.manufacturer, 'fr-FR', {ignore: ' -'});
    const validateMainPepper = validator.isAlphanumeric(sauceObject.manufacturer, 'fr-FR', {ignore: ' -'});
    
    if (!validateName || !validateManufacturer || !validateMainPepper) {
        return res.status(400).json({ error: 'Champ invalide, seuls les lettres, les chiffres, les espaces et les tirets sont acceptés !' })
    }

    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce modifiée !'}))
        .catch(error => res.status(400).json({ error })); 
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id }) //cherche la sauce et supprime son image du dossier 'images'
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1]; //enlève une partie de l'URL pour avoir juste le nom du fichier
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id }) //supprime l'objet après avoir supprimé son image
                    .then(() => res.status(200).json({ message: 'Sauce supprimée !'}))
                    .catch(error => res.status(400).json({ error }));                
            });
        })
        .catch(error => res.status(500).json({ error }));
};

exports.likeSauce = (req, res, next) => {
    try{
        Sauce.findOne({ _id: req.params.id }) //récupère l'objet correspondant à l'id
            .then(sauce => {
                const usersLiked = sauce.usersLiked;
                const usersDisliked = sauce.usersDisliked;

                //si un like est ajouté et qu'il n'était pas déjà ajouté
                if (req.body.like === 1 && !usersLiked.includes(req.body.userId)) {
                    Sauce.updateOne(
                        { _id: req.params.id },
                        {
                            _id: req.params.id,
                            $inc: { likes: 1 },  //modifie la valeur likes en ajoutant 1
                            $push: { usersLiked: req.body.userId } //ajoute l'userId au tableau usersLiked
                        }
                    )
                    .then(() => res.status(200).json({ message: 'Like ajoutée !'}))
                    .catch(error => res.status(400).json({ error }));
                };

                //si like = 1 alors que l'utilisateur a déjà mis un like
                if (req.body.like === 1 && usersLiked.includes(req.body.userId)) {
                    throw 'Like déjà ajouté !'; //génére une exception
                };



                //si un dislike est ajouté et qu'il n'était pas déjà ajouté
                if (req.body.like === -1 && !usersDisliked.includes(req.body.userId)) {  
                    Sauce.updateOne(
                        { _id: req.params.id },
                        {
                            _id: req.params.id,
                            $inc: { dislikes: 1 },  //modifie la valeur dislikes en ajoutant 1
                            $push: { usersDisliked: req.body.userId } //ajoute l'userId au tableau usersDisliked
                        }
                    )
                    .then(() => res.status(200).json({ message: 'Dislike ajoutée !'}))
                    .catch(error => res.status(400).json({ error }));
                };

                //si like = -1 alors que l'utilisateur a déjà mis un dislike
                if (req.body.like === -1 && usersDisliked.includes(req.body.userId)) {
                    throw 'Dislike déjà ajouté !'; //génére une exception
                };



                if (req.body.like === 0) { //si un like ou dislike est enlevé
                            //si userId est présent dans le tableau usersLiked
                            if (usersLiked.includes(req.body.userId)) {
                                Sauce.updateOne(
                                    { _id: req.params.id },
                                    {
                                        _id: req.params.id,
                                        $inc: { likes: -1 },
                                        $pull: { usersLiked: req.body.userId }
                                    }
                                )
                                .then(() => res.status(200).json({ message: 'Like supprimé !'}))
                                .catch(error => res.status(400).json({ error }));
                            }

                            //si userId est présent dans le tableau usersDisliked
                            if (usersDisliked.includes(req.body.userId)) {
                                Sauce.updateOne(
                                    { _id: req.params.id },
                                    {
                                        _id: req.params.id,
                                        $inc: { dislikes: -1 },
                                        $pull: { usersDisliked: req.body.userId }
                                    }
                                )
                                .then(() => res.status(200).json({ message: 'Dislike supprimé !'}))
                                .catch(error => res.status(400).json({ error }));
                            }

                            //si userId n'est pas présent dans les deux tableaux
                            if (!usersLiked.includes(req.body.userId) && !usersDisliked.includes(req.body.userId)) {
                                throw 'Impossible de supprimer un like ou dislike inexistant !';
                            }
                };
        });        
    } catch {
        res.status(400).json({
            error: new Error('Requête invalide !')
        });
    }

    
}