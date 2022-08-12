import * as express from 'express';
import {db, ejs, itemCatalog, reactionCatalog, villagerCatalog} from "../index";
import {
    capitalizeWords, cleanUsername, encodeHTML,
    generatePageTitle,
    slugify, validateUsername
} from "../util/Text";
import {getVariantIdx} from "../util/ItemCatalog";
import {checkIncomingItem} from "../util/Items";
import {dynamicSearch} from "./SearchController";
import {isAuthenticated} from "../util/Auth";
import moment = require("moment");
import {loadItemsFromDBUserList, loadItemsFromUserTradeList} from "../schema/UserList";
import {readFileSync} from "fs";

const {v4: uuidv4} = require('uuid');


export const UserTradeOfferRequestStatus = {
    OPEN: 1, // NO INTERACTION
    ACCEPTED: 2, // CAN LEAVE FEEDBACK HERE
    CLOSED: 3, // CAN LEAVE FEEDBACK HERE
    DECLINED: 4 //DECLINED INTERACTION
};

export function generateUserTradeOfferRequest(hash, offer) {
    return new Promise((resolve, reject) => {

        db.findOne('trades', {hash: hash}).then((document: any) => {
            let trade_offer = new UserTradeOfferRequest(document.negotiable, offer);
            trade_offer.parent = document._id;
            resolve(trade_offer);
        }).catch((err) => {
            reject("No such existing Trade Request");
        });


    });
}


export class UserTradeReview {
    review_score: number;
    review_text: string;

    constructor() {

    }
}


export class UserTradeOfferRequest {
    parent;
    owner;
    offer;
    bells;
    is_touch_trade;
    notes;
    hash;
    created;
    open;
    status;
    negotiable;
    reviews: Array<UserTradeReview>;

    constructor(is_negotiable, offer) {
        //LOAD PARENT FROM DB
        this.negotiable = is_negotiable;
        this.open = true;
        this.hash = uuidv4();
        this.status = UserTradeOfferRequestStatus.OPEN;
        this.offer = [];
        this.created = moment().unix();

        if (!is_negotiable) {
            return;
        }

        offer.forEach((item) => {
            let check;
            if (item.type === 'item') {
                check = checkIncomingItem(item.id, item.variation);
            }
            if (item.type === 'villager') {
                check = villagerCatalog.getVillagerById(item.id);
            }
            if (check) {
                this.offer.push({
                    amount: Math.max(1, Math.min(parseInt(item.amount), 100000000)) || 1,
                    id: item.id,
                    variation: item.variation,
                    type: item.type
                });
            }
        });
    }
}

export class UserTradeOffer {
    offer;
    request;
    owner;
    created: number;
    open;
    bells;
    negotiable;
    is_touch_trade;
    notes;
    hash;
    type: string;
    review: UserTradeReview;

    constructor(type, offer, request) {
        this.is_touch_trade = false;
        this.hash = uuidv4();
        this.open = true;
        this.negotiable = false;
        this.created = moment().unix();
        this.type = type;

        this.offer = [];

        offer.forEach((item) => {
            let check;
            if (item.type === 'item') {
                check = checkIncomingItem(item.id, item.variation);
            }
            if (item.type === 'villager') {
                check = villagerCatalog.getVillagerById(item.id);
            }
            if (check) {
                this.offer.push({
                    amount: Math.max(1, Math.min(parseInt(item.amount), 100000000)) || 1,
                    id: item.id,
                    variation: item.variation,
                    type: item.type
                });
            }
        });

        this.request = [];

        request.forEach((item) => {
            let check;
            if (item.type === 'item') {
                check = checkIncomingItem(item.id, item.variation);
            }
            if (item.type === 'villager') {
                check = villagerCatalog.getVillagerById(item.id);
            }
            if (check) {
                this.request.push({
                    amount: Math.max(1, Math.min(parseInt(item.amount), 100000000)) || 1,
                    id: item.id,
                    variation: item.variation,
                    type: item.type
                });
            }
        });

    }
}


class TradesController {

    page_size;

    constructor(app) {
        this.intializeRoutes(app);
    }

    public intializeRoutes(app) {
        this.page_size = 4;
        app.get('/trades', this.getTrades);

        app.get('/trades/sell/:item?/:variation?', this.createOffer);
        app.get('/trades/buy/:item?/:variation?', this.findOffer);
        app.get('/trades/view/:hash', this.viewOffer);

        app.post('/trades/buy/:item?/:variation?', this.findOffer);
        app.post('/trades/api/search', this.dynamicSearch);
        app.post('/trades/api/offer', isAuthenticated, this.submitOffer);
        app.post('/trades/api/accept', isAuthenticated, this.acceptOffer);
        app.post('/trades/api/close', isAuthenticated, this.closeOffer);
        app.post('/trades/api/decline', isAuthenticated, this.declineOffer);
        app.post('/trades/api/cancel', isAuthenticated, this.cancelOffer);
        app.post('/trades/close', isAuthenticated, this.closeSellOffer);
        app.post('/trades/api/offer-request', isAuthenticated, this.submitOfferRequest);

    }

    closeSellOffer = (request: express.Request, response: express.Response, next) => {


        db.findOne('trades', {
            hash: request.body.hash,
            owner: request.user._id
        }).then((document: any) => {

            db.update('trades', {hash: document.hash}, {$set: {open: false}}).then((saved: any) => {
                response.redirect('/trades');
            });

        }).catch((err) => {
            response.redirect('/trades');
        });


    };

    submitOfferRequest = (request: express.Request, response: express.Response, next) => {

        if (request.body.hash) {

            generateUserTradeOfferRequest(request.body.hash, request.body.offer).then((incoming_offer: UserTradeOfferRequest) => {

                db.findOne('trade-request', {
                    parent: incoming_offer.parent,
                    owner: request.user._id
                }).then((document: any) => {

                    response.send(JSON.stringify({
                        status: 0,
                        message: "You already have a trade offer for this Request. Please cancel any existing."
                    }));
                    next();

                }).catch((err) => {

                    incoming_offer.owner = request.user._id;

                    if (incoming_offer.negotiable) {

                        if ((!request.body.bells) && (!request.body.offer || request.body.offer.length == 0)) {

                            response.send(JSON.stringify({
                                status: 0,
                                message: "This Requests Require an Offer"
                            }));
                            return next();

                        }

                        incoming_offer.offer = (incoming_offer.offer||[]).slice(0,100);

                        if (request.body.bells && typeof request.body.bells == "number") {
                            incoming_offer.bells = Math.abs(parseInt(request.body.bells)||0);
                        }
                        if (typeof request.body.is_touch_trade == "boolean") {
                            incoming_offer.is_touch_trade = !!(request.body.is_touch_trade || false);
                        }
                        if (typeof request.body.negotiable == "boolean") {
                            incoming_offer.negotiable = !!(request.body.negotiable || false);
                        }
                        if (typeof request.body.notes == "string") {
                            incoming_offer.notes = encodeHTML(request.body.notes.slice(0, 1000) || "");
                        }

                    } else {

                    }

                    db.insertOne('trade-request', incoming_offer).then((document: any) => {
                        response.send(JSON.stringify({
                            status: 1,
                            message: "Trade Offer Submitted"
                        }));
                    });


                });

            }).catch((reason) => {
                response.send(JSON.stringify({
                    status: 0,
                    message: reason || "Parent Trade could not be identified."
                }));
                next();
            });

        } else {
            response.send(JSON.stringify({
                status: 0,
                message: "Parent Trade could not be identified."
            }));

        }

    };

    submitOffer = (request: express.Request, response: express.Response, next) => {

        if (request.body.A && request.body.B /*&& (request.body.type == "buy"||request.body.type == "sell")*/) {


            let sell_offer = new UserTradeOffer("sell", request.body.A, request.body.B);

            if (request.body.bells && typeof request.body.bells == "number") {
                sell_offer.bells = Math.abs(parseInt(request.body.bells||0));
            }

            if (typeof request.body.touch == "boolean") {
                sell_offer.is_touch_trade = !!(request.body.touch || false);
            }

            if (typeof request.body.negotiable == "boolean") {
                sell_offer.negotiable = !!(request.body.negotiable || false);
            }

            if (typeof request.body.notes == "string") {
                sell_offer.notes = encodeHTML(request.body.notes.slice(0,1000) || "");
            }

            if (!sell_offer.bells && sell_offer.offer.length == 0) {
                response.send(JSON.stringify({
                    status: 0,
                    message: "Trades must include an offer or bells."
                }));
                return next();
            }

            console.log(sell_offer);

            sell_offer.offer = (sell_offer.offer||[]).slice(0,100);
            sell_offer.request = (sell_offer.request||[]).slice(0,100);


            if (sell_offer.offer.length >= 1) {
                sell_offer.owner = request.user._id;
                db.find('trades', {"owner": request.user._id, "open": true}).then((found: any) => {

                    if (found.length < 15) {
                        db.insertOne('trades', sell_offer).then((document: any) => {
                            response.send(JSON.stringify({
                                status: 1,
                                location: "/trades/view/" + sell_offer.hash
                            }));
                        });
                    } else {
                        console.log('TOO MANY OPEN TRADES');
                        response.send(JSON.stringify({
                            status: 0,
                            message: "You have reached your active open trades limit (15)."
                        }));
                    }

                }).catch(() => {
                    console.log('DATABASE FAILURE');
                    response.send(JSON.stringify({
                        status: 0
                    }));
                });
            } else {
                console.log('BAD TRADE');
                response.send(JSON.stringify({
                    status: 0,
                    message: "Trades must have at least one item in Selling."
                }));
            }

        } else {

        }

    };


    acceptOffer = (request: express.Request, response: express.Response, next) => {

        if (request.body.offer_hash && request.body.trade_hash) {

            let collection = db.getCollection('trades');

            collection.aggregate([
                {$match: {"hash": request.body.trade_hash, "owner": request.user._id}}
            ]).sort({"created": -1}).limit(20).toArray(function (err, documents) {

                if (err) {
                    documents = [];
                }
                if (documents.length === 0) {
                    return next();
                }

                let trade = documents[0];

                trade.owner = request.user;
                let collection_request = db.getCollection('trade-request');

                collection_request.aggregate([
                    {
                        $match: {
                            hash: request.body.offer_hash,
                            parent: trade._id,
                            status: UserTradeOfferRequestStatus.OPEN
                        }
                    },
                    {$lookup: {from: "user", localField: "owner", foreignField: "_id", as: "owner"}},
                    {$unwind: "$owner"}
                ]).sort({"created": -1}).limit(20).toArray(function (err, documents) {
                    if (err) {
                        documents = [];
                    }
                    if (documents.length === 0) {
                        return next();
                    }

                    let trade_offer = documents[0];

                    console.log(trade_offer);
                    db.update('trade-request', {hash: trade_offer.hash}, {$set: {status: UserTradeOfferRequestStatus.ACCEPTED}}).then((document: any) => {
                        trade_offer.status = UserTradeOfferRequestStatus.ACCEPTED;
                        ejs.renderFile('./view/trades/trade-request-accepted.ejs', {
                            user: request.user,
                            trade: trade,
                            offer: trade_offer
                        }, {}, function (err, str) {

                            response.send(JSON.stringify({
                                status: 1,
                                message: "Accepted Trade Offer",
                                html: str
                            }));
                        });

                    });

                });

            });


        }

    };


    declineOffer = (request: express.Request, response: express.Response, next) => {

        if (request.body.offer_hash && request.body.trade_hash) {

            let collection = db.getCollection('trades');

            collection.aggregate([
                {$match: {"hash": request.body.trade_hash, "owner": request.user._id}}
            ]).sort({"created": -1}).limit(20).toArray(function (err, documents) {

                if (err) {
                    documents = [];
                }
                if (documents.length === 0) {
                    return next();
                }

                let trade = documents[0];

                trade.owner = request.user;
                let collection_request = db.getCollection('trade-request');

                collection_request.aggregate([
                    {
                        $match: {
                            hash: request.body.offer_hash,
                            parent: trade._id,
                            status: UserTradeOfferRequestStatus.OPEN
                        }
                    },
                    {$lookup: {from: "user", localField: "owner", foreignField: "_id", as: "owner"}},
                    {$unwind: "$owner"}
                ]).sort({"created": -1}).limit(20).toArray(function (err, documents) {
                    if (err) {
                        documents = [];
                    }
                    if (documents.length === 0) {
                        return next();
                    }

                    let trade_offer = documents[0];

                    console.log(trade_offer);
                    db.update('trade-request', {hash: trade_offer.hash}, {$set: {status: UserTradeOfferRequestStatus.DECLINED}}).then((document: any) => {
                        trade_offer.status = UserTradeOfferRequestStatus.DECLINED;
                        ejs.renderFile('./view/trades/trade-request-accepted.ejs', {
                            user: request.user,
                            trade: trade,
                            offer: trade_offer
                        }, {}, function (err, str) {

                            response.send(JSON.stringify({
                                status: 1,
                                message: "Trade Offer Declined",
                                html: str
                            }));
                        });

                    });

                });

            });


        }

    };


    closeOffer = (request: express.Request, response: express.Response, next) => {

        if (request.body.offer_hash && request.body.trade_hash) {

            let collection = db.getCollection('trades');

            collection.aggregate([
                {$match: {"hash": request.body.trade_hash, "owner": request.user._id}}
            ]).sort({"created": -1}).limit(20).toArray(function (err, documents) {

                if (err) {
                    documents = [];
                }
                if (documents.length === 0) {
                    return next();
                }

                let trade = documents[0];

                trade.owner = request.user;
                let collection_request = db.getCollection('trade-request');

                collection_request.aggregate([
                    {
                        $match: {
                            hash: request.body.offer_hash,
                            parent: trade._id,
                            status: UserTradeOfferRequestStatus.ACCEPTED
                        }
                    },
                    {$lookup: {from: "user", localField: "owner", foreignField: "_id", as: "owner"}},
                    {$unwind: "$owner"}
                ]).sort({"created": -1}).limit(20).toArray(function (err, documents) {
                    if (err) {
                        documents = [];
                    }
                    if (documents.length === 0) {
                        return next();
                    }

                    let trade_offer = documents[0];

                    console.log(trade_offer);
                    db.update('trade-request', {hash: trade_offer.hash}, {$set: {status: UserTradeOfferRequestStatus.CLOSED}}).then((document: any) => {
                        trade_offer.status = UserTradeOfferRequestStatus.CLOSED;
                        ejs.renderFile('./view/trades/trade-request-accepted.ejs', {
                            user: request.user,
                            trade: trade,
                            offer: trade_offer
                        }, {}, function (err, str) {

                            response.send(JSON.stringify({
                                status: 1,
                                message: "Closed Trade Offer",
                                html: str
                            }));
                        });

                    });

                });

            });


        }

    };


    cancelOffer = (request: express.Request, response: express.Response, next) => {

        if (request.body.offer_hash && request.body.trade_hash) {

            let collection = db.getCollection('trades');

            collection.aggregate([
                {$match: {"hash": request.body.trade_hash}}
            ]).sort({"created": -1}).limit(20).toArray(function (err, documents) {

                if (err) {
                    documents = [];
                }
                if (documents.length === 0) {
                    return next();
                }

                let trade = documents[0];

                trade.owner = request.user;
                let collection_request = db.getCollection('trade-request');

                collection_request.aggregate([
                    {
                        $match: {
                            hash: request.body.offer_hash,
                            parent: trade._id,
                            status: {$lt: 3},
                            owner: request.user._id
                        }
                    },
                    {$lookup: {from: "user", localField: "owner", foreignField: "_id", as: "owner"}},
                    {$unwind: "$owner"}
                ]).sort({"created": -1}).limit(20).toArray(function (err, documents) {
                    if (err) {
                        documents = [];
                    }
                    if (documents.length === 0) {
                        return next();
                    }

                    let trade_offer = documents[0];

                    console.log(trade_offer);
                    db.update('trade-request', {hash: trade_offer.hash}, {$set: {status: UserTradeOfferRequestStatus.DECLINED}}).then((document: any) => {
                        trade_offer.status = UserTradeOfferRequestStatus.DECLINED;
                        ejs.renderFile('./view/trades/trade-request-accepted.ejs', {
                            user: request.user,
                            trade: trade,
                            offer: trade_offer
                        }, {}, function (err, str) {

                            response.send(JSON.stringify({
                                status: 1,
                                message: "Trade Offer Closed",
                                html: str
                            }));
                        });

                    });

                });

            });


        }

    };

    getTrades = (request: express.Request, response: express.Response, next) => {

        let title = "Trading Post";
        let header = "Trade Items and Villagers";

        let collection = db.getCollection('trades');

        if (!request.user) {
            response.render('trades/trades-index', {
                canonical: `/trades`,
                noindex: false,
                title: generatePageTitle(title),
                user: request.user,
                search: "",
                user_trades: [],
                user_sell_offers: [],
                user_ended: [],
                trades: [],
                header: header,
                pagination: '',
                category: '',
                groups: [],
                subcategories: []
            });
            return;
        }

        collection.aggregate([{
            $match: {
                "owner": request.user._id
            }
        },
            {$lookup: {from: "trade-request", localField: "_id", foreignField: "parent", as: "incoming_offers"}},
        ]).sort({"created": -1}).limit(20).toArray((user_err, user_sell_offers) => {

            user_sell_offers.forEach((list, idx) => {
                user_sell_offers[idx].offer_items = loadItemsFromUserTradeList(list.offer);
                user_sell_offers[idx].request_items = loadItemsFromUserTradeList(list.request);
                return user_sell_offers[idx];
            });

            let collection_request = db.getCollection('trade-request');

            collection_request.aggregate([
                {$match: {owner: request.user._id}}, //"open": true, view old trades disabled by adding that
                {$lookup: {from: "trades", localField: "parent", foreignField: "_id", as: "parent"}},
                {$unwind: "$parent"},
                {$lookup: {from: "user", localField: "parent.owner", foreignField: "_id", as: "parent.owner"}},
                {$unwind: "$parent.owner"}
            ]).sort({"created": -1}).limit(20).toArray((user_err, user_buy_offers) => {

                if (user_err) {
                    user_buy_offers = [];
                }

                console.log(user_buy_offers);
                user_buy_offers.forEach((list, idx) => {
                    if (list.parent.negotiable && list.offer) {
                        user_buy_offers[idx].offer_items = loadItemsFromUserTradeList(list.offer);
                    } else {
                        list.offer = [];
                    }

                    user_buy_offers[idx].parent.offer_items = loadItemsFromUserTradeList(list.parent.offer);
                    user_buy_offers[idx].parent.request_items = loadItemsFromUserTradeList(list.parent.request);
                    return user_buy_offers[idx];
                });


                let active_buys = [];
                let active_sells = [];
                let completed = [];

                user_buy_offers.forEach((list, idx) => {
                    if (list.status <= 2) {
                        active_buys.push(list);
                    } else {
                        completed.push(list);
                    }
                });

                user_sell_offers.forEach((list, idx) => {
                    if (list.open === true) {
                        active_sells.push(list);
                    } else {
                        completed.push(list);
                    }
                });

                completed = completed.sort((a, b) => {
                    return (a.created || 0) - (b.created || 0);
                });

                console.log(completed);

                response.render('trades/trades-index', {
                    canonical: `/trades`,
                    noindex: false,
                    title: generatePageTitle(title),
                    user: request.user,
                    search: '',
                    user_trades: [],
                    user_sell_offers: active_sells,
                    user_buy_offers: active_buys,
                    user_ended: completed,
                    trades: [],
                    header: header,
                    pagination: '',
                    category: '',
                    groups: [],
                    subcategories: []
                });

            });

        });


    };


    viewOffer = (request: express.Request, response: express.Response, next) => {

        let collection = db.getCollection('trades');

        collection.aggregate([
            {$match: {hash: request.params.hash}}, //"open": true, view old trades disabled by adding that
            {$lookup: {from: "user", localField: "owner", foreignField: "_id", as: "owner"}},
            {$unwind: "$owner"}
        ]).toArray(function (err, documents) {

            if (err) {
                documents = [];
            }
            if (documents.length === 0) {
                return next();
            }

            documents = documents.map((list) => {
                list.offer_items = loadItemsFromUserTradeList(list.offer);
                list.request_items = loadItemsFromUserTradeList(list.request);
                return list;
            });

            let trade = documents[0];
            trade.trade_offer = [];
            trade.request.forEach((n, idx) => {
                let obj = Object.assign(n, trade.request_items[idx]);
                obj.seriesItems = null;
                obj.recipes = null;
                obj.flavorText = null;
                obj.schema = null;
                obj.house = null;
                obj._learn_reactions = null;

                let variation_idx = getVariantIdx(trade.request_items[idx], trade.request[idx].variation, true);
                if (variation_idx !== -1 && obj.variants && obj.variants[variation_idx]) {
                    obj.variation = obj.variants[variation_idx];
                    obj.name = obj.variation.name + " " + obj.name;
                    obj.image = obj.variation.image;//+" "+obj.name;
                }else{
                    variation_idx = -1;
                }
                trade.trade_offer.push(obj);
            });

            let requests_collection = db.getCollection('trade-request');

            requests_collection.aggregate([
                {$match: {"parent": trade._id}},
                {$lookup: {from: "user", localField: "owner", foreignField: "_id", as: "owner"}},
                {$unwind: "$owner"}
            ]).toArray(function (err, interested_trades) {

                let title = "Trading Post";
                let header = `Sell Offer by ${trade.owner.contact.username}`;

                let view_user_has_made_offer = false;

                if (trade.negotiable) {
                    interested_trades = interested_trades.map((list, idx) => {
                        interested_trades[idx].offer_items = loadItemsFromUserTradeList(list.offer);
                        return list;
                    });
                }

                interested_trades.forEach((trade, idx) => {
                    if (request.user) {
                        if (trade.owner.hash === request.user.hash) {
                            view_user_has_made_offer = true;
                        }
                    }
                });

                //console.log("interested Trades 2",interested_trades.offer, interested_trades.offer.length);

                response.render('trades/trades-view', {
                    canonical: `/trades/view/${trade.hash}`,
                    noindex: true,
                    title: generatePageTitle(title),
                    user: request.user,
                    search: "",
                    trade: trade,
                    interested_trades: interested_trades,
                    header: header,
                    pagination: '',
                    category: '',
                    groups: [],
                    viewing_user_has_posted_offer: view_user_has_made_offer,
                    subcategories: []
                });

            });

        });

    };


    findOffer = (request: express.Request, response: express.Response, next) => {

        let title = "Find Trade Offers";
        let header = "Find Trade Offers";

        let getItem, item, variation_idx, item_title;

        let _search_item = itemCatalog.getItemById(request.params.item);
        let _search_villager = villagerCatalog.getVillagerById(request.params.item);

        if (_search_item) {

            if (request.params.variation) {
                variation_idx = getVariantIdx(_search_item, request.params.variation, true);
                if (variation_idx === -1) {
                    return next();
                }
            }

            getItem = _search_item;
        } else if (_search_villager) {
            getItem = _search_villager;
        }

        let match = {$match: {"open": true}};

        if (getItem) {

            match.$match["offer"] = {$elemMatch: {id: getItem.id}};
            if (variation_idx > -1) {
                match.$match["offer"] = {$elemMatch: {id: getItem.id, variation: getItem.variants[variation_idx].id}};
            }

        }

        let search_list = [];
        if (request.body.search) {
            let list = itemCatalog.getItems().concat(villagerCatalog.getVillagers());
            search_list = dynamicSearch(request.body.search, list, request.body.difficulty).map((item) => {
                let image = item._variation ? (item._variation.image || item._variation.closetImage) : item.image || item.closetImage;
                return {
                    id: item.id,
                    variation: item._variation || null,
                    name: item.name,
                    type: item.type,
                    image: image,
                    category: item.category,
                    subcategory: item.subcategory,
                    image_thumb: item.image_thumb || image
                };
            });
        }

        let collection = db.getCollection('trades');

        collection.aggregate([
            match,
            {$lookup: {from: "user", localField: "owner", foreignField: "_id", as: "owner"}},
            {$unwind: "$owner"}
        ]).sort({"created": -1}).limit(40).toArray(function (err, documents) {
            if (err) {
                console.log('ERR', err);
                documents = [];
            }

            documents.forEach((list, idx) => {
                documents[idx].offer_items = loadItemsFromUserTradeList(list.offer);
                documents[idx].request_items = loadItemsFromUserTradeList(list.request);
                return documents[idx];
            });

            response.render('trades/trades-find', {
                canonical: `/trades/buy`,
                noindex: true,
                title: generatePageTitle(title),
                user: request.user,
                search: decodeURIComponent(request.body.search || "").replace(/"/g, '&quot;'),
                search_list: search_list,
                type: request.params.type,
                trades: documents,
                header: header,
                pagination: '',
                category: '',
                groups: [],
                subcategories: []
            });
        });


    };

    createOffer = (request: express.Request, response: express.Response, next) => {

        /* let type = request.params.type;
         if (type !== "buy" && type !== 'sell') {
             return next();
         }*/

        /* let getItem = checkIncomingItem(request.params.item, request.params.variation);

         if (!getItem) {
             return next();
         }
         let item = getItem.item;
         let variation_idx = getItem.variation_idx;

         let item_title = item.name;
         if (variation_idx > -1) {
             item_title = item.variants[variation_idx].name + " " + item.name;
         }*/

        //let title = `Post ${type} Order for ${item_title}`;
        //let header = `Post ${type} Order for ${item_title}`;*/

        let title = "Create New Trade Offer";
        let header = "Create New Trade Offer";

        let A = "What are you Selling?";
        let B = "What are you Taking as Payment?";

        // if (type === "buy"){
        //  A = "What are you Buying?";
        //   B = "What are you Offering as Payment?";
        // }

        response.render('trades/trades-create', {
            // canonical: `/trades/offer/${type}/${item.id}`,
            canonical: `/trades/sell`,
            noindex: true,
            title: generatePageTitle(title),
            user: request.user,
            search: "",
            type: request.params.type,
            A: A,
            B: B,
            header: header,
            pagination: '',
            category: '',
            groups: [],
            subcategories: []
        });

    };

    getBuyOffers = (request: express.Request, response: express.Response, next) => {

        let getItem = checkIncomingItem(request.params.item, request.params.variation);

        if (!getItem) {
            return next();
        }
        let item = getItem.item;
        let variation_idx = getItem.variation_idx;

        let item_title = item.name;
        if (variation_idx > -1) {
            item_title = item.variants[variation_idx].name + " " + item.name;
        }

        let title = "Buy Offers for " + item_title;
        let header = "Buy Offers for " + item_title;

        response.render('trades/trades-index', {
            canonical: `/trades`,
            noindex: false,
            title: generatePageTitle(title),
            user: request.user,
            search: "",
            item: item,
            items: [],
            offers: [],
            header: header,
            pagination: '',
            category: '',
            groups: [],
            subcategories: []
        });

    };


    dynamicSearch = (request: express.Request, response: express.Response, next) => {
        let list = itemCatalog.getItems().concat(villagerCatalog.getVillagers());
        let results = dynamicSearch(request.body.search, list, request.body.difficulty).map((item) => {
            let image = item._variation ? (item._variation.image || item._variation.closetImage) : item.image || item.closetImage;
            return {
                id: item.id,
                variation: item._variation || null,
                name: item.name,
                type: item.type,
                image: image,
                category: item.category,
                subcategory: item.subcategory,
                image_thumb: item.image_thumb || image
            };
        });
        response.send(JSON.stringify(results));
    };


    /* getReaction = (request: express.Request, response: express.Response, next) => {
         let group = 'reactions';

         let type = request.params.reaction || false;

         let reaction = reactionCatalog.getReactionById(type);

         if (!reaction){
             return next();
         }

         let title = reaction.name;

         response.render('reaction', {
             canonical: '/' + group + (type ? `/${type}` : ""),
             noindex: false,
             title: generatePageTitle(title+" Reaction"),
             user: request.user,
             search: "",
             item: reaction,
             header: title,
             pagination: '',
             ad_keyword: generateAmazonAdsKeyword('', ''),
             category: group,
             //subcategory: subcategory,
             groups: [],
             subcategories: []
         });
     };*/

}

export default TradesController;

export interface ItemsForSale {
    items: [],
    requested: []
}