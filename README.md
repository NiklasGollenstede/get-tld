JavaScript library to precisely get the TLD part of an URL in a browser.

After it's been installed via ``npm install`` or by running or requireing ``build.js`` the ``index.js`` file can be served as a UMD module which is a single function ``getTLD``:
```
    /**
     * Returns the TLD part of a domain:
     * <input>         ==>   <output>       (<matching rule>)
     * 'a.b.com'       ==>   '.com'         ('com')
     * 'b.com.au'      ==>   '.com.au'      ('com.au')
     * 'com.au'        ==>   '.au'          ('au')
     * 'a.b.de'        ==>   '.de'          ('de')
     * 'a.b.com.de'    ==>   '.com.de'      ('com.de')
     * 'com.de'        ==>   '.de'          ('de')
     * 'a.foo.ck'      ==>   '.foo.ck'      ('*.ck')
     * 'com.ck'        ==>   null           ('*.ck', but no 'ck')
     * 'a.www.ck'      ==>   '.ck'          ('*.ck', but '!www.ck')
     * 'a.xn--unup4y'  ==>   '.xn--unup4y'  ('游戏')
     * 'a.github.io'   ==>   '.github.io'   ('github.io')
     * 'localhost'     ==>   ''
     * 'foo'           ==>   ''
     * @param  {string}  domain  Full domain (or a TLD including leading '.') from which to obtain the TLD
     * @return {string}          TLD including leading '.', null if no rule could be matched, '' if domain contains no '.'
     */
```

Features:
- Precision: uses the same list of predefined TLDs as Mozilla (``https://publicsuffix.org/list/public_suffix_list.dat`` by default)
- Size: the list of the TLDs is saved as compact as possible. (< 80kB in total, which is smaller than the plain list itself)
- Speed: most of the work is done in the build process on the server, testing urls is fast for the client

Installation: ``npm i get-tld``

Update (of the TLD list):
- either: ``npm i`` in the module root
- or ``require('get-tld/build.js')({ name: 'get-tld', file: 'index.js', url, })`` programmatically
