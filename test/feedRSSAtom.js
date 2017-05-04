const conkieStats = require('../index');
const expect = require('chai').expect;
const path = require('path');
const moment = require('moment');
const TEST_FILE = path.join(__dirname, 'rssTest.xml');
const NB_FEEDS = 9;

describe('Conkie / RSS Atom feed', function() {
    let mods = [];
    let stats = {};

    before(function(done) {
        conkieStats
            .on('moduleRegister', function(module) {
                mods.push(module.name);
            })
            .on('update', function(rawStats) {
                stats = rawStats;
            })
            .once('ready', done)
            .register('feedRSSAtom')
            .settings({
                feedRSSAtom: {
                    url: [TEST_FILE],
                },
            });
    });

    it('should register a feedRSSAtom handler', function() {
        expect(mods).to.contain('feedRSSAtom');
    });

    it('should provide a feedRSSAtom object', function() {
        expect(stats).to.have.property('feedRSSAtom');
    });

    it('should provide feedRSSAtom info', function() {
        expect(stats).to.have.property('feedRSSAtom');
        expect(stats.feedRSSAtom).to.be.an.object;

        stats.feedRSSAtom.sources.forEach(function (feedHeader) {
            expect(feedHeader.type).to.be.a.string;
            expect(feedHeader.type).to.equal('rss');

            expect(feedHeader.metadata).to.be.a.object;
            expect(feedHeader.metadata.title).to.be.a.string;
            expect(feedHeader.metadata.desc).to.be.a.string;
            expect(feedHeader.metadata.url).to.be.a.string;
            expect(feedHeader.metadata.lastBuildDate).to.be.a.number;
            expect(feedHeader.metadata.update).to.be.a.number;

            expect(feedHeader.metadata.title).to.equal('Linuxtoday.com');
            expect(feedHeader.metadata.desc).to.equal('');
            expect(feedHeader.metadata.url).to.equal('http://www.linuxtoday.com/');

            let timestamp = moment('Thu, 04 May 2017 11:18:55 -0700').format('x');

            expect(feedHeader.metadata.lastBuildDate).to.equal(timestamp);
            expect(feedHeader.metadata.update).to.equal(timestamp);

        });

        expect(stats.feedRSSAtom.feeds.length).to.equal(NB_FEEDS);

        stats.feedRSSAtom.feeds.forEach(function(feed) {
            expect(feed.category).to.be.array;
            expect(feed.date).to.be.number;
            expect(feed.desc).to.be.string;
            expect(feed.source).to.be.number;
            expect(feed.link).to.be.string;
            expect(feed.title).to.be.string;
        });
    });
});
