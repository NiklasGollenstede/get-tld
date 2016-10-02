'use strict'; /* globals __dirname, __filename, process, module, require */ // license: MIT

const {
	concurrent: { async, },
	fs: { FS, Path, },
} = require('es6lib');

const build = require('./build.js');

// const UglifyJS = require('uglify-js');

const fetch = url => new Promise((resolve, reject) => require('https').get(url, res => {
	let value = '';
	res.on('data', data => value += data);
	res.on('end', () => resolve(value));
}).on('error', reject));

const loadAndWrite = module.exports = async(function*({
	listUrl = 'https://publicsuffix.org/list/public_suffix_list.dat', // info: https://publicsuffix.org/list/
	outputPath = 'index.js',
	globalName = 'getTLD',
	defineName = null,
} = { }) {
	const file = Path.resolve(__dirname, outputPath);
	const list = (yield fetch(listUrl));
	const data = build(list, globalName, defineName);
	(yield FS.writeFile(file, data, 'utf8'));

	// const min = UglifyJS.minify(data, { fromString: true, });
	// (yield FS.writeFile(file.replace(/\.js$/, '.min.js'), min.code, 'utf8'));

	return { file, url: listUrl, data, };
});
loadAndWrite.build = build;


// run if require()ed directly by node.js
if (process.argv[1] === __filename) {
	loadAndWrite()
	.catch(error => { console.error(error); process.exit(-1); });
}
