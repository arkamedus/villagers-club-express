import * as express from 'express';
import {isAuthenticated} from "../util/Auth";
import {cleanUsername, encodeHTML, generatePageTitle, listToString, validateUsername} from "../util/Text";
import {ejsHelpers} from "../util/EJSHelpers";
import {db} from "../index";
import {User, userIslandHemisphereMap, userIslandNativeFruitMap} from "../schema/User";
import moment = require("moment");
import {ObjectID} from "../util/MongoDriver";
import {loadItemsFromDBUserList, UserList, UserLoadListsFromDB} from "../schema/UserList";
import {getVariantIdx} from "../util/ItemCatalog";

class UserController {

    constructor(app) {
        this.intializeRoutes(app);
    }

    public intializeRoutes(app) {
        app.get('/profile', isAuthenticated, this.getProfile);
        app.get('/user/:hash', this.getPublicProfile);
        app.get('/user/:hash/:list', this.getPublicProfile);
        app.post('/profile/update', isAuthenticated, this.updateProfile);
        app.post('/profile/create/list', isAuthenticated, this.createList);
    }

    getProfile = (request: express.Request, response: express.Response) => {

        let is_first_login = false;
        if (request.user.is_first_login) {
            is_first_login = true;
            request.user.is_first_login = false;
            db.update('user', {hash: request.user.hash}, {
                $set: {
                    is_first_login: false,
                    vc_last_login_date: moment().unix()
                }
            }).then((document: any) => {
                console.log('CLEAR FIRST LOGIN, UPDATED LAST LOGIN TIME');
            }).catch(() => {
                console.log('COULD NOT CLEAR FIRST LOGIN');
            });
        }

        UserLoadListsFromDB(request.user).then(function (documents: Array<any>) {

            let lists = documents.map((list) => {
                list.items = loadItemsFromDBUserList(list);
                return list;
            });

            response.render('profile', {
                user: request.user, search: "",
                is_first_login: is_first_login,
                title: generatePageTitle('Profile'),
                canonical: false,
                noindex: true,
                lists: lists
            });
        });


    };


    updateProfile = (request: express.Request, response: express.Response) => {

        if (request.body.username) {

            let username = cleanUsername(request.body.username);
            if (validateUsername(username)) {

                if (!validateUsername(request.body.username)) {
                    request.flash('warning', "Your requested username contained invalid characters, it has been modified.");
                }

                if (username !== request.user.contact.username) {
                    request.flash('info', "Your username has been updated.");
                }

                request.user.contact.username = username;

                db.update('user', {hash: request.user.hash}, {$set: {"contact.username": request.user.contact.username}}).then((document: any) => {
                    console.log('SAVED', document.result);
                    response.redirect('/profile');
                }).catch(() => {
                    console.log('COULD NOT UPDATE USER DATA');
                    response.redirect('/profile');
                });

            } else {
                request.flash('error', "Your requested username was invalid.");
                response.redirect('/profile');
            }
        }

        if (request.body) {

            let changed = false;
            let changes = {};

            console.log(request.body);
            if (typeof request.body.discord === "string" && request.body.discord !== request.user.contact.discord) {
                let discord = cleanUsername(request.body.discord).slice(0, 120);
                if (validateUsername(discord) || discord == '') {
                    changes["contact.discord"] = discord;
                    changed = true;
                    request.user.contact.discord = discord;
                }
            }
            if (typeof request.body.twitter === "string" && request.body.twitter !== request.user.contact.twitter) {
                let twitter = cleanUsername(request.body.twitter).slice(0, 120);
                if (validateUsername(twitter) || twitter == '') {
                    changes["contact.twitter"] = twitter;
                    changed = true;
                    request.user.contact.twitter = twitter;
                }
            }
            if (typeof request.body.instagram === "string" && request.body.instagram !== request.user.contact.instagram) {
                let instagram = cleanUsername(request.body.instagram).slice(0, 120);
                if (validateUsername(instagram) || instagram == '') {
                    changes["contact.instagram"] = instagram;
                    changed = true;
                    request.user.contact.instagram = instagram;
                }
            }

    if (typeof request.body.character_name === "string" && request.body.character_name !== request.user.ac_character_name) {
                let character_name = cleanUsername(request.body.character_name).slice(0, 120);
                if (validateUsername(character_name) || character_name == '') {
                    changes["ac_character_name"] = character_name;
                    changed = true;
                    request.user.ac_character_name = character_name;
                }
            }

            if (typeof request.body.island_name === "string" && request.body.island_name !== request.user.ac_island_name) {
                let island_name = cleanUsername(request.body.island_name).slice(0, 120);
                if (validateUsername(island_name) || island_name == '') {
                    changes["ac_island_name"] = island_name;
                    changed = true;
                    request.user.ac_island_name = island_name;
                }
            }

            if (typeof request.body.island_native_fruit === "string" && request.body.island_native_fruit !== request.user.ac_island_native_fruit) {
                let native_fruit = request.body.island_native_fruit;
                if (userIslandNativeFruitMap[native_fruit] || native_fruit == '') {
                    changes["ac_island_native_fruit"] = native_fruit;
                    changed = true;
                    request.user.ac_island_native_fruit = native_fruit;
                }
            }

            if (typeof request.body.island_hemisphere === "string" && request.body.island_hemisphere !== request.user.ac_island_hemisphere) {
                let island_hemisphere = request.body.island_hemisphere;
                if (userIslandHemisphereMap[island_hemisphere] || island_hemisphere == '') {
                    changes["ac_island_hemisphere"] = island_hemisphere;
                    changed = true;
                    request.user.ac_island_hemisphere = island_hemisphere;
                }
            }


            if (changed) {
                console.log("CJHANGES");
                console.log(request.user);
                db.update('user', {hash: request.user.hash}, {$set: changes}).then((document: any) => {
                    request.flash('info', "Contact Info Updated");
                    response.redirect('/profile');
                }).catch(() => {
                    console.log('COULD NOT UPDATE USER DATA');
                    response.redirect('/profile');
                });
            } else {
                response.redirect('/profile');
            }

        }

    };

    createList = (request: express.Request, response: express.Response) => {
        if (request.body.list_name) {
            let list_name = cleanUsername(request.body.list_name);
            if (validateUsername(list_name)) {
                let list = new UserList(request.user._id, list_name);
                db.findOne('list', {"slug": list.slug, "owner": list.owner}).then(function (found) {
                    request.flash('error', "You already have a list with that name.");

                    response.redirect('/profile');
                }).catch(function () {
                    db.insertOne('list', list).then(function (document: any) {
                        request.flash('info', "Your list was created!");
                        response.redirect('/profile');
                    });
                });
            } else {
                request.flash('error', "List name was invalid.");
                response.redirect('/profile');
            }
        } else {
            response.redirect('/profile');
        }
    };

    getPublicProfile = (request: express.Request, response: express.Response, next) => {
        if (request.params.hash) {

            let hash = request.params.hash;
            db.findOne('user', {hash: hash}).then((user_document: User) => {

                if (request.params.list) {
                    db.findOne('list', {owner: user_document._id, slug: request.params.list}).then((list: UserList) => {

                        let meta_image;
                        let description;
                        let items = loadItemsFromDBUserList(list);
                        if (items.length) {

                            let items_list = [];
                            let vidx: any;
                            items.forEach(function (list_item) {
                                vidx = false;

                                if (list_item.type === "item") {
                                    vidx = getVariantIdx(list_item.item, list_item.variation);
                                }

                                if (!meta_image) {
                                    if (list_item.type === "item") {
                                        meta_image = list_item.variation ? list_item.item.variants[vidx].image || list_item.item.variants[vidx].critterpediaImage || list_item.item.variants[vidx].closetImage || list_item.item.variants[vidx].storageImage : list_item.item.image || list_item.item.critterpediaImage || list_item.item.closetImage || list_item.item.storageImage;
                                    } else if (list_item.type === "villager") {
                                        meta_image = list_item.item.image;//`https://villagers.club/assets/villagers/medium/${list_item.item.id}.png`;
                                    }
                                }

                                items_list.push((vidx && list_item.item.variants && list_item.item.variants.length ? "" + list_item.item.variants[vidx].name + " " : "") + list_item.item.name);
                            });

                            description = `${items_list.length} Items. ` + listToString(items_list);
                        }

                        response.render('public-list', {
                            user: request.user,
                            item: user_document,
                            list: list,
                            meta_image: `https://villagers.club/user/${user_document.hash}/${list.slug}/image.png`,
                            meta_url: `https://villagers.club/user/${user_document.hash}/${list.slug}`,
                            description: description,
                            items: items,
                            search: "",
                            title: generatePageTitle(`${user_document.contact.username}'s List: ${list.name}`),
                            canonical: false,
                            noindex: true
                        });

                    }).catch(() => {
                        console.log('NO LIST MATCHED');
                        next();
                    });

                } else {
                    UserLoadListsFromDB(user_document).then(function (documents: Array<any>) {

                        let lists = documents.map((list) => {
                            list.items = loadItemsFromDBUserList(list);
                            return list;
                        });

                        response.render('public-profile', {
                            user: request.user,
                            item: user_document,
                            lists: (lists),
                            search: "",
                            title: generatePageTitle(`Profile of ${user_document.contact.username}`),
                            canonical: false,
                            noindex: true
                        });
                    });
                }

            }).catch(() => {
                next();
            });
        } else {
            console.log("NO HASH");
            next();
        }
    };


}

export default UserController;
