import * as express from 'express';
import {ForumCategory, ForumPost, ForumReply} from "../util/Forums";
import {capitalizeWords, generatePageTitle, isValidForumCategoryName} from "../util/Text";
import {ejsHelpers} from "../util/EJSHelpers";
import {db} from "../index";
import {generatePagination} from "../util/Array";

const ObjectID = require('mongodb').ObjectID;

class ForumsController {

    private items;
    private page_size;

    constructor(app) {
        this.page_size = 24;
        this.intializeRoutes(app);
    }

    public intializeRoutes(app) {
        app.get('/forums', this.getForumsIndex);
        app.get('/forums/:category', this.getForumsCategory);
        app.get('/forums/:category/:thread', this.getForumsThread);
        app.get('/forums/:category/post', this.getForumsCategoryCreate);

        app.post('/forums/create/post/:category', (req, res) => {

            let category = new ForumCategory({
                name: req.params.category
            });

            let post = new ForumPost({
                name: req.body.name,
                body: req.body.body
            });


            if (isValidForumCategoryName(category.name) && isValidForumCategoryName(post.name)) {
                db.findOne('forum-category', {slug: category.slug}).then((category_document: ForumCategory) => {
                    console.log('CATEGORY EXISTS');

                    post.parent = category_document._id;

                    db.insertOne('forum-post', post).then((post_document: ForumPost) => {
                        console.log('CREATED POST');
                        console.log("AA", category);
                        res.redirect('/forums');

                    }).catch((err) => {
                        console.log('ERR B CREATING CATEGORY', err);
                        res.redirect('/forums');
                    });


                }).catch((err) => {
                    console.log('NO SUCH CATEGORY', err);
                    res.redirect('/forums');
                });
            } else {
                console.log('INVALID CATEGORY NAME');
                res.redirect('/forums');
            }

        });

        app.post('/forums/create/category', (req, res) => {

            let category = new ForumCategory({
                name: req.body.name
            });

            if (isValidForumCategoryName(category.name)) {
                db.findOne('forum-category', {slug: category.slug}).then((document) => {
                    console.log('ERR A CREATING CATEGORY: CATEGORY EXISTS');
                    res.redirect('/forums');
                }).catch((err) => {
                    db.insertOne('forum-category', category).then((document) => {
                        console.log('CREATED CATEGORY');
                        res.redirect('/forums');
                    }).catch((err) => {
                        console.log('ERR B CREATING CATEGORY', err);
                        res.redirect('/forums');
                    });
                });
            } else {
                res.redirect('/forums');
            }

        })
    }

    getForumsIndex = (request: express.Request, response: express.Response) => {

        db.find('forum-category', {}).then((documents: ForumCategory[]) => {

            let p = [];
            documents.forEach(function (category_document: ForumCategory, idx) {
                p.push(db.find('forum-post', {parent: category_document._id}).then((posts:ForumPost[])=>{
                    documents[idx].posts = posts;
                }));
            });

            Promise.all(p).then((items) => {

                response.render('forums-index', {
                    items: documents,
                    canonical: '/forums',
                    noindex: false,
                    title: generatePageTitle(`VillagersClub Forums`),
                    search: false,
                    user: request.user,
                    header: 'VillagersClub Forums',
                    subcategories: [],
                    ad_keyword: "animal crossing merch"
                });
            });

        });

    };

    getForumsCategory = (request: express.Request, response: express.Response, next) => {
        let slug = request.params.category;

        let page = 1;
        db.findOne('forum-category', {slug: slug}).then((document: ForumCategory) => {

            db.find('forum-post', {parent: document._id}).then((results:[]) => {
                response.render('forums-category', {
                    item: document,
                    items: results,
                    canonical: `/forums/${document.slug}`,
                    noindex: false,
                    title: generatePageTitle(`${document.name}`),
                    pagination: generatePagination(page, this.page_size, results.length, `/forums/${slug}`),
                    search: false,
                    user: request.user,
                    header: `${document.name}`,
                    subcategories: ['all', 'recent', 'rising', 'controversial'],
                    ad_keyword: "animal crossing merch"
                });
            });

        }).catch(() => {

            next();
        });

    };

    getForumsThread = (request: express.Request, response: express.Response, next) => {
        let category_slug = request.params.category;
        db.findOne('forum-category', {slug: category_slug}).then((document: ForumCategory) => {

            let thread_slug = request.params.thread;
            db.findOne('forum-post', {parent: document._id, slug:thread_slug}).then((thread:ForumPost) => {
                response.render('forums-thread', {
                    item: thread,
                    canonical: `/forums/${category_slug}/${thread.slug}`,
                    noindex: false,
                    title: generatePageTitle(`${thread.name}`),
                    search: false,
                    user: request.user,
                    header: `${document.name} > ${thread.name}`,
                    subcategories: [],
                    ad_keyword: "animal crossing merch"
                });
            }).catch(()=>{
                next();
            });

        }).catch(() => {

            next();
        });

    };

    getForumsCategoryCreate = (request: express.Request, response: express.Response, next) => {

        let slug = request.params.category;
        db.findOne('forum-category', {slug: slug}).then((document: ForumCategory) => {

            response.render('forums-create', {
                category: document,
                canonical: '/forums',
                noindex: false,
                title: generatePageTitle(`VillagersClub Forums`),
                search: false,
                user: request.user,
                header: `Create Thread in ${document.name}`,
                subcategories: [],
                ad_keyword: "animal crossing merch"

            });

        }).catch(() => {
            next();
        });

    };

}

export default ForumsController;