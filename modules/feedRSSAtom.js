const fs = require('fs');
const parser = require('blindparser');
const _ = require('lodash');
const moment = require('moment');

const allowSortValue = {
	asc: 1,
	desc: 2
};

let error; // Contains errors
let counter; // Indicate number of link complete
let results; // Array : Contains all results
let urlLength; // Number of url
let sortByDate; // Indicate if result need to be sort (asc/desc) or not
let finishCallback; // Pointer to "finish" callback of poll

module.exports = {
	settings: {
		feedRSSAtom: {
			options: {
				followRedirect: false,
				timeout: 1000
			},
			sortByDate: 'desc',
			url: [],
		},
		pollFrequency: {
			feedRSSAtom: 60 * 1000
		}
	},
	poll: function(finish) {
		counter = 0;
		results = [];
		error = '';
		urlLength = this.settings.feedRSSAtom.url.length;
		sortByDate = this.settings.feedRSSAtom.sortByDate;
		finishCallback = finish;
		for (let index = 0; index < this.settings.feedRSSAtom.url.length; index++) {
			let url = this.settings.feedRSSAtom.url[index];
			if (url.match(/^http/)) {
				parser.parseURL(url, this.settings.feedRSSAtom.options, callbackParser);
			}
			else {
				if (fs.existsSync(url)) {
					let self = this;
					fs.readFile(url, 'utf8', (err,data) => {
						if (err) return error += `${err}\n\n`;
						parser.parseString(data, callbackParser);
					});
				}
				else {
					error += `Unknow source: ${url}\n\n`;
					if ( ((index+1) === urlLength) ) { finish(error); }
				}
			}
		}
	},
};

/**
 * Callback call when parser is finished
 * @param err {string} Error reported
 * @param out {json} Data returned
 */
function callbackParser(err, out) {
	if (err) {
		error += err + '\n\n';
	} else {
		results[counter] = out;
	}

	counter++;
	if (counter === urlLength) {
		let result = {sources: [], feeds: []};
		let i = 0;
		_.each(results, feed => {
			feed.metadata.lastBuildDate = moment(feed.metadata.lastBuildDate).format('x');
			feed.metadata.update = moment(feed.metadata.update).format('x');
			result.sources.push({type: feed.type, metadata: feed.metadata});
			_.each(feed.items, function (item) {
				item.source = i;
				result.feeds.push(item);
			});
			i++;
		});

		// Sort value
		switch (allowSortValue[sortByDate]) {
			case allowSortValue.asc:
				result.feeds.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0));
				break;
			case allowSortValue.desc:
				result.feeds.sort((a, b) => (a.date < b.date) ? 1 : ((b.date < a.date) ? -1 : 0));
				break;
			default:
				break;
		}

		if (error !== '') {
			finishCallback(error);
		} else {
			finishCallback(null, {feedRSSAtom: result});
		}
	}
}
