import RuleEngine from 'node-rules';
import async from 'async';
import _ from 'lodash';
import Rule from '../models/rule.model';
import Room from '../models/room.model';

function get(req, res, next) {
  async.parallel([
    (callback) => {
      async.parallel([
        (cb) => {
          Rule.list({ type: 'sentences', available: true })
            .then((rules) => {
              const rulesArr = JSON.stringify(rules);
              const inputObject = {};
              inputObject.fact = req.body;
              inputObject.actions = [];
              const R = new RuleEngine();
              R.fromJSON(rulesArr);
              R.execute(inputObject, (result) => {
                const data = result.actions.reverse();
                cb(null, data);
              });
            })
            .catch(e => next(e));
        },
        (cb) => {
          Room.getByHotel(req.body.hotel)
            .then((roomsOrder) => {
              const availableRooms = _.filter(roomsOrder, (o) => {
                const a = _.find(req.body.rooms, r => r.roomCategory === o.roomCategory);
                return a.available;
              });
              cb(null, availableRooms);
            })
            .catch(e => next(e));
        }],
        (err, results) => {
          const roomSentence = [];
          _.forEach(results[0], (item, index) => {
            const a = JSON.parse(item);
            a.roomCategory = results[1][index].roomCategory;
            roomSentence.push(a);
          });
          callback(null, roomSentence);
        });
    },
    (callback) => {
      async.parallel([
        (cb) => {
          Rule.list({ type: 'sentences', available: false })
            .then((rules) => {
              const rulesArr = JSON.stringify(rules);
              const inputObject = {};
              inputObject.fact = req.body;
              inputObject.actions = [];
              const R = new RuleEngine();
              R.fromJSON(rulesArr);
              R.execute(inputObject, (result) => {
                const data = result.actions.reverse();
                cb(null, data);
              });
            })
            .catch(e => next(e));
        },
        (cb) => {
          Room.getByHotel(req.body.hotel)
            .then((roomsOrder) => {
              const availableRooms = _.filter(roomsOrder, (o) => {
                const a = _.find(req.body.rooms, r => r.roomCategory === o.roomCategory);
                return !a.available;
              });
              cb(null, availableRooms);
            })
            .catch(e => next(e));
        }],
        (err, results) => {
          const roomSentence = [];
          _.forEach(results[0], (item, index) => {
            const a = JSON.parse(item);
            a.roomCategory = results[1][index].roomCategory;
            roomSentence.push(a);
          });
          callback(null, roomSentence);
        });
    }
  ],
    (err, results) => {
      res.json(results[0].concat(results[1]));
    });
}


export default { get };