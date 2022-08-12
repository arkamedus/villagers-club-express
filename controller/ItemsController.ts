import * as express from 'express';
import {getVariantIdx, isSubcategoryOf, itemCategoryMapping} from "../util/ItemCatalog";
import {itemCatalog} from "../index";
import {generatePagination, paginateArray} from "../util/Array";
import {ejsHelpers} from "../util/EJSHelpers";
import {capitalizeWords, generatePageTitle} from "../util/Text";
import {generateAmazonAdsKeyword} from "../util/AmazonAdsKeywords";

class ItemsController {

    private page_size = 24;

    constructor(app) {
        this.initializeRoutes(app);
    }

    public initializeRoutes(app) {
        for (let category in itemCategoryMapping) {
            console.log(`initializing route for /${category}`);
            app.get(`/${category}`, this.categoryIndex(category));
            app.get(`/${category}/:item/:variation?`, this.itemView);
            app.get(`/${category}/page/:page(\\d{0,})`, this.categoryIndex(category));
            itemCategoryMapping[category].forEach((subcategory) => {
                app.get(`/${category}/${subcategory}`, this.categorySubcategoryIndex(category, subcategory));
                app.get(`/${category}/${subcategory}/:item/:variation?`, this.itemView);
                app.get(`/${category}/${subcategory}/page/:page(\\d{0,})`, this.categorySubcategoryIndex(category, subcategory));
            });
        }
    }

    public itemView(request: express.Request, response: express.Response, next) {
        let item = itemCatalog.getItemById(request.params.item);
        let _variation = request.params.variation;
        let variation;
        let variation_idx = 0;
        let slugs = request.originalUrl.split("/");

        console.log(_variation);

        if (slugs[0] === ''){
            slugs.shift();
        }
        console.log(slugs, item.category, item.subcategory);

        if (item) {
            if (slugs.length == 2){
                if (item.category !== slugs[0] || (item.subcategory)){
                    return next();
                }
            }else if (slugs.length >= 3){
                if (item.subcategory && item.subcategory !== slugs[1]){
                    return next();
                }
            }

            if (_variation) {
                if (item.variants) {
                    item.variants.forEach(function (_var, idx) {
                        console.log(_var.id, variation);
                        if (_var.id === _variation) {
                            variation = _var.id;
                            variation_idx = idx;
                        }
                    });
                    if (!variation) {
                        return next();
                    }
                } else {
                    return next();
                }
            }

            let recipeData;
            if (item.recipe) {
                recipeData = [];
                for (let recipe_material in item.recipe.materials) {
                    let _recipe_item = itemCatalog.getItemByName(recipe_material);
                    if (_recipe_item) {
                        recipeData.push({
                            material: _recipe_item,
                            count: item.recipe.materials[recipe_material]
                        });
                    }
                }

            }
            let variation_item;
            if (variation){
                variation_item = item.variants[getVariantIdx(item, variation)];
                //console.log(variation_item, variation)
            }else{
                variation_item = item;
            }
            response.render('item', {
                item,
                canonical: (item.category ? `/${item.category}` : '') + (item.subcategory ? `/${item.subcategory}` : '') + (`/${item.id}`),
                noindex: false,
                title: generatePageTitle(`${variation ? '' + variation_item.name + ' ' : ''}${item.name}`),
                search: false,
                recipeData: recipeData,
                variation: variation,
                variation_item:variation_item,
                variation_idx: variation_idx,
                description:item.flavorText,
                user: request.user,
                category: item.category,
                subcategories: item.subcategory
            });
        } else {
            next();
        }
    }

    public categoryIndex(category) {
        return (request: express.Request, response: express.Response, next) => {
            let page = 1;
            if (request.params.page) {
                page = parseInt(request.params.page);
                if (page <= 0) {
                    return next(new Error('Not a valid page number'));
                }
            }

            let items = itemCatalog.search('', {category: category});
            if (page > (((items.length - 1) / this.page_size) | 0) + 1) {
                return next();
            }

            response.render('list', {
                base_url: `/${category}`,
                items: paginateArray(items, page, this.page_size),
                canonical: (`/${category}`),
                title: generatePageTitle(`All ${capitalizeWords(category)}`),
                noindex: false,
                search: false,
                header: `All ${capitalizeWords(category)}`,
                user: request.user,
                pagination: generatePagination(page, this.page_size, items.length, `/${category}`),
                ad_keyword: generateAmazonAdsKeyword(category, ''),
                category: category,
                subcategories: itemCategoryMapping[category]
            });

        };
    }

    public categorySubcategoryIndex(category, subcategory) {
        return (request: express.Request, response: express.Response, next) => {

            if (!isSubcategoryOf(category, subcategory)) {
                return next(new Error('Not a valid subcategory'));
            }

            let page = 1;
            if (request.params.page) {
                page = parseInt(request.params.page);
                if (page <= 0) {
                    return next(new Error('Not a valid page number'));
                }
            }

            let items = itemCatalog.search('', {
                category: category,
                subcategory: subcategory
            });

            if (page > (((items.length - 1) / this.page_size) | 0) + 1) {
                return next();
            }

            response.render('list', {
                base_url: `/${category}`,
                items: paginateArray(items, page, this.page_size),
                canonical: (`/${category}/${subcategory}`),
                title: generatePageTitle(`All ${subcategory}`),
                noindex: false,
                search: false,
                header: `<span class="header-subtext">${capitalizeWords(category)}</span>${capitalizeWords(subcategory)} List`,
                user: request.user,
                pagination: generatePagination(page, this.page_size, items.length, `/${category}/${subcategory}`),
                ad_keyword: generateAmazonAdsKeyword(category, subcategory),
                category: category,
                subcategory: subcategory,
                subcategories: itemCategoryMapping[category]
            });

        };
    }


}

export default ItemsController;