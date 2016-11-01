JavaScript library to precisely get the TLD part of an URL in a browser.

##Features:
- Precision: uses the same list of predefined TLDs as Firefox and Chrome (``https://publicsuffix.org/list/public_suffix_list.dat`` by default)
- Size: the list of the TLDs is saved as compact as possible. (< 80kB in total, which is smaller than the plain list itself. ~ 30kB zipped)
- Speed: most of the work is done in the build process on the server, testing urls is fast for the client

##Usage:
After it's been installed via ``npm install`` the resulting file (``index.js`` by default) can be served as an UMD module or used within node.js:
```js
const getTLD = require('get-tld'); // or window.getTLD or define([ 'get-tld', ], getTLD => { /* ... */ })
const Host = getTLD.Host;

const host = new Host('www.google.co.uk');
host +'' === host.host; // true
host.host; // 'www.google.co.uk'
host.pub; // the public suffix of the host name, 'co.uk' here
host.name; // 'google' here
host.sub; // the sub domain, 'www' here

// supports all the fancy new TLDs
new Host('something.github.io'); // { name: 'something', pub: 'github.io', ... }
new Host('www.hk.art.museum'); // { sub: 'www', name: 'hk', pub: 'art.museum', ... }

// handles unicode the same way the current platform does
new Host(new URL('http://心理健康中心.新加坡/')); // { name: '心理健康中心', pub: '新加坡', ... } // in Firefox
new Host(new URL('http://心理健康中心.新加坡/')); // { name: 'xn--fiqw7ci2wu4ada2322a', pub: 'xn--yfro4i67o', ... } // in Chrome

// supports non-public domain names (the `.pub` will always be '')
new Host('localhost'); // { name: 'localhost', ... }
new Host('server.my-local-dns'); // { sub: 'server', name: 'my-local-dns', ... }

// supports IPv4, IPv6 and appended port numbers
new Host('[::1]:443'); // { ipv6: '::1', port: '443', ... }
new Host('127.0.0.1:80'); // { ipv4: '127.0.0.1', port: '80', ... }
new Host('::1'); // throws TypeError
new Host('300.0.0.1'); // { sub: '300.0.0', name: '1', ... } // not an IPv4, no valid public suffix
new Host('[foobar]'); // { ipv6: 'foobar', ... }

// works with URL, Location and HTMLAnchorElement objects, and other objects that have a string .host property
new Host(window.location);
new Host(new URL(href));
new Host(document.querySelector('a'));
```

##Installation:
Run ``npm install get-tld --save`` to will download, build and test.

##Update (of the TLD list):
- either run ``npm install`` again
- or call this in the node.js program:
```js
require('get-tld/build-node')({
    listUrl: 'https://publicsuffix.org/list/public_suffix_list.dat', // URL of the public suffix list to download and use
    outputPath: 'index.js', // target file name, relative to __dirname of build.js
    globalName: 'getTLD', // the name of the global variable used if require and define are missing (in the browser).
    defineName: null, // the name used to define() the module, uses anonymous define (recommended) if falsy.
}).then(({ url, list, file, data, }) => {
     console.log('read', list.length, 'chars from', url);
     console.log('wrote', data.length, 'chars to', file);
     delete require.cache[file]; // remove cached old version
     getTLD = require(file); // load updated module
});
```

##API
```js
const { Host, } = require('get-tld');
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

host.toString();
host.host; // getter
/**
 * Casts the Host back into a string. If the Host object has not been changed, it returns the same string that was passed into the constructor.
 * Prefers `.ipv6` over `.piv4` over `.sub`/`.name`/`.pub`. Appends the port only if it is set.
 * @return {string}  The string representation of the Host.
 */

host.host;
/**
 * Getter for the string representation of the entire host. Allows for copy constructor.
 */
```
```js
const getTLD = require('get-tld');
const { getPublicSuffix, getTLD, } = require('get-tld');
/**
 * Extracts the public suffix from a domain name.
 * Very similar to `domain => new Host(domain).pub`, only that it doesn't support ports and IP addresses; but it is faster.
 * Doesn't throw and casts its argument into a string.
 * @param  {string}  domain  Full domain (or a TLD including leading '.') from which to obtain the TLD
 * @param  {object}  tree    Optional. The root node of the TDL tree structure to use. Defaults to getTLD.defaultTree.
 * @return {string}          TLD including leading '.', null if no rule could be matched, '' if domain contains no '.'
 */
 ```
