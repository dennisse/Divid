var path = require('path')
  , rootPath = path.normalize(__dirname + '/..');


module.exports = {
    development: {
        db: 'mongodb://localhost/Divid'
      , root: rootPath
      , app: {
            name: 'Divid'
        }
      , facebook: {
            clientID:       ''
          , clientSecret:   ''
          , callbackURL:    'https://divid.no/auth/facebook/callback'
        }
      , twitter: {
            clientID:       ''
          , clientSecret:   ''
          , callbackURL:    'https://divid.no/auth/twitter/callback'
        }
      ,  email: {
            server: 'localhost'
        , ssl: false
        }
      , sessionSecret: 'lsdrghoi4hgqio42nqf2uqi32f3bilu23fl23b'
    }
}


