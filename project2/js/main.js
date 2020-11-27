"use strict";
// Prepare the object array of returned cards outside of the load function so it can be tested for duplicates before it is finalized
let dataString = "";
let allReturnedCards = [];
let limit = 50;

// Set up a count for the number of times this site wants to make api calls and how many times it successfully makes api calls
let numSearches = 0;
let numQueries = 0;

let pokemonSubtypes = [];
let trainerSubtypes= [];
let energySubtypes = [];
let pokemonFilterChecked = [];
let trainerFilterChecked = [];
let energyFilterChecked = [];

// Declare these variables in script scope so they can be used in multiple functions
let expressionsArray;
let expression;
let prefix;
let url;

let lastSearchResults;
let lastSearchKey;

// Set up all of the website's button functionality in onload
$(function init(){
    // Both search buttons use the getData function to search through the API
    $("#header-search-button").on('click', function(){getData(false)});
    $("#main-search-button").on('click', function(){getData(true)});

    // Each header checkbox of card types toggles all of its subtype checkboxes
    pokemonSubtypes = [...$("#pokemon-subtypes input")];
    trainerSubtypes = [...$("#trainer-subtypes input")];
    energySubtypes = [...$("#energy-subtypes input")];
    $("#pokemon").on('change', function(){checkboxHeader($("#pokemon")[0], pokemonSubtypes)});
    $("#trainer").on('change', function(){checkboxHeader($("#trainer")[0], trainerSubtypes)});
    $("#energy").on('change', function(){checkboxHeader($("#energy")[0], energySubtypes)});

    // Require at least one pokemon subtype checkbox to be checked to display the card energy type filter
    $("#pokemon").on('change', function(){toggleCheckboxes(pokemonSubtypes, $("#card-energy-types input"), $("#card-energy-types")[0])});
    $("#pokemon-subtypes input").on('change', function(){toggleCheckboxes(pokemonSubtypes, $("#card-energy-types input"), $("#card-energy-types")[0])});

    // Let the filter section be able to slide in and out from the left side of the screen
    $("#filter-toggle").click(function() {
        $("#advanced").animate({
            width: "toggle"
        });
    });
    $("#close").click(function() {
        $("#advanced").animate({
            width: "toggle"
        });
    });

    // Save search values and the last search in browser storage
    browserStorage();

    lastSearchResults = $("#content")[0];
    lastSearchKey = "nsw7227-results";
    const storedResults = sessionStorage.getItem(lastSearchKey);
    if (storedResults)
    {
        lastSearchResults.innerHTML = storedResults;
    }

    // If the user clicks advanced search from a card specific page, bring them to a general results page
    toAdvancedSearch();
    // If the user used the header search from a card specific page, apply the search on the main page
    outsideSearch();
})

function getData(isMainSearch)
{
    // Reset the returned cards for the next search
    dataString = "";
    $("#success")[0].innerHTML = "";
    allReturnedCards = [];
    numSearches = 0;
    numQueries = 0;
    limit = parseInt($("#limit")[0].value);

    // Main entry point to web service
    const SERVICE_URL = "https://api.pokemontcg.io/v1/cards?";
    url = SERVICE_URL + "pageSize=1000";
    numQueries += 1;

    //#region Name Search
    // Get both possible name search values
    let headerTerm = $("#header-search")[0].value;
    let mainTerm = $("#main-search")[0].value;
    let term;

    // Check which of the two inputs have values
    // When a user presses the search button in the header and there is a value in that search box
    if (headerTerm && !isMainSearch)
    {
        term = headerTerm;
        $("#header-search")[0].value = "";
    }
    // When a user presses the main search button and there is a value in that name search box
    else if (mainTerm && isMainSearch)
    {
        term = mainTerm;
    }

    // Make the name search usable for the API
    if (term)
    {
        term = term.trim();
        term = encodeURIComponent(term);

        url += "&name=" + term;
    }
    //#endregion

    //#region HP Range Search
    // Get possible health range values
    let health = $(".hp")[0].value;
    let queryType = "&hp=";
    expressionsArray = $(".hp-radio");

    getSelectedExpression();
    addRangeSearchToUrl(health, queryType);
    //#endregion

    //#region Attack Damage Range Search
    let atkDmg = $(".atkdmg")[0].value;
    queryType = "&attackDamage=";
    expressionsArray = $(".atkdmg-radio");

    getSelectedExpression();
    addRangeSearchToUrl(atkDmg, queryType);
    //#endregion

    //#region Attack Cost Range Search
    let atkCost = $(".atkcost")[0].value;
    queryType = "&attackCost=";
    expressionsArray = $(".atkcost-radio");

    getSelectedExpression();
    addRangeSearchToUrl(atkCost, queryType);
    //#endregion

    //#region Retreat Cost Range Search
    let retrCost = $(".retrcost")[0].value;
    queryType = "&convertedRetreatCost=";
    expressionsArray = $(".retrcost-radio");
    
    getSelectedExpression();
    addRangeSearchToUrl(retrCost, queryType);
    //#endregion

    //#region  Card Text Search
    // Get a possible search be card text parameter
    let descText;
    if (isMainSearch)
    {
       descText = $("#desc-search")[0].value;
    }

    // Set up multiple urls for an additive search
    let multipleSearchUrls = [url];
    let attackNameUrl = url;
    let attackTextUrl = url;
    let ancientTraitUrl = url;
    let abilityNameUrl = url;
    let abilityTextUrl = url;

    // Make the text search usable for the API
    if (descText)
    {
        descText = descText.trim();
        descText = encodeURIComponent(descText);

        url += "&text=" + descText;
        attackNameUrl += "&attackName=" + descText;
        attackTextUrl += "&attackText=" + descText;
        ancientTraitUrl += "&ancientTrait=" + descText;
        abilityNameUrl += "&abilityName=" + descText;
        abilityTextUrl += "&abilityText=" + descText;
        multipleSearchUrls = [url, attackNameUrl, attackTextUrl, ancientTraitUrl, abilityNameUrl, abilityTextUrl];
        numQueries += 5;
    }
    //#endregion

    //#region Card Type Filter
    pokemonSubtypes = [...$("#pokemon-subtypes input")];
    trainerSubtypes = [...$("#trainer-subtypes input")];
    energySubtypes = [...$("#energy-subtypes input")];
    pokemonFilterChecked = [];
    trainerFilterChecked = [];
    energyFilterChecked = [];
    let numSupertypes = 0;

    // Only apply filters when using the main search button and not the header search button
    if (isMainSearch)
    {
        // Add all checked subtype filters to their respective array and count how many filtered supertypes there are
        if (getChecked(pokemonSubtypes, pokemonFilterChecked))
        {
            numSupertypes++;
        }
        if (getChecked(trainerSubtypes, trainerFilterChecked))
        {
            numSupertypes++;
        }
        if (getChecked(energySubtypes, energyFilterChecked))
            {
                numSupertypes++;
            }

        // If the user selects either 1 or 2 supertypes through the filter, search for all of those supertypes specifically
        if (numSupertypes == 1 || numSupertypes == 2)
        {
            if (multipleSearchUrls.length > 0)
            {
                let numUrls = multipleSearchUrls.length;
                for (let i = 0; i < numUrls; i++)
                {
                    if (pokemonFilterChecked.length > 0)
                    {
                        let newUrl = multipleSearchUrls[i];
                        newUrl += "&supertype=pokemon";
                        multipleSearchUrls.push(newUrl);
                    }
                    if (trainerFilterChecked.length > 0)
                    {
                        let newUrl = multipleSearchUrls[i];
                        newUrl += "&supertype=trainer";
                        multipleSearchUrls.push(newUrl);
                    }
                    if (energyFilterChecked.length > 0)
                    {
                        let newUrl = multipleSearchUrls[i];
                        newUrl += "&supertype=energy";
                        multipleSearchUrls.push(newUrl);
                    }
                }
                // Remove the base queries that would have been used if not filtered
                for (let j = 0; j < numUrls; j++)
                {
                    multipleSearchUrls.shift();
                }
                numQueries = multipleSearchUrls.length;
            }
        }
    }
    //#endregion

    // Let the user know the site is searching for an appropriate response
    if (!term && !descText && !health && !atkDmg && !atkCost && !retrCost)
    {
        $("#loading")[0].innerHTML = `<p>Searching from all cards</p>`;
    }
    else
    {
        if (!term)
        {
            term = " ";
        }
        if (!descText)
        {
            descText = " ";
        }
        $("#loading")[0].innerHTML = `<p>Searching for '${term}' with desciption '${descText}'</p>`;
    }
    $("#content")[0].innerHTML = "";

    // If the user is performing a card text search and/or filtering by card type, search for multiple parameters that card text encompases then remove the duplicates
    if (multipleSearchUrls.length > 0)
    {
        multipleSearchUrls.forEach(searchUrl => $.ajax({
            dataType: "json",
            url: searchUrl,
            data: null,
            success: jsonLoaded,
            error: getDataError
        }));
    }
}

// Return a list of cards matching the query and add qualifying cards to the list of all cards to display
function jsonLoaded(obj)
{
    numSearches++;

    // If there are results
    if (obj.cards && obj.cards.length > 0)
    {
        // Loop through the array of results from the search
        let results = obj.cards;

        for (let i = 0; i < results.length; i++)
        {
            let result = results[i];
            allReturnedCards.push(result);
        }
    }

    // If some results have been found and this is the last search of the API, display the results to the user
    if (allReturnedCards.length > 0 && numSearches == numQueries)
    {
        // Use a set to make sure every card in the final list that is displayed to the user has a unique id
        // Map all of the unique ids into a set and then make an array back out of all of the cards with unique id's
        let uniqueCards = [...new Set(allReturnedCards.map(card => card.id))];
        allReturnedCards = uniqueCards.map(id => {return allReturnedCards.find(card => card.id === id)});

        //#region Filter Logic

        //#region Card type Filter
        let subtypeFilter = [];
        subtypeFilter = subtypeFilter.concat(pokemonFilterChecked);
        subtypeFilter = subtypeFilter.concat(trainerFilterChecked);
        subtypeFilter = subtypeFilter.concat(energyFilterChecked);


        // If any subtype filters are checked, apply the filter
        if (subtypeFilter.length > 0)
        {
            applyFilter(filterBySubtype, subtypeFilter);
        }
        //#endregion

        //#region Energy Type Filter
        let energyTypes = [...$(".types")];
        let energyTypesFilterChecked = [];

        if (getChecked(energyTypes, energyTypesFilterChecked))
        {
            applyFilter(filterByEnergyType, energyTypesFilterChecked);
        }
        //#endregion

        //#region Rarity Filter
        let rarities = [...$(".rarity")];
        let rarityFilterChecked = [];

        if (getChecked(rarities, rarityFilterChecked))
        {
            applyFilter(filterByRarity, rarityFilterChecked);
        }
        //#endregion
        //#endregion

        //#region Sort Logic
        let sortOption = $("#sorting")[0].value;
        let sortedCards = [];

        switch(sortOption)
        {
            case "nameAsc":
                sortedCards = (allReturnedCards.map(card => {return {name: card.name, id: card.id}})).sort((a, b) => (a.name > b.name) ? 1 : -1);
                allReturnedCards = sortedCards.map(name => {return allReturnedCards.find(card => card.id === name.id)});
                break;
        
            case "nameDec":
                sortedCards = (allReturnedCards.map(card => {return {name: card.name, id: card.id}})).sort((a, b) => (a.name > b.name) ? 1 : -1).reverse();
                allReturnedCards = sortedCards.map(name => {return allReturnedCards.find(card => card.id === name.id)});
                break;
        
            case "numberAsc":
                sortedCards = (allReturnedCards.map(card => {return {number: card.number, id: card.id}})).sort((a, b) => a.number-b.number);
                allReturnedCards = sortedCards.map(number => {return allReturnedCards.find(card => card.id === number.id)});
                break;
        
            case "numberDec":
                sortedCards = (allReturnedCards.map(card => {return {number: card.number, id: card.id}})).sort((a, b) => a.number-b.number).reverse();
                allReturnedCards = sortedCards.map(number => {return allReturnedCards.find(card => card.id === number.id)});
                break;
        }
        //#endregion

        // Filter out any duplicates that might occur from sorting
        uniqueCards = [...new Set(allReturnedCards.map(card => card.id))];
        allReturnedCards = uniqueCards.map(id => {return allReturnedCards.find(card => card.id === id)});

        // Reduce number of returned cards to set limit
        while (allReturnedCards.length > limit)
        {
            allReturnedCards.pop();
        }

        for (let card of allReturnedCards)
        {
            let image = card.imageUrl;
            let entry = `<div class="result"><a href="https://people.rit.edu/nsw7227/235/project2/individual-card.html?id=${card.id}"><img src="${image}" title="${card.id}"></a></div>`;
            dataString += entry;
        }
    
        // Check again to see if there is any cards that match the filters selected by the user
        if (allReturnedCards.length > 0)
        {
            $("#content")[0].innerHTML = dataString;
            sessionStorage.setItem(lastSearchKey, lastSearchResults.innerHTML);
            $("#loading")[0].innerHTML = "Results found!";
            $("#success")[0].innerHTML = `<p>Showing ${allReturnedCards.length} cards that match the search</p>`
        }
    }
    // If this is not the last search, then continue through the loop
    else if (numSearches > 0 && numSearches != numQueries)
    {

    }
    // If no results are found
    else {
        $("#content")[0].innerHTML = "<p>No results found</p>";
    }
}

function getDataError ()
{
    $("#content")[0].innerHTML = "<p>Invalid search query</p>";
}

// When a search button is pressed, get the current selected expression from a range search
function getSelectedExpression()
{
        // Find the radio button that is checked from the array and get its value
        for (let option of expressionsArray)
        {
            if (option.checked)
            {
                expression = option.value;
            }
        }
        // Change the query based on what radio button is selected
        switch (expression)
        {
            case "less-than":
                prefix = "lte";
                break;
            case "equal":
                prefix = "";
                break;
            case "greater-than":
                prefix = "gte";
                break;
        }
}

// Make the process of adding the search parameters for a range search easier
function addRangeSearchToUrl(input, type)
{
    // Query the values that have been defined by the user
    if (input)
    {
        if (Number.isInteger(parseInt(input)))
        {
                url += type + prefix + input;
        }
    }
}

// A compartmentalized way of checking if any checkboxes are currently checked out of an array
function getChecked(arrayToCheck, arrayToFill)
{
    for (let type of arrayToCheck)
    {
        if (type.checked)
        {
            arrayToFill.push(type);
        }
    }
    if (arrayToFill.length > 0)
    {
        return true;
    }
    else 
    {
        return false;
    }
}

// Specific code for filtering by subtype to be passed into an applyFilter function call
function filterBySubtype(arrayToFilter, checkedArray, iteration)
{
    let newArray = [];
    for (let i = 0; i < arrayToFilter.length; i++)
    {
        if (arrayToFilter[i].subtype == checkedArray[iteration].value)
        {
            newArray.push(arrayToFilter[i]);
        }
    }
    return newArray;
}

// Specific code for filtering by rarity to be passed into an applyFilter function call
function filterByRarity(arrayToFilter, checkedArray, iteration)
{
    let newArray = [];
    for (let i = 0; i < arrayToFilter.length; i++)
    {
        if (arrayToFilter[i].rarity == checkedArray[iteration].value)
        {
            newArray.push(arrayToFilter[i]);
        }
    }
    return newArray;
}

// Specific code for filtering by energy type to be passed into an applyFilter function call
function filterByEnergyType(arrayToFilter, checkedArray, iteration)
{
    let newArray = [];
    for (let i = 0; i < arrayToFilter.length; i++)
    {
        if (!arrayToFilter[i].types || arrayToFilter[i].types.length == 0)
        {
            
        }
        else 
        {
            for (let type of arrayToFilter[i].types)
            {
                if (type == checkedArray[iteration].value)
                {
                    newArray.push(arrayToFilter[i]);
                }
            }
        }
    }
    return newArray;
}

// A way to prevent myself from repeating the same code when applying multiple filters on a search
// Utilizes other functions for more specific code
function applyFilter(filterType, checkedArray)
{
    let filteredCards = [];

    for (let i = 0; i < checkedArray.length; i++)
    {
        let successfulMatch = filterType(allReturnedCards, checkedArray, i);
        
        if (i == 0)
        {
            filteredCards = successfulMatch;
        }
        else 
        {
            filteredCards = filteredCards.concat(successfulMatch);
        }
    }
    allReturnedCards = filteredCards;

    if (allReturnedCards.length == 0)
    {
        $("#content")[0].innerHTML = "<p>No results found</p>";
        return;
    }
}

// Gives a checkbox functionality that when it is checked, all the checkboxes in an array are also checked
function checkboxHeader(header, checkboxArray)
{
    for (let box of checkboxArray)
    {
        box.checked = header.checked;
    }
}

// Allows a whole array of checkboxes to display or not based on if any of the passed in checkboxes are checked
function toggleCheckboxes(determinantArray, affectedArray, toggledDiv)
{
    let numChecked = 0;

    for (let box of determinantArray)
    {
        if (box.checked)
        {
            numChecked++;
        }
    }
    if (numChecked > 0)
    {
        toggledDiv.style.display = "grid";
    }
    else 
    {
        for (let box of affectedArray)
        {
            box.checked = false;
        }
        toggledDiv.style.display = "none";
    }
}

// Restricts input for number values to what the min and max is
// If the user types something over or below these numbers this functions autocorrects it to whatever is closest, the min or the max
function enforceMinMax(input)
{
    if(input.value != "")
    {
      if(parseInt(input.value) < parseInt(input.min))
      {
        input.value = input.min;
      }
      if(parseInt(input.value) > parseInt(input.max))
      {
        input.value = input.max;
      }
    }
}

// Let the two text search fields inputs be saved to local storage and accessed whenever coming back to the site
// Let the two selects for managing results also be stored and accessed when coming back to the site
function browserStorage()
{
    const nameField = $("#main-search")[0];
    const textField = $("#desc-search")[0];
    /*const hpField = $(".hp")[0];
    const atkDmgField = $(".atkdmg")[0];
    const atkCostField = $(".atkcost")[0];
    const retreatCostField = $(".retrcost")[0];
    */
    const limitField = $("#limit")[0];
    const sortField = $("#sorting")[0];

    const prefix = "nsw7227-";
    const nameKey = prefix + "name";
    const textKey = prefix + "text";
    /*const hpKey = prefix + "hp";
    const atkDmgKey = prefix + "atkdmg";
    const atkCostKey = prefix + "atkcost";
    const retreatCostKey = prefix + "retrcost";
    */
    const limitKey = prefix + "limit";
    const sortKey = prefix + "sort";

    // Grab any already stored data
    const storedName = localStorage.getItem(nameKey);
    const storedText = localStorage.getItem(textKey);
    /*const storedHp = localStorage.getItem(hpKey);
    const storedAtkDmg = localStorage.getItem(atkDmgKey);
    const storedAtkCost = localStorage.getItem(atkCostKey);
    const storedRetreatCost = localStorage.getItem(retreatCostKey);
    */
    const storedLimit = localStorage.getItem(limitKey);
    const storedSort = localStorage.getItem(sortKey);

    // If there is a previously set value, use it
    if (storedName)
    {
        nameField.value = storedName;
    }
    if (storedText)
    {
        textField.value = storedText;
    }
    /*if (storedHp)
    {
        hpField.value = storedHp;
    }
    if (storedAtkDmg)
    {
        atkDmgField.value = storedAtkDmg;
    }
    if (storedAtkCost)
    {
        atkCostField.value = storedAtkCost;
    }
    if (storedRetreatCost)
    {
        retreatCostField.value = storedRetreatCost;
    }
    */
    if (storedLimit)
    {
        $(`#limit option[value="${storedLimit}"]`)[0].selected = true;
    }
    if (storedSort)
    {
        $(`#sorting option[value="${storedSort}"]`)[0].selected = true;
    }

    // When the user changes a field that is stored, update the local and session storage
    nameField.onchange = e => {localStorage.setItem(nameKey, e.target.value); };
    textField.onchange = e => {localStorage.setItem(textKey, e.target.value); };
    /*hpField.onchange = e => {localStorage.setItem(hpKey, e.target.value); };
    atkDmgField.onchange = e => {localStorage.setItem(atkDmgKey, e.target.value); };
    atkCostField.onchange = e => {localStorage.setItem(atkCostKey, e.target.value); };
    retreatCostField.onchange = e => {localStorage.setItem(retreatCostKey, e.target.value); };
    */
    limitField.onchange = e => {localStorage.setItem(limitKey, e.target.value); };
    sortField.onchange = e => {localStorage.setItem(sortKey, e.target.value); };
}

// If the user searches from the header search bar in a card specific page, parse the query sent through the url, search, and return the url to normal
function outsideSearch()
{
    let hrefSplit = window.location.href.split('?');

    if (hrefSplit.length > 1)
    {
        let parsedSearch = hrefSplit[1].split('=');
        let parsedTerm = parsedSearch[1];

        $("#header-search")[0].value = parsedTerm;
        getData(false);
        window.history.replaceState({}, document.title, "https://people.rit.edu/nsw7227/235/project2/index.html");
    }
}

// If the user presses advanced from a card specific page, bring them back to the main site, do a search without changing any fields from their 
// local storage values, and let the user have more options to search and filter their search
function toAdvancedSearch()
{
    let hrefSplit = window.location.href.split('?');

    if (hrefSplit.length > 1)
    {
        let parsedTerm = hrefSplit[1];

        if (parsedTerm == "advanced")
        {
            getData(true);
            window.history.replaceState({}, document.title, "https://people.rit.edu/nsw7227/235/project2/index.html");
        }
    }
}