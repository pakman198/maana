import express from 'express';
import path from 'path';
import fs from 'fs';
import bodyParser from 'body-parser';
import lc from 'letter-count';
import AdmZip from 'adm-zip';

const app = express();

app.use(express.static('static'));
app.set('json spaces', 2); // makes the json response look pretty 
app.use(bodyParser.json());

if(process.env.NODE_ENV !== 'production') {
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');

    const config = require('../webpack.config');
    config.entry.app.push('webpack-hot-middleware/client', 'webpack/hot/only-dev-server');
    config.plugins.push(new webpack.HotModuleReplacementPlugin());
    
    const bundler = webpack(config);
    app.use(webpackDevMiddleware(bundler, { noInfo: true }));
    app.use(webpackHotMiddleware(bundler, { log: console.log }));
}

app.get('/api', (req, res) => {
    fs.readdir(__dirname + '/../', (err, items) => {
        const directories = items.filter(item => {
            if(fs.lstatSync(item).isDirectory() && item !== 'node_modules') return item;

            return null
        })
        res.status('200').json({ directories })
    });
});

app.get('/api/:path', (req, res) => {
    const user_path = req.params.path;

    fs.readdir(__dirname + `/../${user_path}`, (err, items) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.log('File not found!');
                res.status(404).json({
                    message: "The directory doesn't exist"
                });
            } else {
                throw err;
            }

            return;
        }

        const textFiles = items.filter(item => {
            if( item.match(/\.(txt|zip)$/) ) {
                return item;
            } else {
                return null;
            }
        });

        if(textFiles.length === 0){
            res.status('200').json({ files: [], message: "There are no text files on this directory" });
            return;
            
        } else {
            const processedFiles = processFiles(user_path, textFiles);
    
            console.log(processedFiles)
            res.status('200').json({ files: processedFiles, message: "" });
        }
        

    });

});

function processFiles(user_path, files) {
    
    return files.reduce(readFile, []);
    
    function readFile(accumulator, file) {
        const source = path.resolve(__dirname + `/../${user_path}/${file}`);

        if( file.match(/\.txt$/) ) {
            const { words } = lc.countFromFile(
                source, 
                '--words');
    
            return accumulator.concat({
                file,
                wordCount: words
            });
    
        } else {
            const dest = path.resolve(__dirname + `/../${user_path}`);
    
            const zip = new AdmZip(source);
            const entries = zip.getEntries();
            zip.extractAllTo(dest, true);

            // console.log({entries})
    
            const entriesData = entries.map(entry => {
                const { name, getData } = entry;
                if ( !name.match(/\.txt$/) ) return;
    
                const source = path.resolve(__dirname + `/../${user_path}/${name}`);
                const data = getData().toString();
                const { words } = lc.count(data, '--words');
    
                return {
                    file: name,
                    wordCount: words
                }
            });
    
            return accumulator.concat(entriesData);
        }
    } // readFile
}

app.listen(3000, function(){
    console.log('App listening on port 3000');
});