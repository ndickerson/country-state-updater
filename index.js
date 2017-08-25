const rp = require('request-promise');
const fs = require('fs');

// TODO: Change this to your corp url, like: 'https://rest9.bullhornstaffing.com/rest-services/abc123'
const restUrl = 'TODO';

// TODO: Change this to your BhRestToken pulled from the browser's Local Storage:
const bhRestToken = 'TODO';

// REST Calls
let countryQuery = restUrl + '/query/Country?fields=id,code,name,states[0](id)&where=id=2447&count=200&BhRestToken=' + bhRestToken;
let countryQuery2 = countryQuery + '&start=201';
let stateQuery = restUrl + '/query/State?fields=code,name,country(id)&count=200&BhRestToken=' + bhRestToken + '&where=country.id=';

let file = 'Countries.ts';

// Convenience method to call request-promise with a single argument
const buildGetRequest = (url) => {
    return rp({
        method: 'GET',
        uri: url,
        json: true
    });
};

// Takes the complete json object to output to file, converts to a string, corrects formatting and writes
let writeFile = (countries) => {
    // Convert to string
    let output = JSON.stringify(countries, null, '    ');

    // Prepend with the const variable
    output = 'export const COUNTRIES = ' + output;

    // Change all string keys to named keys
    output = output.replace(/\"(\w*)\":/g, '$1:');

    // Change all double quotes to single quotes
    output = output.replace(/\"(.*)\"/g, '\'$1\'');

    // Escape all single quotes in strings
    output = output.replace(/\'(.*[^\\])\'(.*)\'/g, '\'$1\\\'$2\'');
    output = output.replace(/\'(.*[^\\])\'(.*)\'/g, '\'$1\\\'$2\'');
    output = output.replace(/: \'\'/g, ': \'\\\'');

    // Strip extra whitespace
    output = output.replace(/[ ]{2,}\'/g, '\'');

    // Put continuing sibling object declarations on the same line
    output = output.replace(/\,\n\W+\{/g, ', {');

    fs.writeFileSync(file, output);
};

// Make rest calls then call the writer
Promise.all([buildGetRequest(countryQuery), buildGetRequest(countryQuery2)]).then(results => {
    // Combine both country rest calls into one
    let countries = results[0].data.concat(results[1].data);

    // Sort countries by id ascending
    countries = countries.sort((a, b) => {
        return (a.id > b.id) - (b.id > a.id);
    });

    // For all countries without states, change their state object to be an empty array (not the rest returned value)
    countries = countries.map(country => {
        if (country.states.total === 0) {
            country.states = [];
        }
        return country;
    });

    let countriesWithStates = countries.filter(country => country.states.total);

    // Get all states for all countries that have states in the database
    let stateRequests = countriesWithStates.map(country => {
        return buildGetRequest(stateQuery + country.id);
    });
    Promise.all(stateRequests).then(results => {

        // Fill in the country -> states with updated rest call info
        countries = countries.map(country => {
            for (let stateResult of results) {

                // Sort states by code ascending
                stateResult.data = stateResult.data.sort((a, b) => {
                    return (a.name > b.name) - (b.name > a.name);
                });

                // Copy over only what's needed out of the state data
                if (stateResult.data && stateResult.data.length && stateResult.data[0].country.id === country.id)  {
                    country.states = stateResult.data.map(state => {
                        return {
                            code: state.code,
                            name: state.name
                        }
                    });
                    return country;
                }
            }

            writeFile(countries);
        });
    }).catch(err => {
        console.log('err:', err);
    });
}).catch(err => {
    console.log('err:', err);
});
