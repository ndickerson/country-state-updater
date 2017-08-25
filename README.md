# Country State Updater #

A node script for generating the JSON list of Countries/States in [Novo-Elements](https://github.com/bullhorn/novo-elements) from Bullhorn REST Calls.

Creates a file called `Countries.ts` that can be diffed with the file of the same name in [Novo-Elements](https://github.com/bullhorn/novo-elements).


### Usage ###

Open the file `index.js` and set the values of: `restUrl` and `bhRestToken`.

```
npm install
npm start
```

The file: `Countries.ts` will now exist in the main directory.