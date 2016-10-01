JavaScript library to precisely get the TLD part of an URL in a browser.

##Features:
- Precision: uses the same list of predefined TLDs as Mozilla (``https://publicsuffix.org/list/public_suffix_list.dat`` by default)
- Size: the list of the TLDs is saved as compact as possible. (< 80kB in total, which is smaller than the plain list itself)
- Speed: most of the work is done in the build process on the server, testing urls is fast for the client

##Installation:
Run ``npm install get-tld --save`` to will downlod, build and test.

##Update (of the TLD list):
- either run ``npm install``{.ruby} again
- or call this in the node.js programm:
```js
require('get-tld/build.js')({
    name: 'get-tld', // the name of the global variable used if requre and define are missing (in the browser). '-lowercase' will be replaced with 'Uppercase'
    file: 'index.js', // target file name, relative to __dirname of build.js
    url: 'https://publicsuffix.org/list/public_suffix_list.dat', // URL of the public suffix list to download and use
});
delete require.cache[require.resolve('get-tld')]; // clear the cache if you intend to require('get-tld') the updated module in the same process afterwards
```

##Usage:
After it's been installed via ``npm install`` the resulting file (``index.js`` by default) can be served as an UMD module or used within node.js:
```
const getTLD = require('get-tld'); // or window.getTld or define([ 'get-tld', ], getTld => ...)
const Host = getTLD.Host;

... // TODO
```

##API
```js
const { Host, } = require('get-tld');
/**
 * Parses a string into a Host object. Similar to the URL constructor, only not for the entire url but only for its host part.
 * @param {string|object}  host  The string to parse, or an object with a host property (e.g. an URL instance, window.location or an <a>-element).
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
 * @invariant  The constructor always sets exactly one of `.ipv6`, `.ipv4` and `.name`.
 *             It only sets `.sub` and/or `.pub` if `.name` is set. `.name` does not contain any '.'s.
 */
```
```js
const host = new Host('example.com:8080');
host.toString(); // ==> "example.com:8080"
/**
 * Casts the Host back into a string. If the Host object has not been changed, it returns the same string that was passed into the constructor.
 * Prefers `.ipv6` over `.piv4` over `.sub`/`.name`/`.pub`. Appends the port only if it is set.
 * @return {string}  The string representation of the Host.
 */
```
```js
const getTLD = require('get-tld');
// getTLD === getTLD.getTLD; getTLD === getTLD.getTld;
/**
 * Extracts the public suffix from a domain name.
 * Very similar to `domain => new Host(domain).pub`, only that it doesn't support ports and IP addresses; but it is faster.
 * Doesn't throw and casts its argument into a string.
 * @param  {string}  domain  Full domain (or a TLD including leading '.') from which to obtain the TLD
 * @return {string}          TLD including leading '.', null if no rule could be matched, '' if domain contains no '.'
 */
 ```
