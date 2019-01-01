"use strict";

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const exec = child_process.exec;
const test = require('tape');

const before = test;
const after = test;
const tmpDir = 'tests/tmp';
const inputFile = `${tmpDir}/index.html`;
const outputFile = `${tmpDir}/output.html`;
const cssFiles = ['styles1.css', 'styles2.css', 'styles3.css'];
const jsFiles = ['script1.js', 'script2.js', 'script3.js'];
const jsFilesWildcard = '**/*.js';
const cssFilesWildcard = '**/*.css';
const revision = child_process
                    .execSync('git rev-parse HEAD')
                    .toString().trim();

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

                    <!-- keep:development -->
                    <script src="lib/dev_profiler.js"></script>
                    <!-- endkeep -->
            
                    <script src="/src/jquery.js"></script>
                    
                    <!-- inject:js -->
                    <script src="/client/js/build.js"></script>
                    <!-- endinject -->
            
                    <!-- remove:production -->
                    <script src="http://localhost:35729/livereload.js?snipver=1"></script>
                    <!-- endremove -->

                    <!-- keep:production -->
                    <script src="http://localhost:35729/prod_livereload.js?snipver=1"></script>
                    <!-- endkeep -->
                    
                    <!-- keep:unknown -->
                    <script src="http://localhost:35729/unknown_livereload.js?snipver=1"></script>
                    <!-- endkeep -->
                    
                </body>
            </html>
            <!-- inject:git-hash -->
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
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -c ${tmpDir}`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            cssFiles.forEach((file) => {
                t.equal(true, data.indexOf(`${tmpDir}/${file}`) !== -1, `expect ${file} to be injected`);
            });

            t.end();
        });
    });
});

test('test injection of all javascripts in directory', (t) => {
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -j ${tmpDir}`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            jsFiles.forEach((file) => {
                t.equal(true, data.indexOf(`${tmpDir}/${file}`) !== -1, `expect ${file} to be injected`);
            });

            t.end();
        });
    });
});

test('test injection of single stylesheet', (t) => {
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -c ${tmpDir}/${cssFiles[0]}`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            t.equal(true, data.indexOf(`${tmpDir}/${cssFiles[0]}`) !== -1, `expect ${cssFiles[0]} to be injected`);

            t.end();
        });
    });
});

test('test injection of single javascript', (t) => {
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -j ${tmpDir}/${jsFiles[0]}`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            t.equal(true, data.indexOf(`${tmpDir}/${jsFiles[0]}`) !== -1, `expect ${jsFiles[0]} to be injected`);

            t.end();
        });
    });
});

test('test injection of stylesheets with wildcard', (t) => {
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -c '${cssFilesWildcard}'`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            cssFiles.forEach((file) => {
                t.equal(true, data.indexOf(`${tmpDir}/${file}`) !== -1, `expect ${file} to be injected`);
            });

            t.end();
        });
    });
});

test('test injection of javascripts with wildcard', (t) => {
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -j '${jsFilesWildcard}'`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            jsFiles.forEach((file) => {
                t.equal(true, data.indexOf(`${tmpDir}/${file}`) !== -1, `expect ${file} to be injected`);
            });

            t.end();
        });
    });
});

test('test injection of all stylesheets in directory with ignore', (t) => {
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -c ${tmpDir} -g ${tmpDir}/`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            cssFiles.forEach((file) => {
                t.equal(true, data.indexOf(`\"${file}\"`) !== -1, `expect ${file} to be injected`);
            });

            t.end();
        });
    });
});

test('test injection of all javascripts in directory with ignore', (t) => {
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -j ${tmpDir} -g ${tmpDir}/`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            jsFiles.forEach((file) => {
                t.equal(true, data.indexOf(`\"${file}\"`) !== -1, `expect ${file} to be injected`);
            });

            t.end();
        });
    });
});

test('test injection of single stylesheet with ignore', (t) => {
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -c ${tmpDir}/${cssFiles[0]} -g ${tmpDir}/`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            t.equal(true, data.indexOf(`\"${cssFiles[0]}\"`) !== -1, `expect ${cssFiles[0]} to be injected`);

            t.end();
        });
    });
});

test('test injection of single javascript with ignore', (t) => {
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -j ${tmpDir}/${jsFiles[0]} -g ${tmpDir}/`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            t.equal(true, data.indexOf(`\"${jsFiles[0]}\"`) !== -1, `expect ${jsFiles[0]} to be injected`);

            t.end();
        });
    });
});

test('test injection of stylesheets with wildcard with ignore', (t) => {
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -c '${cssFilesWildcard}' -g ${tmpDir}/`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            cssFiles.forEach((file) => {
                t.equal(true, data.indexOf(`\"${file}\"`) !== -1, `expect ${file} to be injected`);
            });

            t.end();
        });
    });
});

test('test injection of javascripts with wildcard with ignore', (t) => {
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -j '${jsFilesWildcard}' -g ${tmpDir}/`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            jsFiles.forEach((file) => {
                t.equal(true, data.indexOf(`\"${file}\"`) !== -1, `expect ${file} to be injected`);
            });

            t.end();
        });
    });
});

test('test keep and remove development code', (t) => {
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -r development`, (err) => {
        const devRemoveRegex = new RegExp('(<!\\-\\- remove:development \\-\\->)([\\s\\S]*?)(<!\\-\\- endremove \\-\\->)');
        const prodRemoveRegex = new RegExp('(<!\\-\\- remove:production \\-\\->)([\\s\\S]*?)(<!\\-\\- endremove \\-\\->)');
        const devKeepRegex = new RegExp('(<!\\-\\- keep:development \\-\\->)([\\s\\S]*?)(<!\\-\\- endkeep \\-\\->)');
        const prodKeepRegex = new RegExp('(<!\\-\\- keep:production \\-\\->)([\\s\\S]*?)(<!\\-\\- endkeep \\-\\->)');
        const unknownKeepRegex = new RegExp('(<!\\-\\- keep:unknown \\-\\->)([\\s\\S]*?)(<!\\-\\- endkeep \\-\\->)');

        fs.readFile(`${outputFile}`, (err, data) => {
            t.equal(false, devRemoveRegex.test(data), `expect development code to be removed`);
            t.equal(true, prodRemoveRegex.test(data), `expect production code to not be removed`);
            t.equal(true, devKeepRegex.test(data), `expect development code to be kept`);
            t.equal(false, prodKeepRegex.test(data), `expect production code to not be kept`);
            t.equal(false, unknownKeepRegex.test(data), `expect unknown code to not be kept`);

            t.end();
        });
    });
});

test('test keep and remove production code', (t) => {
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -r production`, (err) => {
        const prodRemoveRegex = new RegExp('(<!\\-\\- remove:production \\-\\->)([\\s\\S]*?)(<!\\-\\- endremove \\-\\->)');
        const devRemoveRegex = new RegExp('(<!\\-\\- remove:development \\-\\->)([\\s\\S]*?)(<!\\-\\- endremove \\-\\->)');
        const prodKeepRegex = new RegExp('(<!\\-\\- keep:production \\-\\->)([\\s\\S]*?)(<!\\-\\- endkeep \\-\\->)');
        const devKeepRegex = new RegExp('(<!\\-\\- keep:development \\-\\->)([\\s\\S]*?)(<!\\-\\- endkeep \\-\\->)');
        const unknownKeepRegex = new RegExp('(<!\\-\\- keep:unknown \\-\\->)([\\s\\S]*?)(<!\\-\\- endkeep \\-\\->)');

        fs.readFile(`${outputFile}`, (err, data) => {
            t.equal(false, prodRemoveRegex.test(data), `expect production code to be removed`);
            t.equal(true, devRemoveRegex.test(data), `expect development code to not be removed`);
            t.equal(true, prodKeepRegex.test(data), `expect production code to be kept`);
            t.equal(false, devKeepRegex.test(data), `expect development code to not be kept`);
            t.equal(false, unknownKeepRegex.test(data), `expect unknown code to not be kept`);

            t.end();
        });
    });
});


test('test injection of git hash', (t) => {
    exec(`./postbuild -i ${inputFile} -o ${outputFile} -H`, (err) => {

        fs.readFile(`${outputFile}`, (err, data) => {
            t.equal(true, data.indexOf(revision) !== -1, `expect git hash to be injected`);

            t.end();
        });
    });
});

after('test cleanup', (t) => {
    exec(`rm -rf ${tmpDir}`, () => {
        t.end();
    });
});