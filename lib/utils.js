const fs = require('fs');

const removeDir = function (path) {
    if (fs.existsSync(path)) {
        const files = fs.readdirSync(path)

        if (files.length > 0) {
            files.forEach(function (filename) {
                if (fs.statSync(path + "/" + filename).isDirectory()) {
                    removeDir(path + "/" + filename)
                } else {
                    fs.unlinkSync(path + "/" + filename)
                }
            })
            fs.rmdirSync(path)
        } else {
            fs.rmdirSync(path)
        }
    } else {
        console.log("Directory path not found.")
    }
}

const getFiles = function (dir, filelist) {
    var files = fs.readdirSync(dir);

    filelist = filelist || [];

    files.forEach(function (file) {
        if (fs.statSync(dir + '/' + file).isDirectory()) {
            filelist = getFiles(dir + '/' + file, filelist);
        } else {
            filelist.push(dir + '/' + file);
        }
    });

    return filelist;
};

module.exports = {
    removeDir: removeDir,
    getFiles: getFiles
}