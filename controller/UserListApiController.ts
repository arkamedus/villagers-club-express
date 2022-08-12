import * as express from 'express';
import {isAuthenticated} from "../util/Auth";
import {cleanUsername, generatePageTitle, slugify, validateUsername} from "../util/Text";
import {ejsHelpers} from "../util/EJSHelpers";
import {db, itemCatalog, villagerCatalog} from "../index";
import {
    loadItemsFromDBUserList,
    UserList, userListContains,
    UserListItem,
    UserListItemInterface,
    UserLoadListsFromDB
} from "../schema/UserList";


const MAX_LIST_SIZE = 500;

class UserListApiController {

    constructor(app) {
        this.intializeRoutes(app);
    }

    public intializeRoutes(app) {
        app.post('/api/list/create', isAuthenticated, this.createList);
        app.post('/api/list/delete', isAuthenticated, this.removeList);
        app.post('/api/list/get', isAuthenticated, this.getLists);
        app.post('/api/list/toggle', isAuthenticated, this.toggleItemInList);
        app.post('/api/list/rename', isAuthenticated, this.renameList);
        // app.post('/api/list/create', isAuthenticated, this.createList);
        //app.post('/api/list/remove', isAuthenticated, this.createList);
    }


    createList = (request: express.Request, response: express.Response, next) => {
        if (request.body.list_name) {
            db.find('list', {"owner": request.user._id}).then((found: any) => {

                if (found.length < 5 && validateUsername(cleanUsername(request.body.list_name))) {
                    let list_name = cleanUsername(request.body.list_name);
                    let list = new UserList(request.user._id, list_name);
                    db.findOne('list', {"slug": list.slug, "owner": list.owner}).then((found) => {
                        return this.getLists(request, response, next);
                    }).catch(() => {
                        db.insertOne('list', list).then((document: any) => {
                            return this.getLists(request, response, next);
                        });
                    });
                } else {
                    return this.getLists(request, response, next);
                }

            }).catch(() => {
                return this.getLists(request, response, next);
            });

        } else {
            return this.getLists(request, response, next);
        }
    };

    removeList = (request: express.Request, response: express.Response, next) => {
        if (request.body.list_slug) {
            db.deleteMany('list', {"slug": request.body.list_slug, "owner": request.user._id}).then((found) => {
                request.flash('info', "Your list was deleted.");
                response.redirect("/profile");
            });
        }
    };

    toggleItemInList = (request: express.Request, response: express.Response, next) => {
        let data = request.body;
        console.log(data);
        db.findOne('list', {"owner": request.user._id, "slug": data.list}).then((found: any) => {
            //console.log('got list', found);
            if (!data.item_type || data.item_type === "item") {
                let item = itemCatalog.getItemById(data.item_id);
                if (item) {

                    let listItem: UserListItemInterface = {
                        id: item.id,
                        variation: null,
                        amount: 1,
                        type: "item"
                    };

                    if (item.variants) {
                        item.variants.forEach(function (variation) {
                            if (variation.id === data.item_variation) {
                                listItem.variation = data.item_variation;
                            }
                        });
                    }

                    let contains = userListContains(found, listItem);
                    if (contains !== -1) { // remove from list
                        found.items.splice(contains, 1);
                    } else { //add to list
                        found.items.push(listItem);
                    }

                    if (found.items.length < MAX_LIST_SIZE) {
                        db.updateOne('list', {
                            "owner": request.user._id,
                            "slug": found.slug
                        }, {$set: found}).then((document: any) => {
                            return this.getLists(request, response, next);
                        }).catch((err) => {
                            console.log(err, 'FUCK')
                        });
                    } else {
                        return this.getLists(request, response, next);
                    }


                }
            } else if (data.item_type === "villager") {
                console.log('WHAT...');
                let villager = villagerCatalog.getVillagerById(data.item_id);
                if (villager) {

                    let listItem: UserListItemInterface = {
                        id: villager.id,
                        variation: null,
                        amount: 1,
                        type: "villager"
                    };

                    let contains = userListContains(found, listItem);
                    if (contains !== -1) { // remove from list
                        found.items.splice(contains, 1);
                    } else { //add to list
                        found.items.push(listItem);
                    }

                    if (found.items.length < MAX_LIST_SIZE) {
                        db.updateOne('list', {
                            "owner": request.user._id,
                            "slug": found.slug
                        }, {$set: found}).then((document: any) => {
                            console.log('SAVED');
                            return this.getLists(request, response, next);
                        }).catch((err) => {
                            console.error(err, "ERR");
                        });
                    } else {
                        return this.getLists(request, response, next);
                    }
                } else {
                    console.log('NO VILLAGER');
                    return this.getLists(request, response, next);
                }


            } else {
                console.log('NO ITEM');
                return this.getLists(request, response, next);
            }


        }).catch(() => {
            return this.getLists(request, response, next);
        });
    };

    getLists = (request: express.Request, response: express.Response, next) => {
        db.find('list', {"owner": request.user._id}).then(function (found) {
            response.send(JSON.stringify(found));
        }).catch(function () {
            response.send('[]')
        });
    };

    renameList = (request: express.Request, response: express.Response, next) => {

        let new_list_name = cleanUsername(request.body.list_name);
        if (validateUsername(new_list_name)) {

            let old_list_slug = slugify(request.body.list_slug);
            let new_list_slug = slugify(new_list_name, true);

            db.update('list', {
                "owner": request.user._id,
                "slug": request.body.list_slug
            }, {$set: {"name": new_list_name, "slug": new_list_slug}}).then((document: any) => {
                console.log('SAVED', document.result);
                response.redirect('/user/' + request.user.hash + "/" + new_list_slug);
            }).catch(() => {
                response.redirect('/user/' + request.user.hash + "/" + old_list_slug);
            });

        } else {
            console.log('BAD NAME', new_list_name);
            response.redirect('/user/' + request.user.hash + "/" + request.body.list_slug);
        }

    };

}

export default UserListApiController;