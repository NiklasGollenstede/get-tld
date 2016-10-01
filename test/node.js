'use strict'; // license: MIT

Error.stackTraceLimit = Infinity; // get them all ...

const chai = require('chai');
chai.should();

global.expect = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion = chai.Assertion;
global.assert = chai.assert;
