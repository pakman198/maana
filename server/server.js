import express from 'express';
import path from 'path';
import process from 'process';
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

            return;
        })
        res.status('200').json({ directories })
    });
});

app.post('/api/path', (req, res) => {
    const user_path = req.body.dir;

    validatePath(user_path)
    .then(({absolute}) => {
        const directory = absolute ? user_path : __dirname + `/../${user_path}`;

        fs.readdir(directory, (err, items) => {
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
                const processedFiles = processFiles(directory, textFiles);
                const data = processedFiles.reduce((acc, file) => {
                    const { wordsArray } = acc;
                    
                    acc.files.push(file.file);
                    // seems I was mutating the value instead of assigning a new value 
                    // like when setting state on react
                    acc['wordsArray'] = wordsArray.concat(file.words); 
                    
                    return acc;
                }, {files: [], wordsArray: []});

                const wordMap = data.wordsArray.reduce((acc, word) => {
                    acc[word] = (acc[word] || 0) + 1;
                    return acc;
                }, Object.create(null));

                // console.log({wordMap});
        
                if( processedFiles.length === 0){
                    res.status('200').json({ files: [], message: "There are no text files on this directory" });
                } else {
                    res.status('200').json({ files: data.files, wordMap, message: "" });
                }
            }
            

        });
    })
    .catch(err => {
        console.log("Directory doesn't exist!");
        res.status(404).json({
            message: "The directory doesn't exist"
        });
    });
});

function validatePath(user_path) {

    const promise = new Promise((resolve, reject) => {
        const dir = fs.lstat(__dirname + `/../${user_path}`, (err, stat) => {
            if (err) {
                return fs.lstat(user_path, (err, stat) => {
                    console.log(user_path);
                    if(err){
                        reject();
                    }
                    resolve({absolute: true});
                });
            }
    
            resolve({absolute: false});
        });
    
        return dir;
    });

    return promise;
}

function processFiles(user_path, files) {
    
    function readFile(accumulator, file) {
        const source = path.resolve(`${user_path}/${file}`);

        if( file.match(/\.txt$/) ) {
            const text = fs.readFileSync(source, 'utf-8');
            const cleanText = text.toLowerCase().replace(/[\n]/g, " ").replace(/[^a-zA-Z ]/g, "");
            // console.log({cleanText})
            const words = cleanText.split(/[\s]+/g);

            // console.log({words});
    
            return accumulator.concat({
                file,
                words
            });
    
        } else {
            const dest = path.resolve(user_path);
    
            const zip = new AdmZip(source);
            const entries = zip.getEntries();
            zip.extractAllTo(dest, true);

            // console.log({entries})
    
            const entriesData = entries.reduce((acc, entry) => {
                const { name, getData } = entry;
                if ( !name.match(/\.txt$/) ) return acc;
    
                const data = getData().toString();
                const cleanText = data.toLowerCase().replace(/[\n]/g, " ").replace(/[^a-zA-Z ]/g, "");
                const words = cleanText.split(/[\s]+/g);

                // console.log({words});
    
                return acc.concat({
                    file: name,
                    words
                });
            }, []);
    
            return accumulator.concat(entriesData);
        }
    } // readFile

    return files.reduce(readFile, []);
}

app.listen(3000, function(){
    console.log('App listening on port 3000');
});