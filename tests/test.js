"use strict";

const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const test = require('tape');

const before = test;
const after = test;
const tmpDir = 'tests/tmp';
const inputFile = `${tmpDir}/index.html`;
const outputFile = `${tmpDir}/output.html`;
const cssFiles = ['styles1.css', 'styles2.css', 'styles3.css'];
const jsFiles = ['script1.js', 'script2.js', 'script3.js'];

const setup = () => {

    try {
        fs.lstatSync(tmpDir);
    }
    catch(e) {
        fs.mkdirSync(tmpDir);
    }
    
    fs.writeFileSync(`${inputFile}`, `
        <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Replacer</title>
                    <base href="/" />
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    
                    <!-- inject:css -->
                    <link rel="stylesheet" href="/client/css/styles.css">
                    <!-- endinject -->
            
                </head>
                <body>
            
                    <div></div>
            
                    <!-- remove:development -->
                    <script src="lib/profiler.js"></script>
                    <!-- endremove -->
            
                    <script src="/src/jquery.js"></script>
                    
                    <!-- inject:js -->
                    <script src="/client/js/build.js"></script>
                    <!-- endinject -->
            
                    <!-- remove:production -->
                    <script src="http://localhost:35729/livereload.js?snipver=1"></script>
                    <!-- endremove -->
                </body>
            </html>

    `);
    
    cssFiles.forEach((file) => {
        fs.writeFileSync(`${tmpDir}/${file}`, `
            body {
                padding: 0;
                margin: 10px;
            }
        `);
    });
    
    jsFiles.forEach((file) => {
        fs.writeFileSync(`${tmpDir}/${file}`, `
            console.log('${file}');
        `);
    });
};

before('test setup', (t) => {
    setup();
    t.end();
});

test('test injection of all stylesheets in directory', (t) => {
    exec(`./replacer -i ${inputFile} -o ${outputFile} -c ${tmpDir}`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            cssFiles.forEach((file) => {
                t.equal(true, data.indexOf(`${tmpDir}/${file}`) !== -1, `expect ${file} to be injected`);
            });

            t.end();
        });
    });
});

test('test injection of all javascripts in directory', (t) => {
    exec(`./replacer -i ${inputFile} -o ${outputFile} -j ${tmpDir}`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            jsFiles.forEach((file) => {
                t.equal(true, data.indexOf(`${tmpDir}/${file}`) !== -1, `expect ${file} to be injected`);
            });

            t.end();
        });
    });
});

test('test injection of single stylesheet', (t) => {
    exec(`./replacer -i ${inputFile} -o ${outputFile} -c ${tmpDir}/${cssFiles[0]}`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            t.equal(true, data.indexOf(`${tmpDir}/${cssFiles[0]}`) !== -1, `expect ${cssFiles[0]} to be injected`);

            t.end();
        });
    });
});

test('test injection of single javascript', (t) => {
    exec(`./replacer -i ${inputFile} -o ${outputFile} -j ${tmpDir}/${jsFiles[0]}`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            t.equal(true, data.indexOf(`${tmpDir}/${jsFiles[0]}`) !== -1, `expect ${jsFiles[0]} to be injected`);

            t.end();
        });
    });
});

test('test removal of development code', (t) => {
    exec(`./replacer -i ${inputFile} -o ${outputFile} -r development`, (err) => {
        const devRegex = new RegExp('(<!\\-\\- remove:development \\-\\->)([\\s\\S]*?)(<!\\-\\- endremove \\-\\->)');
        const prodRegex = new RegExp('(<!\\-\\- remove:production \\-\\->)([\\s\\S]*?)(<!\\-\\- endremove \\-\\->)');
        
        fs.readFile(`${outputFile}`, (err, data) => {
            t.equal(false, devRegex.test(data), `expect development code to be removed`);
            t.equal(true, prodRegex.test(data), `expect production code to not be removed`);
            
            t.end();
        });
    });
});

test('test removal of production code', (t) => {
    exec(`./replacer -i ${inputFile} -o ${outputFile} -r production`, (err) => {
        const prodRegex = new RegExp('(<!\\-\\- remove:production \\-\\->)([\\s\\S]*?)(<!\\-\\- endremove \\-\\->)');
        const devRegex = new RegExp('(<!\\-\\- remove:development \\-\\->)([\\s\\S]*?)(<!\\-\\- endremove \\-\\->)');

        fs.readFile(`${outputFile}`, (err, data) => {
            t.equal(false, prodRegex.test(data), `expect production code to be removed`);
            t.equal(true, devRegex.test(data), `expect development code to not be removed`);

            t.end();
        });
    });
});

after('test cleanup', (t) => {
    exec(`rm -rf ${tmpDir}`, () => {
        t.end();
    });
});