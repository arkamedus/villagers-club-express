import * as express from 'express';
import {generatePagination, paginateArray} from "../util/Array";
import {itemCategoryMapping} from "../util/ItemCatalog";
import {ejsHelpers} from "../util/EJSHelpers";
import {itemCatalog, villagerCatalog} from "../index";
import {
    alphaNumericSortObjectName,
    alphaNumericSortStrings,
    capitalizeWords,
    generatePageTitle,
    slugify
} from "../util/Text";
import {generateAmazonAdsKeyword} from "../util/AmazonAdsKeywords";

class SetsController {

    page_size;

    constructor(app) {
        this.intializeRoutes(app);
    }

    public intializeRoutes(app) {
        this.page_size = 4;
        app.get('/:group', this.getSets);
        app.get('/:group/page/:page', this.getSets);
        app.get('/:group/:type', this.getSets);
        app.get('/:group/:type/page/:page', this.getSets);
    }

    getSets = (request: express.Request, response: express.Response, next) => {

        let group = request.params.group;

        if (['sets', 'styles', 'themes','tags','seasons'].indexOf(group) == -1) {
            return next();
        }

        let page = 1;
        if (request.params.page) {
            page = parseInt(request.params.page);
            if (page <= 0) {
                return next(new Error('Not a valid page number'));
            }
        }
        let member_check: any = false;
        if (!request.user) {
            member_check = capitalizeWords(group);
            if (page !== 1) {
                response.redirect('/locked');
                return;
            }
        }

        let sets_list = this.getItemGroupings(group);
        let subcategories = [];


        let items = [];
        let items_counter = 0;
        let type = request.params.type || false;
        let slugs = [];

        let suffix = "set";
        switch(group){
            case "sets":suffix="set";break;
            case "themes":suffix="theme";break;
            case "styles":suffix="style";break;
            case "tags":suffix="tag";break;
            case "seasons":suffix="season";break;
        }

        for (let set in sets_list) {
            subcategories.push((set));
            slugs.push(slugify(set));
            if (!type || slugify(type) === slugify(set)) {
                if (sets_list[set].items.length < 20) {
                    sets_list[set].name = capitalizeWords(set+" "+suffix);
                    items.push(sets_list[set]);
                    items_counter++;
                } else {
                    let pages = ((sets_list[set].items.length / 20) | 0) + 1;
                    let len = sets_list[set].items.length;
                    for (var i = 0; i < pages; i++) {
                        items_counter++;
                        if (!member_check || ((type && i===0) || (!member_check || i == 0))) {
                            let slice = sets_list[set].items.slice(i * 20, (i + 1) * 20);
                            if (slice.length >= 1) {
                                items.push({
                                        set_name: sets_list[set].set_name,
                                        name: (`${capitalizeWords(set + " " + suffix)} ( ${(i * 20) + 1} - ${Math.min((i + 1) * 20, len)} of ${len} ) `),
                                        items: sets_list[set].items.slice(i * 20, (i + 1) * 20)
                                    }
                                );
                            }else{
                                items_counter--;
                            }
                        }
                    }
                }
            }
        }

        if (type && slugs.indexOf(slugify(type)) == -1) {
            return next();
        }


        if (page > (((items.length - 1) / this.page_size) | 0) + 1) {
            return next();
        }

        let title = !type?`Furniture, Item, & Clothing ${capitalizeWords(group)}`:`${capitalizeWords(items[0].set_name)} ${capitalizeWords(suffix)}`;

        response.render('sets', {
            canonical: '/' + group+(type?`/${type}`:""),
            noindex: false,
            title: generatePageTitle(title),
            user: request.user,
            search: "",
            items: paginateArray(items, page, this.page_size),
            header: title,
            pagination: generatePagination(page, this.page_size, items_counter, '/' + group+(type?`/${type}`:""), member_check),
            ad_keyword: generateAmazonAdsKeyword('', ''),
            category: group,
            //subcategory: subcategory,
            groups:['sets','themes','styles','tags','seasons'],
            subcategories: subcategories
        });
    };


    public getItemGroupings(group) {

        let sets_list = {};


        switch (group) {
            case "sets":
                itemCatalog.getItems().forEach((item) => {
                    if (item.series) {
                        if (!sets_list[item.series]) {
                            sets_list[item.series] = {set_name :item.series, name: ejsHelpers.capitalizeWords(item.series), items: []};
                        }
                        sets_list[item.series].items.push(item);
                    }

                    if (item.set) {
                        if (!sets_list[item.set]) {
                            sets_list[item.set] = {set_name :item.set,name: ejsHelpers.capitalizeWords(item.set), items: []};
                        }
                        sets_list[item.set].items.push(item);
                    }
                });
                break;
            case "themes":
                itemCatalog.getItems().forEach((item) => {
                    if (item.themes && item.themes.length > 0) {

                        item.themes.forEach(function (theme) {

                            if (!sets_list[theme]) {
                                sets_list[theme] = {set_name :theme,name: ejsHelpers.capitalizeWords(theme), items: []};
                            }
                            sets_list[theme].items.push(item);

                        });
                    }
                });
                break;

            case "styles":
                itemCatalog.getItems().forEach((item) => {
                    if (item.styles) {
                        for (const style of item.styles) {

                            if (!sets_list[style]) {
                                sets_list[style] = {
                                    set_name: style,
                                    name: ejsHelpers.capitalizeWords(style),
                                    items: []
                                };
                            }
                            sets_list[style].items.push(item);
                        }
                    }
                });
                break;

            case "tags":
                itemCatalog.getItems().forEach((item) => {
                    if (item.tag && item.tag.length > 0) {


                            if (!sets_list[item.tag]) {
                                sets_list[item.tag] = {set_name :item.tag,name: ejsHelpers.capitalizeWords(item.tag), items: []};
                            }
                            sets_list[item.tag].items.push(item);
                    }
                });
                break;


            case "seasons":
                itemCatalog.getItems().forEach((item) => {
                    if (item.seasonEvent && item.seasonEvent.length > 0) {


                            if (!sets_list[item.seasonEvent]) {
                                sets_list[item.seasonEvent] = {set_name :item.seasonEvent,name: ejsHelpers.capitalizeWords(item.seasonEvent), items: []};
                            }
                            sets_list[item.seasonEvent].items.push(item);
                    }
                });
                break;
        }


        return sets_list;
    }

}

export default SetsController;