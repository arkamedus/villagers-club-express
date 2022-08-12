import * as express from 'express';
import {generatePagination, paginateArray} from "../util/Array";
import {ejsHelpers} from "../util/EJSHelpers";
import {itemCatalog, reactionCatalog, villagerCatalog} from "../index";
import {
    capitalizeWords,
    generatePageTitle,
    slugify
} from "../util/Text";
import {generateAmazonAdsKeyword} from "../util/AmazonAdsKeywords";
import {sheetSourceToCategoryMapping} from "../util/ItemCatalog";

class ReactionsController {

    page_size;

    constructor(app) {
        this.intializeRoutes(app);
    }

    public intializeRoutes(app) {
        this.page_size = 4;
        app.get('/reactions', this.getSets);
        app.get('/reactions/:reaction', this.getReaction);
        app.get('/reactions/source/:source', this.getSets);
    }

    getSets = (request: express.Request, response: express.Response, next) => {
        let group = 'reactions';
        let type = request.params.source || false;
        let reaction = request.params.reaction || false;

        if (reactionCatalog.getReactionSources().indexOf(type) === -1 && type){
            return next();
        }

        let items = reactionCatalog.getAllReactions();
        let title = !type ? `All Reactions` : `Reactions from ${capitalizeWords(type)} Villagers`;

        response.render('reactions', {
            canonical: '/' + group + (type ? `/${type}` : ""),
            noindex: false,
            title: generatePageTitle(title),
            user: request.user,
            search: "",
            items: items,
            header: title,
            pagination: '',
            ad_keyword: generateAmazonAdsKeyword('', ''),
            category: group,
            //subcategory: subcategory,
            groups: [],
            subcategories: []
        });
    };

    getReaction = (request: express.Request, response: express.Response, next) => {
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
    };


}

export default ReactionsController;