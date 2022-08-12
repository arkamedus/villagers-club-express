import * as express from 'express';
import {ForumCategory, ForumPost, ForumReply} from "../util/Forums";
import {capitalizeWords, generatePageTitle, isValidForumCategoryName} from "../util/Text";
import {ejsHelpers} from "../util/EJSHelpers";
import {db} from "../index";
import {generatePagination} from "../util/Array";

const ObjectID = require('mongodb').ObjectID;

class BlogController {

    private items;
    private page_size;

    constructor(app) {
        this.page_size = 24;
        this.intializeRoutes(app);
    }

    public intializeRoutes(app) {
      //  app.get('/blog', this.getBlogIndex);
        app.get('/blog/is-animal-crossing-worth-it', this.getBlogIndex("is-animal-crossing-worth-it", "Is Animal Crossing New Horizons Worth It?"));
       // app.get('/forums/:category', this.getForumsCategory);
      //  app.get('/forums/:category/:thread', this.getForumsThread);
       // app.get('/forums/:category/post', this.getForumsCategoryCreate);
    }


    getBlogIndex = (url, title) => {

        return (request: express.Request, response: express.Response) => {

       // db.find('blog', {}).then((documents: []) => {
            

                response.render("blogs/"+url, {
                    canonical: '/blogs/'+url,
                    noindex: false,
                    title: generatePageTitle(title),
                    search: false,
                    user: request.user,
                    header: title,
                    subcategories: [],
                    ad_keyword: "animal crossing merch"
            });

        //});
        }

    };



}

export default BlogController;