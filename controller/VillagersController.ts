import * as express from 'express';
import {isSubcategoryOf, itemCategoryMapping} from "../util/ItemCatalog";
import {itemCatalog, villagerCatalog} from "../index";
import {generatePagination, paginateArray} from "../util/Array";
import {ejsHelpers} from "../util/EJSHelpers";
import {capitalizeWords, generatePageTitle} from "../util/Text";
import {generateAmazonAdsKeyword} from "../util/AmazonAdsKeywords";

class VillagersController {

    private page_size = 24;

    constructor(app) {
        this.initializeRoutes(app);
    }

    public initializeRoutes(app) {

        app.get(`/villagers`, this.villagerIndex());
        app.get(`/villagers/page/:page(\\d{0,})`, this.villagerIndex());
        app.get(`/villagers/personality/page/:page(\\d{0,})`, this.villagerIndex('personality'));
        app.get(`/villagers/personality/:personality?`, this.villagerIndex('personality'));
        app.get(`/villagers/personality/:personality/page/:page(\\d{0,})`, this.villagerIndex('personality'));

        app.get(`/villagers/species/page/:page(\\d{0,})`, this.villagerIndex('species'));
        app.get(`/villagers/species/:species?`, this.villagerIndex('species'));
        app.get(`/villagers/species/:species/page/:page(\\d{0,})`, this.villagerIndex('species'));


        app.get(`/villagers/hobby/page/:page(\\d{0,})`, this.villagerIndex('hobby'));
        app.get(`/villagers/hobby/:hobby?`, this.villagerIndex('hobby'));
        app.get(`/villagers/hobby/:hobby/page/:page(\\d{0,})`, this.villagerIndex('hobby'));

        app.get(`/villagers/sign/page/:page(\\d{0,})`, this.villagerIndex('sign'));
        app.get(`/villagers/sign/:sign?`, this.villagerIndex('sign'));
        app.get(`/villagers/sign/:sign/page/:page(\\d{0,})`, this.villagerIndex('sign'));


        app.get(`/villagers/:item`, this.villagerView);

        app.get(`/villagers/special`, this.villagerSpecialIndex());
        app.get(`/villagers/special/page/:page(\\d{0,})`, this.villagerSpecialIndex());

    }

    public villagerView(request: express.Request, response: express.Response, next) {
        let item = villagerCatalog.getVillagerById(request.params.item);

        if (item) {

            response.render('villager', {
                item,
                canonical: item.url,
                noindex: false,
                search: "",
                description: item.flavorText,
                title: generatePageTitle(item.name),
                user: request.user,
                category: 'villagers',
                subcategories: []
            });
        } else {
            next();
        }
    }

    public villagerIndex(pageType?) {
        return (request: express.Request, response: express.Response, next) => {
            let page = 1;
            if (request.params.page) {
                page = parseInt(request.params.page);
                if (page <= 0) {
                    return next(new Error('Not a valid page number'));
                }
            }

            let subcategory;

            let filter: any = {};
            let base_url = "/villagers";
            let canonical_url = "/villagers";

            let subcategories = ['species', 'personality', 'hobby', 'sign'];

            if (request.params.personality) {
                filter.personality_slug = request.params.personality;
                base_url += `/personality`
                canonical_url += `/personality`
            }

            if (request.params.species) {
                filter.species_slug = request.params.species;
                base_url += `/species`;
                canonical_url += `/species`;
            }

            if (request.params.hobby) {
                filter.hobby_slug = request.params.hobby;
                base_url += `/hobby`;
                canonical_url += `/hobby`;
            }
            if (request.params.sign) {
                filter.sign_slug = request.params.sign;
                base_url += `/sign`;
                canonical_url += `/sign`;
            }


            let villagers = villagerCatalog.search('', filter);

            if (page > (((villagers.length - 1) / this.page_size) | 0) + 1 || villagers.length == 0) {
                return next();
            }

            let title = "All Villagers";
            let header = "All Villagers";
            if (pageType) {
                if (pageType === 'personality') {
                    subcategories = villagerCatalog.getPersonalityTypes();
                    subcategory = "personality";
                    header = `<span class="header-subtext">Villagers</span>All Personalities List`;
                    title = `All Villagers Personalities List`;
                    if (request.params.personality) {
                        header = `<span class="header-subtext">Villagers</span>${capitalizeWords(villagerCatalog.getPersonalityNameById(filter.personality_slug))} Personality Villagers List`;
                        title = `${capitalizeWords(villagerCatalog.getPersonalityNameById(filter.personality_slug))} Personality Villagers List`;
                        subcategory = request.params.personality;
                        canonical_url = `/villagers/personality/`+subcategory;
                    } else {
                        base_url = `/villagers/personality`;
                    }
                }
                if (pageType === 'species') {
                    subcategories = villagerCatalog.getSpecies();
                    subcategory = "species";
                    header = `<span class="header-subtext">Villagers</span>All Species List`;
                    title = `All Villagers Species List`;

                    if (request.params.species) {
                        subcategory = request.params.species;
                        header = `<span class="header-subtext">Villagers</span>${capitalizeWords(request.params.species)} Species Villagers List`;
                        title = `${capitalizeWords(request.params.species)} Species Villagers List`;
                        canonical_url = `/villagers/species/`+subcategory;
                    } else {
                        base_url = `/villagers/species`;
                    }
                }

                if (pageType === 'hobby') {
                    subcategories = villagerCatalog.getHobbies();
                    subcategory = "hobby";
                    header = `<span class="header-subtext">Villagers</span>All Hobbies List`;
                    title = `All Villagers Hobbies List`;

                    if (request.params.hobby) {
                        subcategory = request.params.hobby;
                        header = `<span class="header-subtext">Villagers</span>${capitalizeWords(request.params.hobby)} Hobby Villagers List`;
                        title = `${capitalizeWords(request.params.hobby)} Hobby Villagers List`;
                        canonical_url = `/villagers/hobby/`+subcategory;
                    } else {
                        base_url = `/villagers/hobby`;
                    }
                }
                if (pageType === 'sign') {
                    subcategories = villagerCatalog.getSigns();
                    subcategory = "sign";
                    header = `<span class="header-subtext">Villagers</span>All Signs List`;
                    title = `All Villagers Signs List`;

                    if (request.params.sign) {
                        subcategory = request.params.sign;
                        header = `<span class="header-subtext">Villagers</span>${capitalizeWords(request.params.sign)} Sign Villagers List`;
                        title = `${capitalizeWords(request.params.sign)} Sign Villagers List`;
                        canonical_url = `/villagers/sign/`+subcategory;
                    } else {
                        base_url = `/villagers/sign`;
                    }
                }
            }

            response.render('list', {
                base_url: base_url,
                canonical: canonical_url,
                noindex: false,
                items: paginateArray(villagers, page, this.page_size),
                header: header,
                title: generatePageTitle(title),
                search: false,
                user: request.user,
                category: 'villagers',
                subcategory: subcategory,
                subcategories: subcategories,
                pagination: generatePagination(page, this.page_size, villagers.length, base_url + `${(request.params.species || request.params.personality ? "/" + (request.params.species || request.params.personality || "") : "")}`),
                ad_keyword: generateAmazonAdsKeyword('villagers', '')
            });
        }
    }


    public villagerSpecialIndex(pageType?) {
        return (request: express.Request, response: express.Response, next) => {
            let page = 1;
            if (request.params.page) {
                page = parseInt(request.params.page);
                if (page <= 0) {
                    return next(new Error('Not a valid page number'));
                }
            }

            let subcategory;

            let filter: any = {};
            let base_url = "/villagers";

            let subcategories = ['species', 'personality', 'hobby', 'sign'];

            if (request.params.personality) {
                filter.personality_slug = request.params.personality;
                base_url += `/personality`
            }

            if (request.params.species) {
                filter.species_slug = request.params.species;
                base_url += `/species`;
            }
            if (request.params.hobby) {
                filter.species_slug = request.params.hobby;
                base_url += `/hobby`;
            }
            if (request.params.sign) {
                filter.species_slug = request.params.sign;
                base_url += `/sign`;
            }

            let villagers = villagerCatalog.search('', filter);

            if (page > (((villagers.length - 1) / this.page_size) | 0) + 1 || villagers.length == 0) {
                return next();
            }

            let title = "All Villagers";
            let header = "All Villagers";
            if (pageType) {
                if (pageType === 'personality') {
                    subcategories = villagerCatalog.getPersonalityTypes();
                    subcategory = "personality";
                    header = `<span class="header-subtext">Villagers</span>All Personalities List`;
                    title = `All Villagers Personalities List`;
                    if (request.params.personality) {
                        header = `<span class="header-subtext">Villagers</span>${capitalizeWords(villagerCatalog.getPersonalityNameById(filter.personality_slug))} Villagers List`;
                        title = `${capitalizeWords(villagerCatalog.getPersonalityNameById(filter.personality_slug))} Villagers List`;
                        subcategory = request.params.personality;
                        base_url = `/villagers/personality/`+subcategory;
                    } else {
                        base_url = `/villagers/personality`;
                    }
                }
                if (pageType === 'species') {
                    subcategories = villagerCatalog.getSpecies();
                    subcategory = "species";
                    header = `<span class="header-subtext">Villagers</span>All Species List`;
                    title = `All Villagers Species List`;

                    if (request.params.species) {
                        subcategory = request.params.species;
                        header = `<span class="header-subtext">Villagers</span>${capitalizeWords(request.params.species)} Villagers List`;
                        title = `${capitalizeWords(request.params.species)} Villagers List`;
                        base_url = `/villagers/species/`+subcategory;
                    } else {
                        base_url = `/villagers/species`;
                    }
                }
            }

            response.render('list', {
                base_url: base_url,
                canonical: base_url,
                noindex: false,
                items: paginateArray(villagers, page, this.page_size),
                header: header,
                title: generatePageTitle(title),
                search: false,
                user: request.user,
                category: 'villagers',
                subcategory: subcategory,
                subcategories: subcategories,
                pagination: generatePagination(page, this.page_size, villagers.length, base_url + `${(request.params.species || request.params.personality ? "/" + (request.params.species || request.params.personality || "") : "")}`),
                ad_keyword: generateAmazonAdsKeyword('villagers', '')
            });
        }
    }


}

export default VillagersController;
