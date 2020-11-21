"use strict";
let card = {};

$(function onLoad(){
    // Display the picture and details for the card passed into the url of the site
    findCard();
    // Enable both the search and advanced button to give the user more ways to return to searching for more cards
    $("#header-search-button").on('click', headerSearch);
    $("#to-advanced").on('click', advancedSearch);
})

// Get the data of the parsed card from the api and display it to the user
function findCard()
{
    let cardUrl = "https://api.pokemontcg.io/v1/cards?" + getCardID();

    $.ajax({
        datatype: "json",
        url: cardUrl,
        data: null,
        success: getCardData,
        error: getCardError
    })
}

// Parse the id of the card through the query in the url of the site
function getCardID()
{
    let urlStrings = window.location.href.split('?');
    let queryString;
    if (urlStrings.length > 1)
    {
        queryString = urlStrings[1];
    }

    return queryString;
}

function getCardData(obj)
{
    if (obj.cards && obj.cards.length > 0)
    {
        card = obj.cards[0];
        displayCard();
    }
    else 
    {
        return;
    }
}

function getCardError()
{
    $("#details")[0].innerHTML = "<p>Not able to find this card</p>";
}

// Based on the data the card has, show the most important data to the user
function displayCard()
{
    let cardSplit = card.id.split('-');

    $("#image")[0].innerHTML = `<img src="https://images.pokemontcg.io/${cardSplit[0]}/${cardSplit[1]}_hires.png" alt="${card.id}">`;

    $("#name")[0].innerHTML = `<h1>${card.name}</h1>`;
    $("#stats")[0].innerHTML = `<p>${card.supertype}-${card.subtype}</p>`;
    if (card.hp)
    {
        let hpEnergy = `<div id="hp-energy"><p>HP${card.hp}</p><span class="energy-types">`;
    
        for (let i = 0; i < card.types.length; i++)
        {
            hpEnergy += displayEnergyType(card.types[i]);
        }
        hpEnergy += "</span>"
        $("#stats")[0].innerHTML += hpEnergy;
    }
    if (card.evolvesFrom)
    {
        $("#stats")[0].innerHTML += `<p>Evolves From: ${card.evolvesFrom}</p>`;
    }

    if (card.ability)
    {
        $("#ability")[0].innerHTML = `<h1>${card.ability.type}</h1><h2>${card.ability.name}</h2><p>${card.ability.text}</p>`;
    }
    if (card.text && card.supertype == "Pokémon")
    {
        $("#special-rules")[0].innerHTML = `<h1>Special Rules</h1><p>${card.text}</p>`;
    }
    if (card.attacks)
    {
        for (let i = 0; i < card.attacks.length; i++)
        {
            let atkCost = ""
            for (let energy of card.attacks[i].cost)
            {
                atkCost += displayEnergyType(energy);
            }
            $("#attacks")[0].innerHTML += `<div class="attack-line"><span class="energy-types">${atkCost}</span><h2>${card.attacks[i].name}</h2><p>${card.attacks[i].damage}</p></div><div><p>${card.attacks[i].text}</p></div>`;
        }
    }
    if (card.text && card.supertype != "Pokémon")
    {
        $("#text")[0].innerHTML = `<p>${card.text}</p>`;
    }

    if (card.supertype == "Pokémon" && card.weaknesses)
    {
        $("#weaknesses")[0].innerHTML = "<h2>Weaknesses</h2>";
        $("#resistances")[0].innerHTML = "<h2>Resistances</h2>";
        $("#retreat")[0].innerHTML = "<h2>Retreat Cost</h2>";
    }
    if (card.weaknesses)
    {
        for (let i = 0; i < card.weaknesses.length; i++)
        {
            $("#weaknesses")[0].innerHTML += `<div class="energy-effect"><span class="energy-types">${displayEnergyType(card.weaknesses[i].type)}</span><p>${card.weaknesses[i].value}</p></div>`;
        }
    }
    if (card.resistances)
    {
        for (let i = 0; i < card.resistances.length; i++)
        {
            $("#resistances")[0].innerHTML += `<div class="energy-effect"><span class="energy-types">${displayEnergyType(card.resistances[i].type)}</span><p>${card.resistances[i].value}</p></div>`;
        }
    }
    if (card.retreatCost)
    {
        let retreatTypes = `<div class="energy-effect"><span class="energy-types">`;
        for (let i = 0; i < card.retreatCost.length; i++)
        {
            retreatTypes += displayEnergyType(card.retreatCost[i]);
        }
        retreatTypes += "</span></div>";
        $("#retreat")[0].innerHTML += retreatTypes;
    }
    $("#card-specific")[0].innerHTML = `<h2>${card.series}</h2><h3>${card.set}</h3><p>#${card.number} ${card.rarity}</p><p>Illustrator: ${card.artist}</p>`;
}

// Allow a search from the header search bar to reroute back to the main page
function headerSearch()
{
    let query = $("#header-search")[0].value;
    let term = "?name=";

    if (query)
    {
        term += query;
        window.location.href = "index.html" + term;
    }
}

// Allow the advanced button to reroute back to the main page
function advancedSearch()
{
    window.location.href = "index.html?advanced";
}

// Display an image of an energy type base on a string of the same name
function displayEnergyType(typeAsString)
{
    switch(typeAsString)
    {
        case "Colorless":
            return `<img src="images/colorless.png" alt="colorless" />`;
        case "Darkness":
            return `<img src="images/darkness.png" alt="darkness" />`;
        case "Dragon":
            return `<img src="images/dragon.png" alt="dragon" />`;
        case "Fairy":
            return `<img src="images/fairy.png" alt="fairy" />`;
        case "Fighting":
            return `<img src="images/fighting.png" alt="fighting" />`;
        case "Fire":
            return `<img src="images/fire.png" alt="fire" />`;
        case "Grass":
            return `<img src="images/grass.png" alt="grass" />`;
        case "Lightning":
            return `<img src="images/lightning.png" alt="lightning" />`;
        case "Metal":
            return `<img src="images/metal.png" alt="metal" />`;
        case "Psychic":
            return `<img src="images/psychic.png" alt="psychic" />`;
        case "Water":
            return `<img src="images/water.png" alt="water" />`;
        default:
            return `<img src="images/blank.png" alt="blank" />`;
    }
}