'use strict'; /* globals __dirname, __filename, process, module */ // license: MIT

require('es6lib/require');

const {
	concurrent: { async, },
	fs: { FS, Path, },
} = require('es6lib');

const Https = require('https');

function factory(_tree) {

	/**
	 * Conditions for nodes in tree and their meaning:
	 *     (node === 1) : The node is a leaf, no further sub-prefixes => the public suffix ends here
	 *     (node.$)     : The public suffix may end here, but it can also continue with node[...]
	 *     (node._)     : The node allows wildcard children for all parts but those listed in node._ (In the current implementation the public suffix ends after the wildcard)
	 */

	const nameprep = typeof URL !== 'undefined' && function(string) { return new URL('http://'+ string).hostname; }; // returns browser dependant results
	function clone(_node) {
		if (_node === 1) { return 1; }
		const node = { $: _node.$, };
		_node._ && (node._ = _node._.map(nameprep));
		for (let key in _node) {
			key !== '$' && key !== '_' && (node[nameprep(key)] = clone(_node[key]));
		}
		return Object.freeze(node);
	}
	const tree = nameprep ? clone(_tree) : tree; // cloning needs to be done in the browser so that nameprep matches the internal implementation

	function Parsed(sub, host, pub) {
		this.sub = sub;
		this.host = host;
		this.pub = pub;
	}

	function Domain(domain) {
		if (typeof domain !== 'string') { throw new TypeError(`The 'domain' argument must be a string`); }
		this.sub = ''; this.host = ''; this.pub = '';
		const parts = domain.split('.');
		if (parts.length === 1) {
			this.host = parts[0];
		} else {
			const pub = getPub(parts);
			if (pub === 0) { throw new Error(`The domain "${ domain }" does not end with a valid public suffix`); }
			this.pub = parts.splice(parts.length - pub, Infinity).join('.');
			this.host = parts.pop();
			this.sub = parts.join('.');
		}
	}
	Domain.prototype.getTLD = function() {
		return (this.pub ? '.'+ this.pub : '');
	};
	Domain.prototype.toString = function() {
		return (this.sub ? this.sub +'.' : '') + this.host + this.getTLD();
	};

	function getPub(parts) {
		let node = tree, count = 0, length = parts.length;
		for (let index = length - 1; index >= 0; --index) {
			const part = parts[index];
			if (node === 1) { break; }
			if (index <= 0 && node.$) { break; } // leave the last part (e.g: 'com.de' is a valid domain under the TLD '.de', but also a TLD itself)
			if (node[part]) { ++count; node = node[part]; continue; }
			if (node._) { node._.indexOf(part) === -1 && ++count; break; }
			if (node.$) { break; }
			return 0;
		}
		if (count === length) { return 0; } // leave the last part
		return count;
	}

	function getTLD(domain) {
		if (domain == null) { return null; }
		const parts = (domain +'').split('.');
		if (parts.length === 1) { return ''; }
		const count = getPub(parts);
		if (!count) { return null; }
		return '.'+ parts.slice(-count).join('.');
	}

	return Object.freeze(Object.assign(getTLD, { tree, getTLD, Domain, }));
}

const treeToString = tree => JSON.stringify(tree)
.replace(/({|,)"([\$a-z\_]\w*)":/g, '$1$2:') // remove quotes around simple keys
.replace(/\{\$\:1\}/g, 1); // replace leaf-objects with 1

const build = module.exports = async(function*({ name = 'get-tld', file = 'index.js', url = 'https://publicsuffix.org/list/public_suffix_list.dat', } = { }) {
	file = Path.resolve(__dirname, file);

	const list = (yield fetch(url)); // info: https://publicsuffix.org/list/
	const tlds = list.split(/\r?\n|\r/gm).filter(s => s && !(/^\/\//).test(s)).map(s => s.match(/^(.*?)(?:\s|$)/)[1]);

	const tree = { };
	tlds.forEach(tld => {
		const parts = tld.split('.');
		add(parts, tree);
	});
	function add(parts, node) {
		if (!parts.length) { node.$ = 1; return; }
		const key = parts.pop();
		if (key === '*') { node._ || (node._ = [ ]); return; } // "Wildcards are not restricted to appear only in the leftmost position", but currently they do
		if ((/^!/).test(key)) { (node._ || (node._ = [ ])).push(key.slice(1)); return; }
		add(parts, node[key] || (node[key] = { }));
	}

	// console.log('tld tree', tree);
	const data = umd(
		name,
		[ ],
		String.raw`function() { 'use strict'; // license: MIT
			return (${ factory })
			(${ treeToString(tree) });
		}`
		.replace(/([(){};\s])(?:const|let) /g, '$1var ')
	);

	(yield FS.writeFile(file, data, 'utf8'));

	return { name, file, url, data, tlds, tree, };
});

const fetch = url => new Promise((resolve, reject) => Https.get(url, res => {
	let value = '';
	res.on('data', data => value += data);
	res.on('end', () => resolve(value));
}).on('error', reject));


if (process.argv[1] === __filename) {
	build()
	.catch(error => { console.error(error); process.exit(-1); });
}

function umd(name, depts, factory) { return `(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ ${ depts.map(s => '"'+ s +'"').join(', ') } ], factory);
	} else if (typeof exports === 'object' && typeof module === 'object') {
		const result = factory(exports${ depts.map(s => ', require("'+ s +'")') });
		result && (module.exports = result);
	} else {
		const result = factory((root['${ name }'] = { })${ depts.map(s => ', root["'+ s +'"]') });
		result && (root['${ name }'] = result);
	}
})(this, (${ factory }));`; }
