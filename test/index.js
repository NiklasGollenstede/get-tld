'use strict'; // license: MIT

global.URL = require('url').parse;
const nameprep = string => new URL('http://'+ string).hostname;

const { getTLD, Host, } = require('../index.js');

describe('"getTLD" should', function() {

	function test(_in, _out1, _out2 = _out1.slice(1)) {
		expect(getTLD(_in)).to.equal(_out1);
		if (_out2 === null || (_out2 && _out2.name && _out2.name.endsWith('Error'))) {
			expect(() => new Host(_in)).to.throw(_out2);
		} else {
			const domain = new Host(_in);
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
		test('a.b.blob',              null, '');
		test('b.com.yx',              null, '');
		test('www.org.cy',            '.org.cy');             // rule: org.cy
		test('www.cy',                null, '');              // no rule cy
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
		test('com',                   '');
	});

	it('accept wildcards', () => {
		test('a.foo.ck',              '.foo.ck');             // rule: *.ck
	});

	it('return NULL if a wildcards would consume the last part', () => {
		test('com.ck',                null, '');              // rule: *.ck, but no ck
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

describe('The Host class should', function() {

	it('throw if constructed without new', () => {
		(() => new Host('')).should.not.throw();
		(() => Host('')).should.throw();
	});

	it('throw if not constructed with a string or URL-like argument', () => {
		(() => new Host({ host: '', })).should.not.throw();
		(() => new Host(42)).should.throw();
		(() => new Host(true)).should.throw();
		(() => new Host(x => x)).should.throw();
	});

	it('accept IPv6 addresses', () => {
		new Host('[::1]').should.have.a.property('ipv6', '::1');
		new Host('[::1]:42').should.contain.all.keys({ ipv6: '::1', port: '42', });
	});

	it('accept IPv4 addresses', () => {
		new Host('127.0.0.1').should.have.a.property('ipv4', '127.0.0.1');
		new Host('127.0.0.1:42').should.contain.all.keys({ ipv4: '127.0.0.1', port: '42', });
		[
			'255.255.255.255',
			'25.25.25.25',
			'0.0.0.0',
			'199.000.111.001',
			'025.025.025.025',
		].forEach(ip => new Host(ip).should.have.a.property('ipv4', ip));
		[
			'355.255.255.255',
			'-1.255.255.255',
			'256.255.255.255',
			'a.b.c.d',
			'ff.ff.ff.ff',
		].forEach(ip => new Host(ip).should.contain.all.keys({ ipv4: '', name: ip, }));
	});

});
