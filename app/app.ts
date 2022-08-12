const search_pill: HTMLElement = document.getElementById('pill-search-expand');
const search_pill_input: HTMLInputElement = <HTMLInputElement>document.getElementById('pill-search');
const search_pill_icon: HTMLElement = document.getElementById('pill-search-icon');
const navbar: HTMLElement = document.getElementById('navbar');

function isHover(e) {
    return (e.parentElement.querySelector(':hover') === e);
}

let updatePillSearchBar = () => {

};

if (navbar) {

    search_pill.onmouseenter = updatePillSearchBar;
    navbar.onmouseleave = updatePillSearchBar;
    search_pill_input.onblur = updatePillSearchBar;

    search_pill.onclick = function () {
        search_pill_input.focus();
        updatePillSearchBar();
        search_pill_input.focus();
    };
    search_pill_input.onkeyup = search_pill_input.onkeypress = function (e) {
        if (search_input_box) {
            search_input_box.value = search_pill_input.value;
        }
        if (e.keyCode === 13 || e.which === 13 || e.key === 'Enter') {
            if (search_pill_input.value !== "") {
                // if (!window.navigator['standalone']) {
                /* iOS hides Safari address bar */
                //window.history.pushState({data: "okay"}, "unknown", `//${window.location.hostname}/search/${encodeURIComponent(search_pill_input.value)}`);
                window.history.pushState({data: "okay"}, "unknown", window.location.href);
                window.location.replace(`//${window.location.hostname}/search/${encodeURIComponent(search_pill_input.value)}`);
                //}
                //app.route(`/search/${encodeURIComponent(search_pill_input.value)}`);
            } else {
                search_pill_input.blur();

            }
        } else {
            // return true;
        }
        updatePillSearchBar();
    };

    search_pill_icon.onclick = function (e) {
        e.preventDefault();
        if (search_pill_input.value !== "") {
            //  if (!window.navigator['standalone']) {
            /* iOS hides Safari address bar */
            window.history.pushState({data: "okay"}, "unknown", window.location.href);
            window.location.replace(`//${window.location.hostname}/search/${encodeURIComponent(search_pill_input.value)}`);
            // }
        }
    };
    updatePillSearchBar = function () {
        if (search_pill_input.value !== '' || document.activeElement === search_pill_input || isHover(search_pill)) {
            document.getElementById('navbar').className = 'pill-search-open';
        } else {
            document.getElementById('navbar').className = '';
        }

        if (search_pill_input.value !== '') {
            search_pill_icon.className = 'fas fa-arrow-right fa-fw';
        } else {
            search_pill_icon.className = 'fas fa-search fa-fw';
        }

    }

    updatePillSearchBar();

}

const search_input_box: HTMLInputElement = <HTMLInputElement>document.getElementById('search-input-box');
const search_input_button = document.getElementById('search-input-button');

if (search_input_box && search_input_button) {
    search_input_box.onkeyup = search_input_box.onkeypress = function (e) {
        if (search_pill_input) {
            search_pill_input.value = search_input_box.value;
            updatePillSearchBar();
        }

        if (e.keyCode === 13 || e.which === 13 || e.key === 'Enter') {
            if (search_input_box.value !== "") {
                window.history.pushState({data: "okay"}, "unknown", window.location.href);
                window.location.replace(`//${window.location.hostname}/search/${encodeURIComponent(search_input_box.value)}`);
            } else {
                search_input_box.blur();
            }
        }
    };
    search_input_button.onclick = function (e) {
        e.preventDefault();
        if (search_input_box.value !== "") {
            window.history.pushState({data: "okay"}, "unknown", window.location.href);
            window.location.replace(`//${window.location.hostname}/search/${encodeURIComponent(search_input_box.value)}`);
        }
    };
}


function ApiCall(url, data, cb) {

    let xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(data));
    xhr.onload = function () {
        if (xhr.status != 200) { // analyze HTTP status of the response
            console.log(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
        } else { // show the result
            console.log(`Done, got ${xhr.response.length} bytes`); // responseText is the server
            cb(JSON.parse(xhr.responseText));
        }
    };

    xhr.onprogress = function (event) {
        if (event.lengthComputable) {
            console.log(`Received ${event.loaded} of ${event.total} bytes`);
        } else {
            console.log(`Received ${event.loaded} bytes`); // no Content-Length
        }
    };

    xhr.onerror = function () {
        cb(null);
    };
}

function isItemInList(item_id, item_variation, list) {
    let is = false;
    if (!list.items) {
        return false;
    }
    list.items.forEach(function (item) {
        if (item.id === item_id && !item_variation) {
            is = true;
        } else if (item.id === item_id && item_variation === item.variation) {
            is = true;
        }
    });
    return is;
}

function getParentData(elem) {
    let e = elem.parentElement;
    while (e && e.tagName && e.tagName.toLowerCase() !== 'body' && !e.getAttribute('data-param-type')) {
        e = e.parentElement;
    }
    return {
        parent: e,
        item_type: e.getAttribute('data-param-type'),
        list: e.getAttribute('data-param-list'),
        item_id: e.getAttribute('data-param-id'),
        item_variation: e.getAttribute('data-param-variation')
    }
}


// DROPDOWNS
let dropdown_handles = document.getElementsByClassName('context-handle');
var dropdowns = document.getElementsByClassName("context-menu-content");

function clearAllContextHandles() {
    if (dropdown_handles.length === 0) {
        return;
    }
    console.log('clear');
    var i;
    for (i = 0; i < dropdown_handles.length; i++) {
        var openDropdown = dropdown_handles[i];
        if (openDropdown.nextElementSibling.classList.contains('show')) {
            openDropdown.classList.remove('open');
            openDropdown.nextElementSibling.classList.remove('show');
        }
    }
}

function openContextHandle(elem) {

    if (elem.parentElement.querySelector(".context-menu-inner")) {
        generateContextInner(elem.parentElement.querySelector(".context-menu-inner"));
    }

    elem.nextElementSibling.classList.add('show');
    elem.classList.add('open');
    elem.parentElement.querySelector(".context-menu-content").onclick = function (evt) {
        if ((evt.target || evt.srcElement).classList.contains('override')) {
            return;
        }
        evt.preventDefault();
        evt.stopPropagation();

    }

}

function generateContextInner(inner, data?) {

    inner.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i>`;

    if (data) {
        renderLists(inner, data);
    }

    ApiCall('/api/list/get', {}, function (lists) {

        renderLists(inner, lists);

    });

    /*
    return `<label class="context-item" href="#">
    <input type="checkbox" style="display:inline;width:auto;margin-right:4px;"> Mark in Village</label>
<div class="context-item" href="#">Link 2</div>
<div class="context-item" href="#">Link 3</div>
<div class="flex-row"><input type="text" placeholder="New list" class="grow"><button>Add</button>
</div>
`;*/

}

function renderLists(inner, lists) {
    let parentData = getParentData(inner);
    let item_type = parentData.item_type;
    let item_id = parentData.item_id;
    let item_variation = parentData.item_variation;
    inner.innerHTML = ``;

    lists.forEach(function (list) {
        let toggleList = <HTMLElement>document.createElement('label');
        toggleList.style.display = "block";
        toggleList.className = "context-item noselect";
        let addToListText = document.createElement('span');
        addToListText.innerText = " " + list.name;
        let addToListCheckBox = document.createElement('span');
        if (isItemInList(item_id, item_variation, list)) {
            addToListCheckBox.innerHTML = `<i class="fas fa-fw fa-check"></i>`;
        } else {
            addToListCheckBox.innerHTML = `<i class="fas fa-fw fa-plus"></i>`;
        }

        toggleList.appendChild(addToListCheckBox);
        toggleList.appendChild(addToListText);
        inner.appendChild(toggleList);

        toggleList.onclick = function () {
            let loadingIcon = document.createElement('span');
            loadingIcon.innerHTML = `<i class="fas fa-fw fa-sync fa-spin"></i>`;
            toggleList.removeChild(addToListCheckBox);
            toggleList.removeChild(addToListText);
            toggleList.appendChild(loadingIcon);
            toggleList.appendChild(addToListText);
            ApiCall('/api/list/toggle', {
                list: list.slug,
                item_type: item_type,
                item_id: item_id,
                item_variation: item_variation
            }, function (data) {
                renderLists(inner, data);
            });
        }

    });


    if (!lists || lists.length < 5) {
        let new_list = document.createElement("div");
        new_list.className = "flex-row context-item";
        // @ts-ignore
        new_list.style = "padding: 0;display:flex;";

        let new_list_input = document.createElement('input');
        new_list_input.type = "text";
        new_list_input.className = "grow";
        new_list_input.placeholder = "List Name";

        let new_list_button = document.createElement("button");
        new_list_button.className = "override noselect";
        new_list_button.innerHTML = "Add";

        new_list.appendChild(new_list_input);
        new_list.appendChild(new_list_button);

        new_list_button.onclick = function (evt) {

            ApiCall('/api/list/create', {
                list_name: new_list_input.value
            }, function (data) {
                renderLists(inner, data);
            });

            new_list.innerHTML = `<i class="fas fa-fw fa-sync fa-spin"></i>`;
            evt.preventDefault();
            evt.stopPropagation();
        };

        inner.appendChild(new_list);
    }

}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function (event) {
    if (dropdown_handles.length === 0) {
        return;
    }
    let next_check = !!(<HTMLElement>event.target).nextElementSibling;
    let open = false;
    if (next_check) {
        open = !((<HTMLElement>event.target).nextElementSibling.classList.contains('show'));
    }
    clearAllContextHandles();

    if (!next_check) {
        return;
    }

    console.log('do open', open);
    //if (!event.target.matches('.context-handle')) {

    if ((<HTMLElement>event.target).matches('.context-handle') && open) {
        event.preventDefault();
        openContextHandle(event.target);
    }
    //}
};


function removeItemFromList(elem) {
    let item = getParentData(elem);

    if (item.parent) {
        ApiCall('/api/list/toggle', item, function (lists) {
            console.log(lists);
        });
        item.parent.parentElement.removeChild(item.parent)
    }
}


function copyLinkButton(elem, input) {
    elem.classList.remove('slow-transition');
    var copyText: HTMLInputElement = <HTMLInputElement>document.getElementById(input);
    elem.style.backgroundColor = "#5fa0d8";

    copyText.select();
    copyText.setSelectionRange(0, 99999); /*For mobile devices*/

    document.execCommand("copy");
    copyText.blur();
    if (document['selection']) {
        document['selection'].empty();
    } else if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }
    elem.classList.add('slow-transition');
    elem.style.backgroundColor = "rgba(0, 0, 0, 0.1)";

    if (document.getElementById('copy-text')) {
        document.getElementById('copy-text').innerHTML = "Copied!";
    }
}

function modalConfirm() {

}


class DynamicItemSearchResult {
    element;
    item;

    constructor(item, callback) {
        this.element = document.createElement('button');
        this.element.className = "dynamic-search-result btn";
        this.item = item;
        if (item.variation) {
            this.item.name = `${this.item.variation.name} ${this.item.name}`;
        }

        // let image: HTMLImageElement = <HTMLImageElement>document.createElement('img');
        //image.src = item.image_thumb;

        let description: HTMLElement = document.createElement('div');
        //description.innerHTML = `<img class="icon-image" alt="" aria-hidden="true" src="/icons/${item.subcategory || item.category}.png"> ${item.name}`;
        description.innerHTML = `<img class="icon-image" alt="" aria-hidden="true" src="${item.image || ("/icons/" + (item.subcategory || item.category) + ".png")}"> ${item.name}`;

        //this.element.appendChild(image);
        this.element.appendChild(description);

        this.element.onclick = () => {
            callback(item);
        }

    }

    getElement() {
        return this.element;
    }
}

class DynamicItemSearchBar {
    element;
    input_search_bar;
    input_search_results;
    callback;

    constructor(callback) {
        this.callback = callback;
        this.element = document.createElement('div');
        this.element.classList.add("page-search");
        /*<div class="flex-row nowrap page-search">
                <input class="grow" type="text" name="username" id="public_user_username" placeholder="Enter Username"
                       minlength="3" maxlength="32" pattern="[A-Za-z0-9-# ]+"
                       value="<%- (user.contact.username || "") %>">
                <button type="submit" value="Submit"><i class="fas fa-edit"></i> Update<span class="hide-mobile"> Username</span>
                </button>
            </div>*/

        let container = document.createElement("div");
        container.classList.add("flex-row");
        container.classList.add("nowrap");

        this.input_search_bar = document.createElement("input");
        this.input_search_bar.type = "text";
        this.input_search_bar.placeholder = "Enter an Item or Villager";
        this.input_search_bar.classList.add("grow");

        let button_search_bar = document.createElement("button");
        button_search_bar.innerHTML = `<i class="fas fa-times-circle"></i> Clear Search</span>`;
        button_search_bar.onclick = () => {
            this.input_search_bar.value = "";
            this.input_search_results.innerHTML = "";
        };

        this.input_search_results = document.createElement("div");

        container.appendChild(this.input_search_bar);
        container.appendChild(button_search_bar);

        this.element.appendChild(container);
        this.element.appendChild(this.input_search_results);

        this.input_search_bar.onkeyup = () => {
            ApiCall('/trades/api/search', {search: this.input_search_bar.value, difficulty: 1}, (results) => {
                this.input_search_results.innerHTML = "";
                if (!results || results.length === 0) {
                    this.input_search_results.innerHTML = "No results.";
                } else {

                    results.slice(0, 25).forEach((result) => {
                        this.input_search_results.appendChild(new DynamicItemSearchResult(result, callback).getElement());
                    });

                }
            });
        };


    }

    clear() {

    }

    getElement() {
        return this.element;
    }
}


class ItemListItem {
    item;
    element;
    wrapper_image;
    public amount;
    variation;
    count;
    controller: ItemListBuilder;

    constructor(controller, item) {
        this.controller = controller;
        this.item = item;
        this.element = document.createElement('div');
        this.element.className = "variation-item";
        this.amount = 1;
        //this.element.innerHTML = `ITEM: ${item.id}<br/>`;
        this.count = <HTMLInputElement>document.createElement("input");
        this.count.type = "number";
        this.count.value = this.amount;

        this.wrapper_image = document.createElement('div');
        this.wrapper_image.className = "inline-image big";
        let image: HTMLImageElement = <HTMLImageElement>document.createElement('img');
        image.className = "big";
        image.src = item.image;

        console.log(item);

        let itemname = document.createElement('span');
        itemname.className = "btn small-info";
        itemname.innerText = `${item.name}`;

        let line_break = document.createElement('br');

        this.count.onkeyup = () => {
            if (Math.abs(parseInt(this.count.value)) > 0) {
                this.amount = Math.abs(parseInt(this.count.value) || 1);
                this.count.value = this.amount + "";
            }
        }

        let remove = document.createElement('button');
        remove.className = "btn warning";
        remove.innerText = "Remove Item";

        remove.onclick = () => {
            this.remove(item);
        };

        this.element.appendChild(this.count);
        this.element.appendChild(this.wrapper_image);
        this.wrapper_image.appendChild(image);
        this.element.appendChild(itemname);
        this.element.appendChild(line_break);
        this.element.appendChild(remove);
    }

    remove(item) {
        let idx = -1;
        this.controller.items.forEach((i, x) => {
            if (i.item.id === item.id && i.item.variation === item.variation) {
                idx = x;
            }
        });
        if (idx > -1) {
            this.controller.items.splice(idx, 1);
            this.controller.render();
        }
    }

    addOne() {
        this.amount++;
        this.count.value = this.amount + "";
    }

    getElement() {
        return this.element;
    }

    serialize() {
        return {
            amount: this.amount,
            id: this.item.id,
            variation: this.item.variation ? this.item.variation.id : null,
            type: this.item.type
        }
    }
}

class ItemListBuilder {
    element;
    items: Array<ItemListItem>;
    dynamicSearch;
    select_items_container;

    constructor(element, cb?) {
        this.items = [];
        this.element = element;

        let input_data = [];
        if (this.element.innerText.length > 1) {
            let items = JSON.parse(this.element.innerText);
            items.forEach((item) => {
                this.items.push(new ItemListItem(this, item));
            });
            this.element.innerText = "";
        }
        this.element.style.opacity = "1";
        this.select_items_container = document.createElement('div');
        this.select_items_container.className = "dynamic-selected-items variation grid grid-4";
        this.dynamicSearch = new DynamicItemSearchBar((item) => {
            if (cb) {
                return cb(item);
            }
            this.addItem(item);
        });

        this.element.appendChild(this.dynamicSearch.getElement());
        this.element.appendChild(this.select_items_container);
        this.render();
    }

    addItem(item) {

        if (this.items.length < 25) {

            let selected = -1;
            this.items.forEach((have: ItemListItem, idx) => {
                if (have.item.id === item.id && have.item.type === item.type) {
                    selected = idx;
                }
            });

            if (selected > -1) {
                this.items[selected].addOne();
            } else {
                this.items.push(new ItemListItem(this, item));
            }
        } else {
            createFlash('warning', "You've reached the max offer size of 25 items.");
        }

        this.render();

    }

    render() {
        this.select_items_container.innerHTML = "";
        this.items.forEach((have) => {
            this.select_items_container.appendChild(have.getElement());
        });
    }

    serialize() {
        let list = [];
        this.items.forEach((item) => {
            list.push(item.serialize());
        });
        return list;
    }
}

let item_list_builders = [];
let item_list_containers = document.getElementsByClassName('item-list-builder');
for (let i = 0; i < item_list_containers.length; i++) {
    item_list_builders.push(new ItemListBuilder(item_list_containers[i]));
}
let search_item_trade_containers = document.getElementsByClassName('search-item-trade-builder');
for (let i = 0; i < search_item_trade_containers.length; i++) {
    item_list_builders.push(new ItemListBuilder(search_item_trade_containers[i], function (item) {
        console.log(item);
        window.location.href = `/trades/buy/${item.id}${item.variation ? "/" + item.variation.id : ""}`;
    }));
}

function submitItemListBuilderOffer(button: any) {
    if (button.wait) {
        return;
    }
    button.innerHTML = "Please Wait";
    button.wait = true;
    ApiCall('/trades/api/offer', {
        "A": item_list_builders[0].serialize(),
        "B": item_list_builders[1].serialize(),
        bells: parseInt((<HTMLInputElement>document.getElementById("trade-request-bells")).value) || 0,
        negotiable: !!((<HTMLInputElement>document.getElementById("trade-request-negotiable")).checked),
        touch: !!((<HTMLInputElement>document.getElementById("trade-request-touch")).checked),
        notes: ((<HTMLInputElement>document.getElementById("trade-request-notes")).value) || ""
    }, (result) => {
        if (result.status === 1) {
            console.log(result);
            console.log('GOOD WORK SUBMIT ITEM LIST BUILDER');
            if (result.location) {
                window.location.replace(result.location);
            }
        } else {
            console.log('FAILED TO POST TRADE OFFER');
            createFlash('error', result.message || "Unable to Create Trade Offer")
        }
        button.innerHTML = "Submit Sell Offer";
        button.wait = false;
    });
}

function submitOffer(button: any, negotiable, hash) {
    if (button.wait) {
        return;
    }
    button.innerHTML = "Please Wait";
    button.wait = true;

    console.log(button, negotiable, hash);
    if (!negotiable) {

        ApiCall('/trades/api/offer-request', {
            hash: hash
            // offer: item_list_builders[0].serialize(),
            //bells:parseInt((<HTMLInputElement>document.getElementById("trade-request-bells")).value)||0,
            //negotiable:!!((<HTMLInputElement>document.getElementById("trade-request-negotiable")).checked),
            //touch:!!((<HTMLInputElement>document.getElementById("trade-request-touch")).checked),
            //notes:((<HTMLInputElement>document.getElementById("trade-request-notes")).value)||""
        }, (result) => {
            if (result.status === 1) {
                createFlash('info', result.message || "Success");
                console.log('GOOD WORK SUBMIT');
                location.reload();
            } else {
                console.log('FAILED TO POST TRADE OFFER');
                createFlash('error', result.message || "Unable to Create Trade Offer")
            }
            button.innerHTML = "Try Again";
            button.wait = false;
        });


    } else {
        ApiCall('/trades/api/offer-request', {
            hash: hash,
            offer: item_list_builders[0].serialize(),
            bells: parseInt((<HTMLInputElement>document.getElementById("request-bells")).value) || 0,
            touch: !!((<HTMLInputElement>document.getElementById("request-touch")).checked),
            notes: ((<HTMLInputElement>document.getElementById("request-notes")).value) || ""
        }, (result) => {
            if (result.status === 1) {
                createFlash('info', result.message || "Success");
                console.log('GOOD WORK');
            } else {
                console.log('FAILED TO POST TRADE OFFER');
                createFlash('error', result.message || "Unable to Create Trade Offer")
            }
            button.innerHTML = "Try Again";
            button.wait = false;
        });
    }
}

function tradeAcceptOffer(button: any, offer_hash, trade_hash) {
    if (button.wait) {
        return;
    }
    button.innerHTML = "Please Wait";
    button.wait = true;
    ApiCall('/trades/api/accept', {
        offer_hash: offer_hash,
        trade_hash: trade_hash
    }, (result) => {
        console.log(result);
        if (result.status === 1) {
            console.log('GOOD WORK');
            createFlash('info', result.message || "Success");
            if (result.html) {
                document.getElementById('trade-owner-controls').innerHTML = result.html;
            }
        } else {
            console.log('FAILED TO POST TRADE OFFER');
            createFlash('error', result.message || "Unable to Accept Trade Offer")
        }
        button.innerHTML = "Accept Offer";
        button.wait = false;
    });
}

function tradeCloseOffer(button: any, offer_hash, trade_hash) {
    if (button.wait) {
        return;
    }
    button.innerHTML = "Please Wait";
    button.wait = true;
    ApiCall('/trades/api/close', {
        offer_hash: offer_hash,
        trade_hash: trade_hash
    }, (result) => {
        console.log(result);
        if (result.status === 1) {
            console.log('GOOD WORK');
            createFlash('info', result.message || "Success");
            if (result.html) {
                document.getElementById('trade-owner-controls').innerHTML = result.html;
            }
        } else {
            console.log('FAILED TO POST TRADE OFFER');
            createFlash('error', result.message || "Unable to Close Trade Offer")
        }
        button.innerHTML = "Close / Complete Offer";
        button.wait = false;
    });
}

function tradeDeclineOffer(button: any, offer_hash, trade_hash) {
    if (button.wait) {
        return;
    }
    button.innerHTML = "Please Wait";
    button.wait = true;
    ApiCall('/trades/api/decline', {
        offer_hash: offer_hash,
        trade_hash: trade_hash
    }, (result) => {
        console.log(result);
        if (result.status === 1) {
            createFlash('info', result.message || "Success");
            if (result.html) {
                document.getElementById('trade-owner-controls').innerHTML = result.html;
            }
        } else {
            console.log('FAILED TO POST TRADE OFFER');
            createFlash('error', result.message || "Unable to Decline Trade Offer")
        }
        button.innerHTML = "Decline Offer";
        button.wait = false;
    });
}


function tradeCancelOffer(button: any, offer_hash, trade_hash) {
    if (button.wait) {
        return;
    }
    button.innerHTML = "Please Wait";
    button.wait = true;
    ApiCall('/trades/api/cancel', {
        offer_hash: offer_hash,
        trade_hash: trade_hash
    }, (result) => {
        console.log(result);
        if (result.status === 1) {
            createFlash('info', result.message || "Trade Cancelled");
            if (result.html) {
                document.getElementById('trade-owner-controls').innerHTML = result.html;
            }
        } else {
            console.log('FAILED TO POST TRADE OFFER');
            createFlash('error', result.message || "Unable to Cancel Trade")
        }
        button.innerHTML = "Cancel Offer";
        button.wait = false;
    });
}

const flashLength = 6 * 1000;

function checkFlashes() {
    let flashes: any = document.querySelectorAll("#flash .container");
    console.log(flashes);

    flashes.forEach((flash: HTMLElement) => {
        window.setTimeout(function () {
            flash.style.height = "0px";//parentElement.removeChild(flash);
            window.setTimeout(function () {
                flash.parentElement.removeChild(flash);
            }, 300);
        }, flashLength);
    })
}

checkFlashes();

function createFlash(type, message) {
    let container = document.createElement('div');
    container.className = "container " + type;
    container.innerHTML = message;
    document.getElementById('flash').appendChild(container);

    window.setTimeout(function () {
        container.style.height = "0px";//parentElement.removeChild(flash);
        window.setTimeout(function () {
            container.parentElement.removeChild(container);
        }, 300);
    }, flashLength);

}

function setupToggle(handle, element) {
    if (!handle || !element) {
        return;
    }
    console.log("SETUP", handle, element);

    function clickHandle() {
        if (element.classList.contains('open')) {
            console.log('close');
            handle.classList.remove('open');
            element.classList.remove('open')
        } else {
            console.log('open');
            handle.classList.add('open');
            element.classList.add('open')
        }
    }

    handle.onclick = clickHandle;
}


function menuToggler() {
    setupToggle(document.getElementById('toggle-nav'), document.getElementById('nav-layer'))
    setupToggle(document.getElementById('toggle-profile'), document.getElementById('profile-layer'))
}

menuToggler();