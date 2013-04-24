var path = require('path')
  , rootPath = path.normalize(__dirname + '/..');


module.exports = {
    development: {
        db: 'mongodb://localhost/test',
        root: rootPath,
        app: {
            name: 'Divid'
        }
    }
}


