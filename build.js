(function(global) { 'use strict'; const factory = function getTld_build(exports) { // license: MIT

/**
 * This factory function is pasted into the output file.
 */
function factory(originalTree) {

	/**
	 * Conditions for nodes in tree and their meaning:
	 *     (node === 1) : The node is a leaf, no further sub-prefixes => the public suffix ends here
	 *     (node.$)     : The public suffix may end here, but it can also continue with node[...]
	 *     (node._)     : The node allows wildcard children for all parts but those listed in node._ (In the current implementation the public suffix ends after the wildcard)
	 */

	const isIPv4 = (/^(?:(?:2(?:[0-4]\d|5[0-5])|[01]?\d\d?)\.){3}(?:2(?:[0-4]\d|5[0-5])|[01]?\d\d?)$/);

	const nameprep = typeof URL === 'function' && function nameprep(string) { try {
		return new URL('http://'+ string).hostname; // returns browser dependant results
	} catch (_) {
		console.error('Failed to nameprep', string);
	} };
	function idFunction(x) { return x; }

	/**
	 * Returns a new deep copy of the TLD tree structure.
	 * @param  {function}  keyMapper  Optional. Function (string => string) that performs a mapping on all TLD segments in the structure.
	 * @param  {function}  finisher   Optional. Function (object => object) that performs a mapping/manipulation on the nodes of the tree, once all keys of that node have been added.
	 * @param  {object}    treeRoot   Optional. The root node of an existing TLD tree structure. Defaults to the one shipped in this file.
	 * @return {object}               The cloned data structure.
	 */
	function getTldTree(keyMapper, finisher, treeRoot) {
		keyMapper || (keyMapper = idFunction);
		finisher || (finisher = idFunction);
		return (function clone(_node) {
			if (_node === 1) { return 1; }
			const node = { $: _node.$, };
			_node._ && (node._ = _node._.map(keyMapper));
			for (let key in _node) {
				key !== '$' && key !== '_' && (node[keyMapper(key)] = clone(_node[key]));
			}
			return finisher(node);
		})(treeRoot || originalTree);
	}

	// cloning needs to be done in the browser so that nameprep matches the internal implementation
	const defaultTree = getTldTree(nameprep, Object.freeze);

	/**
	 * Parses a string into a Host object. Similar to the URL constructor, only not for the entire url but only for its host part.
	 * @param  {string|object}  host  The string to parse, or an object with a host property (e.g. an URL instance, window.location or an <a>-element).
	 * @param  {object}         tree  Optional. The root node of the TDL tree structure to use. Defaults to getTLD.defaultTree.
	 * @throws {TypeError}  If the `host` argument is not a string or object.
	 * @throws {TypeError}  If the `host` argument is not a valid host.
	 *
	 * @property {string}  ipv6  The hosts IPv6 address, or ''.
	 * @property {string}  ipv4  The hosts IPv4 address, or ''.
	 * @property {string}  port  The hosts port number (base 10), or ''.
	 * @property {string}  pub   The public suffix of the hosts domain name, or ''.
	 * @property {string}  name  The hosts domain name minus its public suffix and sub domain names, or ''.
	 * @property {string}  sub   The sub domain names in the hosts domain name, or ''.
	 *
	 * @invariant  The constructor always sets exactly one of `.ipv6`, `.ipv4` and `.name`. (Unless the input is ''.)
	 *             It only sets `.sub` and/or `.pub` if `.name` is set. `.name` does not contain any '.'s.
	 */
	function Host(host, tree) {
		this.sub = ''; this.host = ''; this.pub = ''; this.ipv6 = ''; this.ipv4 = ''; this.port = '';
		if (typeof host === 'object') {
			if (host instanceof Host) { // copy constructor
				this.port = host.port;
				if (host.ipv6) {
					this.ipv6 = host.ipv6;
				} else if (host.ipv4) {
					this.ipv4 = host.ipv4;
				} else {
					this.sub = host.sub; this.host = host.host; this.pub = host.pub;
				}
				return;
			}
			host = host.host;
		}
		if (typeof host !== 'string') { throw new TypeError("The 'host' argument must be a string or an URL object"); }
		if (host[0] === '[') { // IPv6
			const to = host.indexOf(']');
			if (to < 0 || to + 1 !== host.length && host[to + 1] !== ':') { throw new TypeError('Invalid host address "'+ host +'""'); }
			this.ipv6 = host.slice(1, to);
			this.port = host.slice(4 + 2) || '';
		} else {
			const split = host.split(':');
			if (split.length > 2) { throw new TypeError('Invalid host address "'+ host +'""'); }
			this.port = split[1] || '';
			const parts = split[0].split('.');
			if (parts.length === 4 && isIPv4.test(split[0])) { // IPv4
				this.ipv4 = split[0];
			} else { // domain name
				const pub = getPub(parts, tree || defaultTree);
				this.pub = parts.splice(parts.length - pub, Infinity).join('.');
				this.name = parts.pop();
				this.sub = parts.join('.');
			}
		}
		const portNum = +this.port;
		if (portNum !== portNum || portNum < 0 || portNum > 65535) { throw new TypeError('invalid port number in host "'+ host +'"'); }
	}
	/**
	 * Casts the Host back into a string. If the Host object has not been changed, it returns the same string that was passed into the constructor.
	 * Prefers `.ipv6` over `.piv4` over `.sub`/`.name`/`.pub`. Appends the port only if it is set.
	 * @return {string}  The string representation of the Host.
	 */
	Host.prototype.toString = function toString() {
		const port = (this.port ? ':'+ this.port : '');
		if (this.ipv6) { return '['+ this.ipv6 +']' + port; }
		if (this.ipv4) { return this.ipv4 + port; }
		return (this.sub ? this.sub +'.' : '') + this.name + (this.pub ? '.'+ this.pub : '') + port;
	};
	/**
	 * Getter for the string representation of the entire host. Allows for copy constructor.
	 */
	Object.defineProperty(Host, 'host', { get: function host() {
		return this.toString();
	}, enumerable: true, configurable: true, });

	/**
	 * Returns the number of domain parts that are the public suffix.
	 * @param  {[string]}  parts  The domain name split at '.'.
	 * @param  {object}    node   The root node of the TDL tree structure to use.
	 * @return {number}           The number of elements in `parts` (from the end) that form the longest possible public suffix.
	 *                            0 if the domain doesn't *end with* a valid public suffix, i.e. also if only the entire domain is a public suffix.
	 */
	function getPub(parts, node) {
		let count = 0, length = parts.length;
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

	/**
	 * Extracts the public suffix from a domain name.
	 * Very similar to `domain => new Host(domain).pub`, only that it doesn't support ports and IP addresses; but it is faster.
	 * Doesn't throw and casts its argument into a string.
     * @param  {string}  domain  Full domain (or a TLD including leading '.') from which to obtain the TLD
	 * @param  {object}  tree    Optional. The root node of the TDL tree structure to use. Defaults to getTLD.defaultTree.
     * @return {string}          TLD including leading '.', null if no rule could be matched, '' if domain contains no '.'
	 */
	function getPublicSuffix(domain, tree) {
		if (domain == null) { return null; }
		const parts = (domain +'').split('.');
		if (parts.length === 1) { return ''; }
		const count = getPub(parts, tree || defaultTree);
		if (!count) { return null; }
		return '.'+ parts.slice(-count).join('.');
	}

	return Object.freeze(Object.assign(getPublicSuffix, {
		nameprep: nameprep,
		getTldTree: getTldTree,
		defaultTree: defaultTree,
		Host: Host,
		getPublicSuffix: getPublicSuffix, getTLD: getPublicSuffix,
	}));
}

const treeToString = tree => JSON.stringify(tree)
.replace(/({|,)"([\$a-z\_]\w*)":/g, '$1$2:') // remove quotes around simple keys
.replace(/\{\$\:1\}/g, 1); // replace leaf-objects with 1

function build(list, globalName, defineName) {
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

	const data = umd(
		(
String.raw`function() { 'use strict'; // license: MIT
return (${ factory })(
	(${ treeToString(tree) })
); }`
		).replace(/([(){};\s])(?:const|let) /g, '$1var '),
		globalName,
		defineName
	);
	return data;
}

function umd(factory, globalName, defineName) { return (
`(function (root, factory) { // generated file
	if (typeof define === 'function' && define.amd) {
		define(`+ (defineName ? `"${ defineName }", ` : '') +`[ ], factory);
	} else if (typeof exports === 'object' && typeof module === 'object') {
		var result = factory(exports);
		result && (module.exports = result);
	} else {
		var result = factory((root["${ globalName }"] = { }));
		result && (root["${ globalName }"] = result);
	}
})(this, (${ factory }));`
); }

return build;

}; if (typeof define === 'function' && define.amd) { define([ 'exports', ], factory); } else { const exports = { }, result = factory(exports) || exports; if (typeof exports === 'object' && typeof module === 'object') { module.exports = result; } else { global[factory.name] = result; } } })((function() { return this; })());
