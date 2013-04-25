var path = require('path')
  , rootPath = path.normalize(__dirname + '/..');


module.exports = {
    development: {
        db: 'mongodb://localhost/test',
        root: rootPath,
        app: {
            name: 'Divid'
        },
        facebook: {
            clientID: "504825706245603",
            clientSecret: "e5ea0faed85d8749cafd38732530ef35",
            callbackURL: "https://divid.no/auth/facebook/callback"
        },
        twitter: {
            clientID: "CONSUMER KEY",
            clientSecret: "CONSUMER SECRET",
            callbackURL: "https://divid.no/auth/twitter/callback"
        }
    }
}


