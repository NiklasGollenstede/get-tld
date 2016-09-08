'use strict'; // license: MIT

global.URL = require('url').parse;
const nameprep = string => new URL('http://'+ string).hostname;

const { getTLD, Domain, } = require('../index.js');

describe('"getTLD" should', function() {

	function test(_in, _out1, _out2 = _out1.slice(1)) {
		expect(getTLD(_in)).to.equal(_out1);
		if (_out2 === null || (_out2 && _out2.name && _out2.name.endsWith('Error'))) {
			expect(() => new Domain(_in)).to.throw(_out2);
		} else {
			const domain = new Domain(_in);
			expect(domain).to.have.a.property('pub', _out2);
			expect(domain.toString()).to.equal(_in);
		}
	}

	it('find basic TLDs', () => {
		test('a.b.com',               '.com');                // rule: com
		test('b.com.au',              '.com.au');             // rule: com.au
		test('com.au',                '.au');                 // rule: au
		test('a.b.de',                '.de');                 // rule: de
	});

	it('return NULL for invalid TLDs', () => {
		test('a.b.blob',              null, Error);
		test('b.com.yx',              null, Error);
	});

	it('return NULL for input NULL', () => {
		test(null,                    null, TypeError);
		test(undefined,               null, TypeError);
		test(false,                   '',   TypeError);
	});

	it('only use 2nd level if at least 3 parts are available', () => {
		test('a.b.com.de',            '.com.de');             // rule: com.de
		test('com.de',                '.de');                 // rule: de
	});

	it(`return "" if the domain contains no '.'`, () => {
		test('localhost',             '');
		test('foo',                   '');
	});

	it('accept wildcards', () => {
		test('a.foo.ck',              '.foo.ck');             // rule: *.ck
	});

	it('return NULL if a wildcards would consume the last part', () => {
		test('com.ck',                null, Error);           // rule: *.ck, but no ck
	});

	it('not include excluded wildcards', () => {
		test('www.ck',                '.ck');                 // rule: *.ck, but !www.ck
		test('a.www.ck',              '.ck');                 // rule: *.ck, but !www.ck
	});

	it('accept company registered 2nd level TLDs', () => {
		test('a.github.io',           '.github.io');          // rule: github.io
	});

	it('support punycode if the URL constructor does', () => {
		test('a.xn--unup4y',          '.xn--unup4y');         // rule: 游戏     // note: e.g. Firefox doesn't punycode this
	});

	it('behave as the id function on its output', () => {
		test('.com',                  '.com');
		test('.com.au',               '.com.au');
		test('.foo.ck',               '.foo.ck');
		test('.github.io',            '.github.io');
	});

});
