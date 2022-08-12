import * as express from 'express';
import {generatePagination, paginateArray} from "../util/Array";
import {itemCategoryMapping} from "../util/ItemCatalog";
import {ejsHelpers} from "../util/EJSHelpers";
import {itemCatalog, villagerCatalog} from "../index";
import {generatePageTitle} from "../util/Text";
import {generateAmazonAdsKeyword} from "../util/AmazonAdsKeywords";

var stringSimilarity = require('string-similarity');

class SearchController {

    constructor(app) {
        this.intializeRoutes(app);
    }

    public intializeRoutes(app) {
        app.get('/search/:search?', this.getSearch);
    }

    public getSearch(request: express.Request, response: express.Response) {
        let search_unsafe = request.params.search || "";
        let search = decodeURIComponent(search_unsafe).trim();
        let search_safe = decodeURIComponent(search_unsafe).replace(/"/g, '&quot;');

        let list = itemCatalog.getItems().concat(villagerCatalog.getVillagers());

        let results = dynamicSearch(search, list);

        response.render('list', {
            canonical: '/search',
            noindex: search!=="",
            title:generatePageTitle('Search VillagersClub'),
            user: request.user,
            search: search_safe,
            items: results,
            header: `Search VillagersClub`,
            pagination: '',
            ad_keyword : generateAmazonAdsKeyword('',''),
            category: 'search',
            //subcategory: subcategory,
            subcategories: []
        });
    };

}

export function dynamicSearch(search, list, difficulty = 1){
    let search_results = [];
    let search_terms = search.split(" ");

    if (search !== "") {

        list.forEach(function (searchable) {

            if (searchable._searchables) {

                let result = {
                    match: 0,
                    item: searchable
                };

                search_terms.forEach(function (term) {

                    if (searchable.name) {
                        if ((searchable.name + "").toLowerCase() === (term + "").toLowerCase()) {
                            result.match += 4;
                        }
                    }

                    if (searchable.series) {
                        if ((searchable.series + "").toLowerCase().indexOf((term + "").toLowerCase()) !== -1) {
                            result.match += 3;
                        }
                    }

                    if (searchable.set) {
                        if ((searchable.set + "").toLowerCase().indexOf((term + "").toLowerCase()) !== -1) {
                            result.match += 3;
                        }
                    }

                    searchable._searchables.forEach(function (keyword) {

                        result.match += parseFloat(stringSimilarity.compareTwoStrings((keyword + "").toLowerCase(), (term + "").toLowerCase())) / (searchable._searchables.length) / 10;

                        if ((keyword + "").toLowerCase().indexOf((term + "").toLowerCase()) !== -1) {
                            result.match += 0.5;//(Math.abs(((keyword + "").length) - ((term + "").length))) / 10;
                        }

                        if ((keyword + "").toLowerCase() === (term + "").toLowerCase()) {
                            result.match += 2;
                        }

                    })


                });

                search_results.push(result);

            }
        });
    }
    list = [];

    search_results.sort(function (a, b) {
        return b.match - a.match;
    }).slice(0, 100).forEach(function (result) {

        if (result.match > 0.2*difficulty) {
            let search_item = Object.assign({}, result.item);
            if (search_item.variants) {
                let exact = false;

                search_terms.forEach(function (term) {

                    search_item.variants.forEach(function (_variant) {
                        if (!exact && !search_item._variation && (_variant.variation||"").toLowerCase().indexOf((term+'').toLowerCase()) !== -1){
                            search_item._variation = _variant;
                        }
                        if (!exact && _variant.variation && _variant.variation.toLowerCase() === (term + '').toLowerCase()) {
                            search_item._variation = _variant;
                            exact = true;
                        }
                        if (!exact && _variant.colors){
                            _variant.colors.forEach(function(color){
                                if (color && color.toLowerCase() === (term + '').toLowerCase()) {
                                    search_item._variation = _variant;
                                }
                            })
                        }
                    });

                });

            }
            list.push(search_item);

        }

    });

    return list;
}

export default SearchController;