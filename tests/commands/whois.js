const test = require('tape');
const sinon = require('sinon');

// Stub Logger methods to minimize crosstalk.
const { stubLogger, restoreLogger } = require('../helpers/logging');
// Stub hunter registry methods.
const { stubHunterRegistry, restoreHunterRegistry } = require('../helpers/hunters');
// We need a decently realistic Message stub.
const mockMessage = require('../helpers/mock-message');

// Declaration of what we're testing.
/** @type {{ execute: (Message, tokens: string[] ) => Promise<import('../../src/interfaces/command-result')>}} */
let WHOIS;

test('commands - whois', suite => {
    let logStubs;
    let hunterStubs;
    suite.test('Test Suite Setup', t => {
        logStubs = stubLogger();
        hunterStubs = stubHunterRegistry();

        // Now that we have stubs active, we can require the test subject.
        WHOIS = require('../../src/commands/whois');
        t.end();
    });

    suite.test('when channel is dm - when replying - signals caller', async t => {
        t.plan(2);

        const messageStub = mockMessage({ channelType: 'dm' });
        const result = await WHOIS.execute(messageStub, []);
        t.true(result.replied, 'should reply');
        t.true(result.sentDm, 'should indicate DM was sent');

        sinon.reset();
    });
    suite.test('when channel is text - when replying - signals caller', async t => {
        t.plan(2);

        const messageStub = mockMessage({ channelType: 'text' });
        const result = await WHOIS.execute(messageStub, []);
        t.true(result.replied, 'should reply');
        t.false(result.sentDm, 'should reply publically');

        sinon.reset();
    });
    suite.test('when channel#send fails - logs error', async t => {
        t.plan(3);

        const messageStub = mockMessage({ sendStub: sinon.stub().rejects(Error('oops!')) });
        await WHOIS.execute(messageStub, []);
        t.strictEqual(logStubs.error.callCount, 1, 'should log error');
        const [description, err] = logStubs.error.getCall(0).args;
        t.match(description, /failed to send/, 'should indicate error source');
        t.match(err.message, /oops!/, 'should log error from Message.channel#send');

        sinon.reset();
    });
    suite.test('when channel#send fails - flags bot error', async t => {
        t.plan(1);

        const messageStub = mockMessage({ sendStub: sinon.stub().rejects(Error('oops!')) });
        const result = await WHOIS.execute(messageStub, []);
        t.true(result.botError, 'should indicate bot error');

        sinon.reset();
    });
    suite.test('when called with a number - calls findHunter with type "hid"', async t => {
        t.plan(4);

        const messageStub = mockMessage();
        const sendToken = ['1'];
        await WHOIS.execute(messageStub, sendToken);
        t.strictEqual(hunterStubs.findHunter.callCount, 1, 'should call findHunter');
        const [message, tokens, type] = hunterStubs.findHunter.getCall(0).args;
        t.strictEqual(message, messageStub, 'Called with original message');
        t.deepEqual(tokens, ['1'], 'Called with original token argument');
        t.strictEqual(type, 'hid', 'Called out to do a hunter id lookup');

        sinon.reset();
    });
    suite.test('when first token starts with "snu" - when numeric arg - calls findHunter with type "snuid"', async t => {
        t.plan(4);

        const messageStub = mockMessage();
        const sendToken = ['snuid', 1];
        await WHOIS.execute(messageStub, sendToken);
        t.strictEqual(hunterStubs.findHunter.callCount, 1, 'should call findHunter');
        const [message, tokens, type] = hunterStubs.findHunter.getCall(0).args;
        t.strictEqual(message, messageStub, 'Called with original message');
        t.deepEqual(tokens, [1], 'Called with original token argument');
        t.strictEqual(type, 'snuid', 'Called out to do a snuid lookup');

        sinon.reset();
    });
    suite.test('when first token starts with "snu" - when alpha input - calls findHunter with type "snuid"', async t => {
        t.plan(4);

        const messageStub = mockMessage();
        const sendToken = ['snuid', 'a'];
        await WHOIS.execute(messageStub, sendToken);
        t.strictEqual(hunterStubs.findHunter.callCount, 1, 'should call findHunter with alpha arg');
        const [message, tokens, type] = hunterStubs.findHunter.getCall(0).args;
        t.strictEqual(message, messageStub, 'Called with original message');
        t.deepEqual(tokens, ['a'], 'Called with original alpha argument');
        t.strictEqual(type, 'snuid', 'Called out to do a snuid lookup');

        sinon.reset();
    });
    suite.test('when first token starts with "snu" - when multiple args - calls findHunter with type "snuid"', async t => {
        t.plan(4);

        const messageStub = mockMessage();
        const sendToken = ['snuid', 1, 3, 'a'];
        await WHOIS.execute(messageStub, sendToken);
        t.strictEqual(hunterStubs.findHunter.callCount, 1, 'should call findHunter with both args');
        const [message, tokens, type] = hunterStubs.findHunter.getCall(0).args;
        t.strictEqual(message, messageStub, 'Called with original message');
        t.deepEqual(tokens, [1, 3, 'a'], 'Called with original token arguments');
        t.strictEqual(type, 'snuid', 'Called out to do a snuid lookup');

        sinon.reset();
    });
    suite.test('when only one token and it\'s not a keyword - calls findHunter with type "name"', async t => {
        t.plan(4);

        const messageStub = mockMessage();
        const sendToken = ['aku aku'];
        await WHOIS.execute(messageStub, sendToken);
        t.strictEqual(hunterStubs.findHunter.callCount, 1, 'should call findHunter');
        const [message, tokens, type] = hunterStubs.findHunter.getCall(0).args;
        t.strictEqual(message, messageStub, 'Called with original message');
        t.deepEqual(tokens, ['aku aku'], 'Called with original alpha argument');
        t.strictEqual(type, 'name', 'Called out to do a name lookup');

        sinon.reset();
    });

    suite.test('when first token is "in" - calls getHuntersByProperty with type "location" ', async t => {
        t.plan(4);

        hunterStubs.getHuntersByProperty.returns([]);
        const messageStub = mockMessage();
        const sendToken = ['in', 'trouble'];
        await WHOIS.execute(messageStub, sendToken);
        t.strictEqual(hunterStubs.getHuntersByProperty.callCount, 1, 'should call getHuntersByProperty');
        const [message, type, searchStr] = hunterStubs.getHuntersByProperty.getCall(0).args;
        t.strictEqual(message, messageStub, 'Called with original message');
        t.strictEqual(type, 'location', 'Called out to do a location lookup');
        t.strictEqual(searchStr, 'trouble', 'Called with original alpha argument');

        sinon.reset();
    });

    suite.test('Restore Loggers', t => {
        restoreHunterRegistry(hunterStubs);
        restoreLogger(logStubs);
        t.end();
    });
});
