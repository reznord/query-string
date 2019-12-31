'use strict';

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var strictUriEncode = require('bms-strict-uri-encode');

var decodeComponent = require('decode-uri-component');

var splitOnFirst = require('bms-split-on-first');

function encoderForArrayFormat(options) {
  switch (options.arrayFormat) {
    case 'index':
      return function (key) {
        return function (result, value) {
          var index = result.length;

          if (value === undefined || options.skipNull && value === null) {
            return result;
          }

          if (value === null) {
            return [].concat(_toConsumableArray(result), [[encode(key, options), '[', index, ']'].join('')]);
          }

          return [].concat(_toConsumableArray(result), [[encode(key, options), '[', encode(index, options), ']=', encode(value, options)].join('')]);
        };
      };

    case 'bracket':
      return function (key) {
        return function (result, value) {
          if (value === undefined || options.skipNull && value === null) {
            return result;
          }

          if (value === null) {
            return [].concat(_toConsumableArray(result), [[encode(key, options), '[]'].join('')]);
          }

          return [].concat(_toConsumableArray(result), [[encode(key, options), '[]=', encode(value, options)].join('')]);
        };
      };

    case 'comma':
      return function (key) {
        return function (result, value) {
          if (value === null || value === undefined || value.length === 0) {
            return result;
          }

          if (result.length === 0) {
            return [[encode(key, options), '=', encode(value, options)].join('')];
          }

          return [[result, encode(value, options)].join(',')];
        };
      };

    default:
      return function (key) {
        return function (result, value) {
          if (value === undefined || options.skipNull && value === null) {
            return result;
          }

          if (value === null) {
            return [].concat(_toConsumableArray(result), [encode(key, options)]);
          }

          return [].concat(_toConsumableArray(result), [[encode(key, options), '=', encode(value, options)].join('')]);
        };
      };
  }
}

function parserForArrayFormat(options) {
  var result;

  switch (options.arrayFormat) {
    case 'index':
      return function (key, value, accumulator) {
        result = /\[(\d*)\]$/.exec(key);
        key = key.replace(/\[\d*\]$/, '');

        if (!result) {
          accumulator[key] = value;
          return;
        }

        if (accumulator[key] === undefined) {
          accumulator[key] = {};
        }

        accumulator[key][result[1]] = value;
      };

    case 'bracket':
      return function (key, value, accumulator) {
        result = /(\[\])$/.exec(key);
        key = key.replace(/\[\]$/, '');

        if (!result) {
          accumulator[key] = value;
          return;
        }

        if (accumulator[key] === undefined) {
          accumulator[key] = [value];
          return;
        }

        accumulator[key] = [].concat(accumulator[key], value);
      };

    case 'comma':
      return function (key, value, accumulator) {
        var isArray = typeof value === 'string' && value.split('').indexOf(',') > -1;
        var newValue = isArray ? value.split(',') : value;
        accumulator[key] = newValue;
      };

    default:
      return function (key, value, accumulator) {
        if (accumulator[key] === undefined) {
          accumulator[key] = value;
          return;
        }

        accumulator[key] = [].concat(accumulator[key], value);
      };
  }
}

function encode(value, options) {
  if (options.encode) {
    return options.strict ? strictUriEncode(value) : encodeURIComponent(value);
  }

  return value;
}

function decode(value, options) {
  if (options.decode) {
    return decodeComponent(value);
  }

  return value;
}

function keysSorter(input) {
  if (Array.isArray(input)) {
    return input.sort();
  }

  if (_typeof(input) === 'object') {
    return keysSorter(Object.keys(input)).sort(function (a, b) {
      return Number(a) - Number(b);
    }).map(function (key) {
      return input[key];
    });
  }

  return input;
}

function removeHash(input) {
  var hashStart = input.indexOf('#');

  if (hashStart !== -1) {
    input = input.slice(0, hashStart);
  }

  return input;
}

function extract(input) {
  input = removeHash(input);
  var queryStart = input.indexOf('?');

  if (queryStart === -1) {
    return '';
  }

  return input.slice(queryStart + 1);
}

function parseValue(value, options) {
  if (options.parseNumbers && !Number.isNaN(Number(value)) && typeof value === 'string' && value.trim() !== '') {
    value = Number(value);
  } else if (options.parseBooleans && value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
    value = value.toLowerCase() === 'true';
  }

  return value;
}

function parse(input, options) {
  options = Object.assign({
    decode: true,
    sort: true,
    arrayFormat: 'none',
    parseNumbers: false,
    parseBooleans: false
  }, options);
  var formatter = parserForArrayFormat(options); // Create an object with no prototype

  var ret = Object.create(null);

  if (typeof input !== 'string') {
    return ret;
  }

  input = input.trim().replace(/^[?#&]/, '');

  if (!input) {
    return ret;
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = input.split('&')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var param = _step.value;

      var _splitOnFirst = splitOnFirst(options.decode ? param.replace(/\+/g, ' ') : param, '='),
          _splitOnFirst2 = _slicedToArray(_splitOnFirst, 2),
          key = _splitOnFirst2[0],
          value = _splitOnFirst2[1]; // Missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters


      value = value === undefined ? null : decode(value, options);
      formatter(decode(key, options), value, ret);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  for (var _i = 0, _Object$keys = Object.keys(ret); _i < _Object$keys.length; _i++) {
    var _key = _Object$keys[_i];
    var _value = ret[_key];

    if (_typeof(_value) === 'object' && _value !== null) {
      for (var _i2 = 0, _Object$keys2 = Object.keys(_value); _i2 < _Object$keys2.length; _i2++) {
        var k = _Object$keys2[_i2];
        _value[k] = parseValue(_value[k], options);
      }
    } else {
      ret[_key] = parseValue(_value, options);
    }
  }

  if (options.sort === false) {
    return ret;
  }

  return (options.sort === true ? Object.keys(ret).sort() : Object.keys(ret).sort(options.sort)).reduce(function (result, key) {
    var value = ret[key];

    if (Boolean(value) && _typeof(value) === 'object' && !Array.isArray(value)) {
      // Sort object keys, not values
      result[key] = keysSorter(value);
    } else {
      result[key] = value;
    }

    return result;
  }, Object.create(null));
}

exports.extract = extract;
exports.parse = parse;

exports.stringify = function (object, options) {
  if (!object) {
    return '';
  }

  options = Object.assign({
    encode: true,
    strict: true,
    arrayFormat: 'none'
  }, options);
  var formatter = encoderForArrayFormat(options);
  var objectCopy = Object.assign({}, object);

  if (options.skipNull) {
    for (var _i3 = 0, _Object$keys3 = Object.keys(objectCopy); _i3 < _Object$keys3.length; _i3++) {
      var key = _Object$keys3[_i3];

      if (objectCopy[key] === undefined || objectCopy[key] === null) {
        delete objectCopy[key];
      }
    }
  }

  var keys = Object.keys(objectCopy);

  if (options.sort !== false) {
    keys.sort(options.sort);
  }

  return keys.map(function (key) {
    var value = object[key];

    if (value === undefined) {
      return '';
    }

    if (value === null) {
      return encode(key, options);
    }

    if (Array.isArray(value)) {
      return value.reduce(formatter(key), []).join('&');
    }

    return encode(key, options) + '=' + encode(value, options);
  }).filter(function (x) {
    return x.length > 0;
  }).join('&');
};

exports.parseUrl = function (input, options) {
  return {
    url: removeHash(input).split('?')[0] || '',
    query: parse(extract(input), options)
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sIm5hbWVzIjpbInN0cmljdFVyaUVuY29kZSIsInJlcXVpcmUiLCJkZWNvZGVDb21wb25lbnQiLCJzcGxpdE9uRmlyc3QiLCJlbmNvZGVyRm9yQXJyYXlGb3JtYXQiLCJvcHRpb25zIiwiYXJyYXlGb3JtYXQiLCJrZXkiLCJyZXN1bHQiLCJ2YWx1ZSIsImluZGV4IiwibGVuZ3RoIiwidW5kZWZpbmVkIiwic2tpcE51bGwiLCJlbmNvZGUiLCJqb2luIiwicGFyc2VyRm9yQXJyYXlGb3JtYXQiLCJhY2N1bXVsYXRvciIsImV4ZWMiLCJyZXBsYWNlIiwiY29uY2F0IiwiaXNBcnJheSIsInNwbGl0IiwiaW5kZXhPZiIsIm5ld1ZhbHVlIiwic3RyaWN0IiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiZGVjb2RlIiwia2V5c1NvcnRlciIsImlucHV0IiwiQXJyYXkiLCJzb3J0IiwiT2JqZWN0Iiwia2V5cyIsImEiLCJiIiwiTnVtYmVyIiwibWFwIiwicmVtb3ZlSGFzaCIsImhhc2hTdGFydCIsInNsaWNlIiwiZXh0cmFjdCIsInF1ZXJ5U3RhcnQiLCJwYXJzZVZhbHVlIiwicGFyc2VOdW1iZXJzIiwiaXNOYU4iLCJ0cmltIiwicGFyc2VCb29sZWFucyIsInRvTG93ZXJDYXNlIiwicGFyc2UiLCJhc3NpZ24iLCJmb3JtYXR0ZXIiLCJyZXQiLCJjcmVhdGUiLCJwYXJhbSIsImsiLCJyZWR1Y2UiLCJCb29sZWFuIiwiZXhwb3J0cyIsInN0cmluZ2lmeSIsIm9iamVjdCIsIm9iamVjdENvcHkiLCJmaWx0ZXIiLCJ4IiwicGFyc2VVcmwiLCJ1cmwiLCJxdWVyeSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsSUFBTUEsZUFBZSxHQUFHQyxPQUFPLENBQUMsdUJBQUQsQ0FBL0I7O0FBQ0EsSUFBTUMsZUFBZSxHQUFHRCxPQUFPLENBQUMsc0JBQUQsQ0FBL0I7O0FBQ0EsSUFBTUUsWUFBWSxHQUFHRixPQUFPLENBQUMsb0JBQUQsQ0FBNUI7O0FBRUEsU0FBU0cscUJBQVQsQ0FBK0JDLE9BQS9CLEVBQXdDO0FBQ3ZDLFVBQVFBLE9BQU8sQ0FBQ0MsV0FBaEI7QUFDQyxTQUFLLE9BQUw7QUFDQyxhQUFPLFVBQUFDLEdBQUc7QUFBQSxlQUFJLFVBQUNDLE1BQUQsRUFBU0MsS0FBVCxFQUFtQjtBQUNoQyxjQUFNQyxLQUFLLEdBQUdGLE1BQU0sQ0FBQ0csTUFBckI7O0FBQ0EsY0FBSUYsS0FBSyxLQUFLRyxTQUFWLElBQXdCUCxPQUFPLENBQUNRLFFBQVIsSUFBb0JKLEtBQUssS0FBSyxJQUExRCxFQUFpRTtBQUNoRSxtQkFBT0QsTUFBUDtBQUNBOztBQUVELGNBQUlDLEtBQUssS0FBSyxJQUFkLEVBQW9CO0FBQ25CLGdEQUFXRCxNQUFYLElBQW1CLENBQUNNLE1BQU0sQ0FBQ1AsR0FBRCxFQUFNRixPQUFOLENBQVAsRUFBdUIsR0FBdkIsRUFBNEJLLEtBQTVCLEVBQW1DLEdBQW5DLEVBQXdDSyxJQUF4QyxDQUE2QyxFQUE3QyxDQUFuQjtBQUNBOztBQUVELDhDQUNJUCxNQURKLElBRUMsQ0FBQ00sTUFBTSxDQUFDUCxHQUFELEVBQU1GLE9BQU4sQ0FBUCxFQUF1QixHQUF2QixFQUE0QlMsTUFBTSxDQUFDSixLQUFELEVBQVFMLE9BQVIsQ0FBbEMsRUFBb0QsSUFBcEQsRUFBMERTLE1BQU0sQ0FBQ0wsS0FBRCxFQUFRSixPQUFSLENBQWhFLEVBQWtGVSxJQUFsRixDQUF1RixFQUF2RixDQUZEO0FBSUEsU0FkUztBQUFBLE9BQVY7O0FBZ0JELFNBQUssU0FBTDtBQUNDLGFBQU8sVUFBQVIsR0FBRztBQUFBLGVBQUksVUFBQ0MsTUFBRCxFQUFTQyxLQUFULEVBQW1CO0FBQ2hDLGNBQUlBLEtBQUssS0FBS0csU0FBVixJQUF3QlAsT0FBTyxDQUFDUSxRQUFSLElBQW9CSixLQUFLLEtBQUssSUFBMUQsRUFBaUU7QUFDaEUsbUJBQU9ELE1BQVA7QUFDQTs7QUFFRCxjQUFJQyxLQUFLLEtBQUssSUFBZCxFQUFvQjtBQUNuQixnREFBV0QsTUFBWCxJQUFtQixDQUFDTSxNQUFNLENBQUNQLEdBQUQsRUFBTUYsT0FBTixDQUFQLEVBQXVCLElBQXZCLEVBQTZCVSxJQUE3QixDQUFrQyxFQUFsQyxDQUFuQjtBQUNBOztBQUVELDhDQUFXUCxNQUFYLElBQW1CLENBQUNNLE1BQU0sQ0FBQ1AsR0FBRCxFQUFNRixPQUFOLENBQVAsRUFBdUIsS0FBdkIsRUFBOEJTLE1BQU0sQ0FBQ0wsS0FBRCxFQUFRSixPQUFSLENBQXBDLEVBQXNEVSxJQUF0RCxDQUEyRCxFQUEzRCxDQUFuQjtBQUNBLFNBVlM7QUFBQSxPQUFWOztBQVlELFNBQUssT0FBTDtBQUNDLGFBQU8sVUFBQVIsR0FBRztBQUFBLGVBQUksVUFBQ0MsTUFBRCxFQUFTQyxLQUFULEVBQW1CO0FBQ2hDLGNBQUlBLEtBQUssS0FBSyxJQUFWLElBQWtCQSxLQUFLLEtBQUtHLFNBQTVCLElBQXlDSCxLQUFLLENBQUNFLE1BQU4sS0FBaUIsQ0FBOUQsRUFBaUU7QUFDaEUsbUJBQU9ILE1BQVA7QUFDQTs7QUFFRCxjQUFJQSxNQUFNLENBQUNHLE1BQVAsS0FBa0IsQ0FBdEIsRUFBeUI7QUFDeEIsbUJBQU8sQ0FBQyxDQUFDRyxNQUFNLENBQUNQLEdBQUQsRUFBTUYsT0FBTixDQUFQLEVBQXVCLEdBQXZCLEVBQTRCUyxNQUFNLENBQUNMLEtBQUQsRUFBUUosT0FBUixDQUFsQyxFQUFvRFUsSUFBcEQsQ0FBeUQsRUFBekQsQ0FBRCxDQUFQO0FBQ0E7O0FBRUQsaUJBQU8sQ0FBQyxDQUFDUCxNQUFELEVBQVNNLE1BQU0sQ0FBQ0wsS0FBRCxFQUFRSixPQUFSLENBQWYsRUFBaUNVLElBQWpDLENBQXNDLEdBQXRDLENBQUQsQ0FBUDtBQUNBLFNBVlM7QUFBQSxPQUFWOztBQVlEO0FBQ0MsYUFBTyxVQUFBUixHQUFHO0FBQUEsZUFBSSxVQUFDQyxNQUFELEVBQVNDLEtBQVQsRUFBbUI7QUFDaEMsY0FBSUEsS0FBSyxLQUFLRyxTQUFWLElBQXdCUCxPQUFPLENBQUNRLFFBQVIsSUFBb0JKLEtBQUssS0FBSyxJQUExRCxFQUFpRTtBQUNoRSxtQkFBT0QsTUFBUDtBQUNBOztBQUVELGNBQUlDLEtBQUssS0FBSyxJQUFkLEVBQW9CO0FBQ25CLGdEQUFXRCxNQUFYLElBQW1CTSxNQUFNLENBQUNQLEdBQUQsRUFBTUYsT0FBTixDQUF6QjtBQUNBOztBQUVELDhDQUFXRyxNQUFYLElBQW1CLENBQUNNLE1BQU0sQ0FBQ1AsR0FBRCxFQUFNRixPQUFOLENBQVAsRUFBdUIsR0FBdkIsRUFBNEJTLE1BQU0sQ0FBQ0wsS0FBRCxFQUFRSixPQUFSLENBQWxDLEVBQW9EVSxJQUFwRCxDQUF5RCxFQUF6RCxDQUFuQjtBQUNBLFNBVlM7QUFBQSxPQUFWO0FBN0NGO0FBeURBOztBQUVELFNBQVNDLG9CQUFULENBQThCWCxPQUE5QixFQUF1QztBQUN0QyxNQUFJRyxNQUFKOztBQUVBLFVBQVFILE9BQU8sQ0FBQ0MsV0FBaEI7QUFDQyxTQUFLLE9BQUw7QUFDQyxhQUFPLFVBQUNDLEdBQUQsRUFBTUUsS0FBTixFQUFhUSxXQUFiLEVBQTZCO0FBQ25DVCxRQUFBQSxNQUFNLEdBQUcsYUFBYVUsSUFBYixDQUFrQlgsR0FBbEIsQ0FBVDtBQUVBQSxRQUFBQSxHQUFHLEdBQUdBLEdBQUcsQ0FBQ1ksT0FBSixDQUFZLFVBQVosRUFBd0IsRUFBeEIsQ0FBTjs7QUFFQSxZQUFJLENBQUNYLE1BQUwsRUFBYTtBQUNaUyxVQUFBQSxXQUFXLENBQUNWLEdBQUQsQ0FBWCxHQUFtQkUsS0FBbkI7QUFDQTtBQUNBOztBQUVELFlBQUlRLFdBQVcsQ0FBQ1YsR0FBRCxDQUFYLEtBQXFCSyxTQUF6QixFQUFvQztBQUNuQ0ssVUFBQUEsV0FBVyxDQUFDVixHQUFELENBQVgsR0FBbUIsRUFBbkI7QUFDQTs7QUFFRFUsUUFBQUEsV0FBVyxDQUFDVixHQUFELENBQVgsQ0FBaUJDLE1BQU0sQ0FBQyxDQUFELENBQXZCLElBQThCQyxLQUE5QjtBQUNBLE9BZkQ7O0FBaUJELFNBQUssU0FBTDtBQUNDLGFBQU8sVUFBQ0YsR0FBRCxFQUFNRSxLQUFOLEVBQWFRLFdBQWIsRUFBNkI7QUFDbkNULFFBQUFBLE1BQU0sR0FBRyxVQUFVVSxJQUFWLENBQWVYLEdBQWYsQ0FBVDtBQUNBQSxRQUFBQSxHQUFHLEdBQUdBLEdBQUcsQ0FBQ1ksT0FBSixDQUFZLE9BQVosRUFBcUIsRUFBckIsQ0FBTjs7QUFFQSxZQUFJLENBQUNYLE1BQUwsRUFBYTtBQUNaUyxVQUFBQSxXQUFXLENBQUNWLEdBQUQsQ0FBWCxHQUFtQkUsS0FBbkI7QUFDQTtBQUNBOztBQUVELFlBQUlRLFdBQVcsQ0FBQ1YsR0FBRCxDQUFYLEtBQXFCSyxTQUF6QixFQUFvQztBQUNuQ0ssVUFBQUEsV0FBVyxDQUFDVixHQUFELENBQVgsR0FBbUIsQ0FBQ0UsS0FBRCxDQUFuQjtBQUNBO0FBQ0E7O0FBRURRLFFBQUFBLFdBQVcsQ0FBQ1YsR0FBRCxDQUFYLEdBQW1CLEdBQUdhLE1BQUgsQ0FBVUgsV0FBVyxDQUFDVixHQUFELENBQXJCLEVBQTRCRSxLQUE1QixDQUFuQjtBQUNBLE9BZkQ7O0FBaUJELFNBQUssT0FBTDtBQUNDLGFBQU8sVUFBQ0YsR0FBRCxFQUFNRSxLQUFOLEVBQWFRLFdBQWIsRUFBNkI7QUFDbkMsWUFBTUksT0FBTyxHQUFHLE9BQU9aLEtBQVAsS0FBaUIsUUFBakIsSUFBNkJBLEtBQUssQ0FBQ2EsS0FBTixDQUFZLEVBQVosRUFBZ0JDLE9BQWhCLENBQXdCLEdBQXhCLElBQStCLENBQUMsQ0FBN0U7QUFDQSxZQUFNQyxRQUFRLEdBQUdILE9BQU8sR0FBR1osS0FBSyxDQUFDYSxLQUFOLENBQVksR0FBWixDQUFILEdBQXNCYixLQUE5QztBQUNBUSxRQUFBQSxXQUFXLENBQUNWLEdBQUQsQ0FBWCxHQUFtQmlCLFFBQW5CO0FBQ0EsT0FKRDs7QUFNRDtBQUNDLGFBQU8sVUFBQ2pCLEdBQUQsRUFBTUUsS0FBTixFQUFhUSxXQUFiLEVBQTZCO0FBQ25DLFlBQUlBLFdBQVcsQ0FBQ1YsR0FBRCxDQUFYLEtBQXFCSyxTQUF6QixFQUFvQztBQUNuQ0ssVUFBQUEsV0FBVyxDQUFDVixHQUFELENBQVgsR0FBbUJFLEtBQW5CO0FBQ0E7QUFDQTs7QUFFRFEsUUFBQUEsV0FBVyxDQUFDVixHQUFELENBQVgsR0FBbUIsR0FBR2EsTUFBSCxDQUFVSCxXQUFXLENBQUNWLEdBQUQsQ0FBckIsRUFBNEJFLEtBQTVCLENBQW5CO0FBQ0EsT0FQRDtBQTdDRjtBQXNEQTs7QUFFRCxTQUFTSyxNQUFULENBQWdCTCxLQUFoQixFQUF1QkosT0FBdkIsRUFBZ0M7QUFDL0IsTUFBSUEsT0FBTyxDQUFDUyxNQUFaLEVBQW9CO0FBQ25CLFdBQU9ULE9BQU8sQ0FBQ29CLE1BQVIsR0FBaUJ6QixlQUFlLENBQUNTLEtBQUQsQ0FBaEMsR0FBMENpQixrQkFBa0IsQ0FBQ2pCLEtBQUQsQ0FBbkU7QUFDQTs7QUFFRCxTQUFPQSxLQUFQO0FBQ0E7O0FBRUQsU0FBU2tCLE1BQVQsQ0FBZ0JsQixLQUFoQixFQUF1QkosT0FBdkIsRUFBZ0M7QUFDL0IsTUFBSUEsT0FBTyxDQUFDc0IsTUFBWixFQUFvQjtBQUNuQixXQUFPekIsZUFBZSxDQUFDTyxLQUFELENBQXRCO0FBQ0E7O0FBRUQsU0FBT0EsS0FBUDtBQUNBOztBQUVELFNBQVNtQixVQUFULENBQW9CQyxLQUFwQixFQUEyQjtBQUMxQixNQUFJQyxLQUFLLENBQUNULE9BQU4sQ0FBY1EsS0FBZCxDQUFKLEVBQTBCO0FBQ3pCLFdBQU9BLEtBQUssQ0FBQ0UsSUFBTixFQUFQO0FBQ0E7O0FBRUQsTUFBSSxRQUFPRixLQUFQLE1BQWlCLFFBQXJCLEVBQStCO0FBQzlCLFdBQU9ELFVBQVUsQ0FBQ0ksTUFBTSxDQUFDQyxJQUFQLENBQVlKLEtBQVosQ0FBRCxDQUFWLENBQ0xFLElBREssQ0FDQSxVQUFDRyxDQUFELEVBQUlDLENBQUo7QUFBQSxhQUFVQyxNQUFNLENBQUNGLENBQUQsQ0FBTixHQUFZRSxNQUFNLENBQUNELENBQUQsQ0FBNUI7QUFBQSxLQURBLEVBRUxFLEdBRkssQ0FFRCxVQUFBOUIsR0FBRztBQUFBLGFBQUlzQixLQUFLLENBQUN0QixHQUFELENBQVQ7QUFBQSxLQUZGLENBQVA7QUFHQTs7QUFFRCxTQUFPc0IsS0FBUDtBQUNBOztBQUVELFNBQVNTLFVBQVQsQ0FBb0JULEtBQXBCLEVBQTJCO0FBQzFCLE1BQU1VLFNBQVMsR0FBR1YsS0FBSyxDQUFDTixPQUFOLENBQWMsR0FBZCxDQUFsQjs7QUFDQSxNQUFJZ0IsU0FBUyxLQUFLLENBQUMsQ0FBbkIsRUFBc0I7QUFDckJWLElBQUFBLEtBQUssR0FBR0EsS0FBSyxDQUFDVyxLQUFOLENBQVksQ0FBWixFQUFlRCxTQUFmLENBQVI7QUFDQTs7QUFFRCxTQUFPVixLQUFQO0FBQ0E7O0FBRUQsU0FBU1ksT0FBVCxDQUFpQlosS0FBakIsRUFBd0I7QUFDdkJBLEVBQUFBLEtBQUssR0FBR1MsVUFBVSxDQUFDVCxLQUFELENBQWxCO0FBQ0EsTUFBTWEsVUFBVSxHQUFHYixLQUFLLENBQUNOLE9BQU4sQ0FBYyxHQUFkLENBQW5COztBQUNBLE1BQUltQixVQUFVLEtBQUssQ0FBQyxDQUFwQixFQUF1QjtBQUN0QixXQUFPLEVBQVA7QUFDQTs7QUFFRCxTQUFPYixLQUFLLENBQUNXLEtBQU4sQ0FBWUUsVUFBVSxHQUFHLENBQXpCLENBQVA7QUFDQTs7QUFFRCxTQUFTQyxVQUFULENBQW9CbEMsS0FBcEIsRUFBMkJKLE9BQTNCLEVBQW9DO0FBQ25DLE1BQUlBLE9BQU8sQ0FBQ3VDLFlBQVIsSUFBd0IsQ0FBQ1IsTUFBTSxDQUFDUyxLQUFQLENBQWFULE1BQU0sQ0FBQzNCLEtBQUQsQ0FBbkIsQ0FBekIsSUFBeUQsT0FBT0EsS0FBUCxLQUFpQixRQUFqQixJQUE2QkEsS0FBSyxDQUFDcUMsSUFBTixPQUFpQixFQUEzRyxFQUFnSDtBQUMvR3JDLElBQUFBLEtBQUssR0FBRzJCLE1BQU0sQ0FBQzNCLEtBQUQsQ0FBZDtBQUNBLEdBRkQsTUFFTyxJQUFJSixPQUFPLENBQUMwQyxhQUFSLElBQXlCdEMsS0FBSyxLQUFLLElBQW5DLEtBQTRDQSxLQUFLLENBQUN1QyxXQUFOLE9BQXdCLE1BQXhCLElBQWtDdkMsS0FBSyxDQUFDdUMsV0FBTixPQUF3QixPQUF0RyxDQUFKLEVBQW9IO0FBQzFIdkMsSUFBQUEsS0FBSyxHQUFHQSxLQUFLLENBQUN1QyxXQUFOLE9BQXdCLE1BQWhDO0FBQ0E7O0FBRUQsU0FBT3ZDLEtBQVA7QUFDQTs7QUFFRCxTQUFTd0MsS0FBVCxDQUFlcEIsS0FBZixFQUFzQnhCLE9BQXRCLEVBQStCO0FBQzlCQSxFQUFBQSxPQUFPLEdBQUcyQixNQUFNLENBQUNrQixNQUFQLENBQWM7QUFDdkJ2QixJQUFBQSxNQUFNLEVBQUUsSUFEZTtBQUV2QkksSUFBQUEsSUFBSSxFQUFFLElBRmlCO0FBR3ZCekIsSUFBQUEsV0FBVyxFQUFFLE1BSFU7QUFJdkJzQyxJQUFBQSxZQUFZLEVBQUUsS0FKUztBQUt2QkcsSUFBQUEsYUFBYSxFQUFFO0FBTFEsR0FBZCxFQU1QMUMsT0FOTyxDQUFWO0FBUUEsTUFBTThDLFNBQVMsR0FBR25DLG9CQUFvQixDQUFDWCxPQUFELENBQXRDLENBVDhCLENBVzlCOztBQUNBLE1BQU0rQyxHQUFHLEdBQUdwQixNQUFNLENBQUNxQixNQUFQLENBQWMsSUFBZCxDQUFaOztBQUVBLE1BQUksT0FBT3hCLEtBQVAsS0FBaUIsUUFBckIsRUFBK0I7QUFDOUIsV0FBT3VCLEdBQVA7QUFDQTs7QUFFRHZCLEVBQUFBLEtBQUssR0FBR0EsS0FBSyxDQUFDaUIsSUFBTixHQUFhM0IsT0FBYixDQUFxQixRQUFyQixFQUErQixFQUEvQixDQUFSOztBQUVBLE1BQUksQ0FBQ1UsS0FBTCxFQUFZO0FBQ1gsV0FBT3VCLEdBQVA7QUFDQTs7QUF0QjZCO0FBQUE7QUFBQTs7QUFBQTtBQXdCOUIseUJBQW9CdkIsS0FBSyxDQUFDUCxLQUFOLENBQVksR0FBWixDQUFwQiw4SEFBc0M7QUFBQSxVQUEzQmdDLEtBQTJCOztBQUFBLDBCQUNsQm5ELFlBQVksQ0FBQ0UsT0FBTyxDQUFDc0IsTUFBUixHQUFpQjJCLEtBQUssQ0FBQ25DLE9BQU4sQ0FBYyxLQUFkLEVBQXFCLEdBQXJCLENBQWpCLEdBQTZDbUMsS0FBOUMsRUFBcUQsR0FBckQsQ0FETTtBQUFBO0FBQUEsVUFDaEMvQyxHQURnQztBQUFBLFVBQzNCRSxLQUQyQixzQkFHckM7QUFDQTs7O0FBQ0FBLE1BQUFBLEtBQUssR0FBR0EsS0FBSyxLQUFLRyxTQUFWLEdBQXNCLElBQXRCLEdBQTZCZSxNQUFNLENBQUNsQixLQUFELEVBQVFKLE9BQVIsQ0FBM0M7QUFDQThDLE1BQUFBLFNBQVMsQ0FBQ3hCLE1BQU0sQ0FBQ3BCLEdBQUQsRUFBTUYsT0FBTixDQUFQLEVBQXVCSSxLQUF2QixFQUE4QjJDLEdBQTlCLENBQVQ7QUFDQTtBQS9CNkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFpQzlCLGtDQUFrQnBCLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZbUIsR0FBWixDQUFsQixrQ0FBb0M7QUFBL0IsUUFBTTdDLElBQUcsbUJBQVQ7QUFDSixRQUFNRSxNQUFLLEdBQUcyQyxHQUFHLENBQUM3QyxJQUFELENBQWpCOztBQUNBLFFBQUksUUFBT0UsTUFBUCxNQUFpQixRQUFqQixJQUE2QkEsTUFBSyxLQUFLLElBQTNDLEVBQWlEO0FBQ2hELHdDQUFnQnVCLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZeEIsTUFBWixDQUFoQixxQ0FBb0M7QUFBL0IsWUFBTThDLENBQUMscUJBQVA7QUFDSjlDLFFBQUFBLE1BQUssQ0FBQzhDLENBQUQsQ0FBTCxHQUFXWixVQUFVLENBQUNsQyxNQUFLLENBQUM4QyxDQUFELENBQU4sRUFBV2xELE9BQVgsQ0FBckI7QUFDQTtBQUNELEtBSkQsTUFJTztBQUNOK0MsTUFBQUEsR0FBRyxDQUFDN0MsSUFBRCxDQUFILEdBQVdvQyxVQUFVLENBQUNsQyxNQUFELEVBQVFKLE9BQVIsQ0FBckI7QUFDQTtBQUNEOztBQUVELE1BQUlBLE9BQU8sQ0FBQzBCLElBQVIsS0FBaUIsS0FBckIsRUFBNEI7QUFDM0IsV0FBT3FCLEdBQVA7QUFDQTs7QUFFRCxTQUFPLENBQUMvQyxPQUFPLENBQUMwQixJQUFSLEtBQWlCLElBQWpCLEdBQXdCQyxNQUFNLENBQUNDLElBQVAsQ0FBWW1CLEdBQVosRUFBaUJyQixJQUFqQixFQUF4QixHQUFrREMsTUFBTSxDQUFDQyxJQUFQLENBQVltQixHQUFaLEVBQWlCckIsSUFBakIsQ0FBc0IxQixPQUFPLENBQUMwQixJQUE5QixDQUFuRCxFQUF3RnlCLE1BQXhGLENBQStGLFVBQUNoRCxNQUFELEVBQVNELEdBQVQsRUFBaUI7QUFDdEgsUUFBTUUsS0FBSyxHQUFHMkMsR0FBRyxDQUFDN0MsR0FBRCxDQUFqQjs7QUFDQSxRQUFJa0QsT0FBTyxDQUFDaEQsS0FBRCxDQUFQLElBQWtCLFFBQU9BLEtBQVAsTUFBaUIsUUFBbkMsSUFBK0MsQ0FBQ3FCLEtBQUssQ0FBQ1QsT0FBTixDQUFjWixLQUFkLENBQXBELEVBQTBFO0FBQ3pFO0FBQ0FELE1BQUFBLE1BQU0sQ0FBQ0QsR0FBRCxDQUFOLEdBQWNxQixVQUFVLENBQUNuQixLQUFELENBQXhCO0FBQ0EsS0FIRCxNQUdPO0FBQ05ELE1BQUFBLE1BQU0sQ0FBQ0QsR0FBRCxDQUFOLEdBQWNFLEtBQWQ7QUFDQTs7QUFFRCxXQUFPRCxNQUFQO0FBQ0EsR0FWTSxFQVVKd0IsTUFBTSxDQUFDcUIsTUFBUCxDQUFjLElBQWQsQ0FWSSxDQUFQO0FBV0E7O0FBRURLLE9BQU8sQ0FBQ2pCLE9BQVIsR0FBa0JBLE9BQWxCO0FBQ0FpQixPQUFPLENBQUNULEtBQVIsR0FBZ0JBLEtBQWhCOztBQUVBUyxPQUFPLENBQUNDLFNBQVIsR0FBb0IsVUFBQ0MsTUFBRCxFQUFTdkQsT0FBVCxFQUFxQjtBQUN4QyxNQUFJLENBQUN1RCxNQUFMLEVBQWE7QUFDWixXQUFPLEVBQVA7QUFDQTs7QUFFRHZELEVBQUFBLE9BQU8sR0FBRzJCLE1BQU0sQ0FBQ2tCLE1BQVAsQ0FBYztBQUN2QnBDLElBQUFBLE1BQU0sRUFBRSxJQURlO0FBRXZCVyxJQUFBQSxNQUFNLEVBQUUsSUFGZTtBQUd2Qm5CLElBQUFBLFdBQVcsRUFBRTtBQUhVLEdBQWQsRUFJUEQsT0FKTyxDQUFWO0FBTUEsTUFBTThDLFNBQVMsR0FBRy9DLHFCQUFxQixDQUFDQyxPQUFELENBQXZDO0FBRUEsTUFBTXdELFVBQVUsR0FBRzdCLE1BQU0sQ0FBQ2tCLE1BQVAsQ0FBYyxFQUFkLEVBQWtCVSxNQUFsQixDQUFuQjs7QUFDQSxNQUFJdkQsT0FBTyxDQUFDUSxRQUFaLEVBQXNCO0FBQ3JCLHNDQUFrQm1CLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZNEIsVUFBWixDQUFsQixxQ0FBMkM7QUFBdEMsVUFBTXRELEdBQUcscUJBQVQ7O0FBQ0osVUFBSXNELFVBQVUsQ0FBQ3RELEdBQUQsQ0FBVixLQUFvQkssU0FBcEIsSUFBaUNpRCxVQUFVLENBQUN0RCxHQUFELENBQVYsS0FBb0IsSUFBekQsRUFBK0Q7QUFDOUQsZUFBT3NELFVBQVUsQ0FBQ3RELEdBQUQsQ0FBakI7QUFDQTtBQUNEO0FBQ0Q7O0FBRUQsTUFBTTBCLElBQUksR0FBR0QsTUFBTSxDQUFDQyxJQUFQLENBQVk0QixVQUFaLENBQWI7O0FBRUEsTUFBSXhELE9BQU8sQ0FBQzBCLElBQVIsS0FBaUIsS0FBckIsRUFBNEI7QUFDM0JFLElBQUFBLElBQUksQ0FBQ0YsSUFBTCxDQUFVMUIsT0FBTyxDQUFDMEIsSUFBbEI7QUFDQTs7QUFFRCxTQUFPRSxJQUFJLENBQUNJLEdBQUwsQ0FBUyxVQUFBOUIsR0FBRyxFQUFJO0FBQ3RCLFFBQU1FLEtBQUssR0FBR21ELE1BQU0sQ0FBQ3JELEdBQUQsQ0FBcEI7O0FBRUEsUUFBSUUsS0FBSyxLQUFLRyxTQUFkLEVBQXlCO0FBQ3hCLGFBQU8sRUFBUDtBQUNBOztBQUVELFFBQUlILEtBQUssS0FBSyxJQUFkLEVBQW9CO0FBQ25CLGFBQU9LLE1BQU0sQ0FBQ1AsR0FBRCxFQUFNRixPQUFOLENBQWI7QUFDQTs7QUFFRCxRQUFJeUIsS0FBSyxDQUFDVCxPQUFOLENBQWNaLEtBQWQsQ0FBSixFQUEwQjtBQUN6QixhQUFPQSxLQUFLLENBQ1YrQyxNQURLLENBQ0VMLFNBQVMsQ0FBQzVDLEdBQUQsQ0FEWCxFQUNrQixFQURsQixFQUVMUSxJQUZLLENBRUEsR0FGQSxDQUFQO0FBR0E7O0FBRUQsV0FBT0QsTUFBTSxDQUFDUCxHQUFELEVBQU1GLE9BQU4sQ0FBTixHQUF1QixHQUF2QixHQUE2QlMsTUFBTSxDQUFDTCxLQUFELEVBQVFKLE9BQVIsQ0FBMUM7QUFDQSxHQWxCTSxFQWtCSnlELE1BbEJJLENBa0JHLFVBQUFDLENBQUM7QUFBQSxXQUFJQSxDQUFDLENBQUNwRCxNQUFGLEdBQVcsQ0FBZjtBQUFBLEdBbEJKLEVBa0JzQkksSUFsQnRCLENBa0IyQixHQWxCM0IsQ0FBUDtBQW1CQSxDQS9DRDs7QUFpREEyQyxPQUFPLENBQUNNLFFBQVIsR0FBbUIsVUFBQ25DLEtBQUQsRUFBUXhCLE9BQVIsRUFBb0I7QUFDdEMsU0FBTztBQUNONEQsSUFBQUEsR0FBRyxFQUFFM0IsVUFBVSxDQUFDVCxLQUFELENBQVYsQ0FBa0JQLEtBQWxCLENBQXdCLEdBQXhCLEVBQTZCLENBQTdCLEtBQW1DLEVBRGxDO0FBRU40QyxJQUFBQSxLQUFLLEVBQUVqQixLQUFLLENBQUNSLE9BQU8sQ0FBQ1osS0FBRCxDQUFSLEVBQWlCeEIsT0FBakI7QUFGTixHQUFQO0FBSUEsQ0FMRCIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbmNvbnN0IHN0cmljdFVyaUVuY29kZSA9IHJlcXVpcmUoJ2Jtcy1zdHJpY3QtdXJpLWVuY29kZScpO1xuY29uc3QgZGVjb2RlQ29tcG9uZW50ID0gcmVxdWlyZSgnZGVjb2RlLXVyaS1jb21wb25lbnQnKTtcbmNvbnN0IHNwbGl0T25GaXJzdCA9IHJlcXVpcmUoJ2Jtcy1zcGxpdC1vbi1maXJzdCcpO1xuXG5mdW5jdGlvbiBlbmNvZGVyRm9yQXJyYXlGb3JtYXQob3B0aW9ucykge1xuXHRzd2l0Y2ggKG9wdGlvbnMuYXJyYXlGb3JtYXQpIHtcblx0XHRjYXNlICdpbmRleCc6XG5cdFx0XHRyZXR1cm4ga2V5ID0+IChyZXN1bHQsIHZhbHVlKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGluZGV4ID0gcmVzdWx0Lmxlbmd0aDtcblx0XHRcdFx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgKG9wdGlvbnMuc2tpcE51bGwgJiYgdmFsdWUgPT09IG51bGwpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdHJldHVybiBbLi4ucmVzdWx0LCBbZW5jb2RlKGtleSwgb3B0aW9ucyksICdbJywgaW5kZXgsICddJ10uam9pbignJyldO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0XHQuLi5yZXN1bHQsXG5cdFx0XHRcdFx0W2VuY29kZShrZXksIG9wdGlvbnMpLCAnWycsIGVuY29kZShpbmRleCwgb3B0aW9ucyksICddPScsIGVuY29kZSh2YWx1ZSwgb3B0aW9ucyldLmpvaW4oJycpXG5cdFx0XHRcdF07XG5cdFx0XHR9O1xuXG5cdFx0Y2FzZSAnYnJhY2tldCc6XG5cdFx0XHRyZXR1cm4ga2V5ID0+IChyZXN1bHQsIHZhbHVlKSA9PiB7XG5cdFx0XHRcdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IChvcHRpb25zLnNraXBOdWxsICYmIHZhbHVlID09PSBudWxsKSkge1xuXHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcblx0XHRcdFx0XHRyZXR1cm4gWy4uLnJlc3VsdCwgW2VuY29kZShrZXksIG9wdGlvbnMpLCAnW10nXS5qb2luKCcnKV07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gWy4uLnJlc3VsdCwgW2VuY29kZShrZXksIG9wdGlvbnMpLCAnW109JywgZW5jb2RlKHZhbHVlLCBvcHRpb25zKV0uam9pbignJyldO1xuXHRcdFx0fTtcblxuXHRcdGNhc2UgJ2NvbW1hJzpcblx0XHRcdHJldHVybiBrZXkgPT4gKHJlc3VsdCwgdmFsdWUpID0+IHtcblx0XHRcdFx0aWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChyZXN1bHQubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFtbZW5jb2RlKGtleSwgb3B0aW9ucyksICc9JywgZW5jb2RlKHZhbHVlLCBvcHRpb25zKV0uam9pbignJyldO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFtbcmVzdWx0LCBlbmNvZGUodmFsdWUsIG9wdGlvbnMpXS5qb2luKCcsJyldO1xuXHRcdFx0fTtcblxuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXR1cm4ga2V5ID0+IChyZXN1bHQsIHZhbHVlKSA9PiB7XG5cdFx0XHRcdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IChvcHRpb25zLnNraXBOdWxsICYmIHZhbHVlID09PSBudWxsKSkge1xuXHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcblx0XHRcdFx0XHRyZXR1cm4gWy4uLnJlc3VsdCwgZW5jb2RlKGtleSwgb3B0aW9ucyldO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFsuLi5yZXN1bHQsIFtlbmNvZGUoa2V5LCBvcHRpb25zKSwgJz0nLCBlbmNvZGUodmFsdWUsIG9wdGlvbnMpXS5qb2luKCcnKV07XG5cdFx0XHR9O1xuXHR9XG59XG5cbmZ1bmN0aW9uIHBhcnNlckZvckFycmF5Rm9ybWF0KG9wdGlvbnMpIHtcblx0bGV0IHJlc3VsdDtcblxuXHRzd2l0Y2ggKG9wdGlvbnMuYXJyYXlGb3JtYXQpIHtcblx0XHRjYXNlICdpbmRleCc6XG5cdFx0XHRyZXR1cm4gKGtleSwgdmFsdWUsIGFjY3VtdWxhdG9yKSA9PiB7XG5cdFx0XHRcdHJlc3VsdCA9IC9cXFsoXFxkKilcXF0kLy5leGVjKGtleSk7XG5cblx0XHRcdFx0a2V5ID0ga2V5LnJlcGxhY2UoL1xcW1xcZCpcXF0kLywgJycpO1xuXG5cdFx0XHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XSA9IHZhbHVlO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChhY2N1bXVsYXRvcltrZXldID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRhY2N1bXVsYXRvcltrZXldID0ge307XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhY2N1bXVsYXRvcltrZXldW3Jlc3VsdFsxXV0gPSB2YWx1ZTtcblx0XHRcdH07XG5cblx0XHRjYXNlICdicmFja2V0Jzpcblx0XHRcdHJldHVybiAoa2V5LCB2YWx1ZSwgYWNjdW11bGF0b3IpID0+IHtcblx0XHRcdFx0cmVzdWx0ID0gLyhcXFtcXF0pJC8uZXhlYyhrZXkpO1xuXHRcdFx0XHRrZXkgPSBrZXkucmVwbGFjZSgvXFxbXFxdJC8sICcnKTtcblxuXHRcdFx0XHRpZiAoIXJlc3VsdCkge1xuXHRcdFx0XHRcdGFjY3VtdWxhdG9yW2tleV0gPSB2YWx1ZTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoYWNjdW11bGF0b3Jba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XSA9IFt2YWx1ZV07XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XSA9IFtdLmNvbmNhdChhY2N1bXVsYXRvcltrZXldLCB2YWx1ZSk7XG5cdFx0XHR9O1xuXG5cdFx0Y2FzZSAnY29tbWEnOlxuXHRcdFx0cmV0dXJuIChrZXksIHZhbHVlLCBhY2N1bXVsYXRvcikgPT4ge1xuXHRcdFx0XHRjb25zdCBpc0FycmF5ID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiB2YWx1ZS5zcGxpdCgnJykuaW5kZXhPZignLCcpID4gLTE7XG5cdFx0XHRcdGNvbnN0IG5ld1ZhbHVlID0gaXNBcnJheSA/IHZhbHVlLnNwbGl0KCcsJykgOiB2YWx1ZTtcblx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XSA9IG5ld1ZhbHVlO1xuXHRcdFx0fTtcblxuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXR1cm4gKGtleSwgdmFsdWUsIGFjY3VtdWxhdG9yKSA9PiB7XG5cdFx0XHRcdGlmIChhY2N1bXVsYXRvcltrZXldID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRhY2N1bXVsYXRvcltrZXldID0gdmFsdWU7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YWNjdW11bGF0b3Jba2V5XSA9IFtdLmNvbmNhdChhY2N1bXVsYXRvcltrZXldLCB2YWx1ZSk7XG5cdFx0XHR9O1xuXHR9XG59XG5cbmZ1bmN0aW9uIGVuY29kZSh2YWx1ZSwgb3B0aW9ucykge1xuXHRpZiAob3B0aW9ucy5lbmNvZGUpIHtcblx0XHRyZXR1cm4gb3B0aW9ucy5zdHJpY3QgPyBzdHJpY3RVcmlFbmNvZGUodmFsdWUpIDogZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcblx0fVxuXG5cdHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZGVjb2RlKHZhbHVlLCBvcHRpb25zKSB7XG5cdGlmIChvcHRpb25zLmRlY29kZSkge1xuXHRcdHJldHVybiBkZWNvZGVDb21wb25lbnQodmFsdWUpO1xuXHR9XG5cblx0cmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBrZXlzU29ydGVyKGlucHV0KSB7XG5cdGlmIChBcnJheS5pc0FycmF5KGlucHV0KSkge1xuXHRcdHJldHVybiBpbnB1dC5zb3J0KCk7XG5cdH1cblxuXHRpZiAodHlwZW9mIGlucHV0ID09PSAnb2JqZWN0Jykge1xuXHRcdHJldHVybiBrZXlzU29ydGVyKE9iamVjdC5rZXlzKGlucHV0KSlcblx0XHRcdC5zb3J0KChhLCBiKSA9PiBOdW1iZXIoYSkgLSBOdW1iZXIoYikpXG5cdFx0XHQubWFwKGtleSA9PiBpbnB1dFtrZXldKTtcblx0fVxuXG5cdHJldHVybiBpbnB1dDtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlSGFzaChpbnB1dCkge1xuXHRjb25zdCBoYXNoU3RhcnQgPSBpbnB1dC5pbmRleE9mKCcjJyk7XG5cdGlmIChoYXNoU3RhcnQgIT09IC0xKSB7XG5cdFx0aW5wdXQgPSBpbnB1dC5zbGljZSgwLCBoYXNoU3RhcnQpO1xuXHR9XG5cblx0cmV0dXJuIGlucHV0O1xufVxuXG5mdW5jdGlvbiBleHRyYWN0KGlucHV0KSB7XG5cdGlucHV0ID0gcmVtb3ZlSGFzaChpbnB1dCk7XG5cdGNvbnN0IHF1ZXJ5U3RhcnQgPSBpbnB1dC5pbmRleE9mKCc/Jyk7XG5cdGlmIChxdWVyeVN0YXJ0ID09PSAtMSkge1xuXHRcdHJldHVybiAnJztcblx0fVxuXG5cdHJldHVybiBpbnB1dC5zbGljZShxdWVyeVN0YXJ0ICsgMSk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlVmFsdWUodmFsdWUsIG9wdGlvbnMpIHtcblx0aWYgKG9wdGlvbnMucGFyc2VOdW1iZXJzICYmICFOdW1iZXIuaXNOYU4oTnVtYmVyKHZhbHVlKSkgJiYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgdmFsdWUudHJpbSgpICE9PSAnJykpIHtcblx0XHR2YWx1ZSA9IE51bWJlcih2YWx1ZSk7XG5cdH0gZWxzZSBpZiAob3B0aW9ucy5wYXJzZUJvb2xlYW5zICYmIHZhbHVlICE9PSBudWxsICYmICh2YWx1ZS50b0xvd2VyQ2FzZSgpID09PSAndHJ1ZScgfHwgdmFsdWUudG9Mb3dlckNhc2UoKSA9PT0gJ2ZhbHNlJykpIHtcblx0XHR2YWx1ZSA9IHZhbHVlLnRvTG93ZXJDYXNlKCkgPT09ICd0cnVlJztcblx0fVxuXG5cdHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gcGFyc2UoaW5wdXQsIG9wdGlvbnMpIHtcblx0b3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuXHRcdGRlY29kZTogdHJ1ZSxcblx0XHRzb3J0OiB0cnVlLFxuXHRcdGFycmF5Rm9ybWF0OiAnbm9uZScsXG5cdFx0cGFyc2VOdW1iZXJzOiBmYWxzZSxcblx0XHRwYXJzZUJvb2xlYW5zOiBmYWxzZVxuXHR9LCBvcHRpb25zKTtcblxuXHRjb25zdCBmb3JtYXR0ZXIgPSBwYXJzZXJGb3JBcnJheUZvcm1hdChvcHRpb25zKTtcblxuXHQvLyBDcmVhdGUgYW4gb2JqZWN0IHdpdGggbm8gcHJvdG90eXBlXG5cdGNvbnN0IHJldCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cblx0aWYgKHR5cGVvZiBpbnB1dCAhPT0gJ3N0cmluZycpIHtcblx0XHRyZXR1cm4gcmV0O1xuXHR9XG5cblx0aW5wdXQgPSBpbnB1dC50cmltKCkucmVwbGFjZSgvXls/IyZdLywgJycpO1xuXG5cdGlmICghaW5wdXQpIHtcblx0XHRyZXR1cm4gcmV0O1xuXHR9XG5cblx0Zm9yIChjb25zdCBwYXJhbSBvZiBpbnB1dC5zcGxpdCgnJicpKSB7XG5cdFx0bGV0IFtrZXksIHZhbHVlXSA9IHNwbGl0T25GaXJzdChvcHRpb25zLmRlY29kZSA/IHBhcmFtLnJlcGxhY2UoL1xcKy9nLCAnICcpIDogcGFyYW0sICc9Jyk7XG5cblx0XHQvLyBNaXNzaW5nIGA9YCBzaG91bGQgYmUgYG51bGxgOlxuXHRcdC8vIGh0dHA6Ly93My5vcmcvVFIvMjAxMi9XRC11cmwtMjAxMjA1MjQvI2NvbGxlY3QtdXJsLXBhcmFtZXRlcnNcblx0XHR2YWx1ZSA9IHZhbHVlID09PSB1bmRlZmluZWQgPyBudWxsIDogZGVjb2RlKHZhbHVlLCBvcHRpb25zKTtcblx0XHRmb3JtYXR0ZXIoZGVjb2RlKGtleSwgb3B0aW9ucyksIHZhbHVlLCByZXQpO1xuXHR9XG5cblx0Zm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMocmV0KSkge1xuXHRcdGNvbnN0IHZhbHVlID0gcmV0W2tleV07XG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcblx0XHRcdGZvciAoY29uc3QgayBvZiBPYmplY3Qua2V5cyh2YWx1ZSkpIHtcblx0XHRcdFx0dmFsdWVba10gPSBwYXJzZVZhbHVlKHZhbHVlW2tdLCBvcHRpb25zKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0W2tleV0gPSBwYXJzZVZhbHVlKHZhbHVlLCBvcHRpb25zKTtcblx0XHR9XG5cdH1cblxuXHRpZiAob3B0aW9ucy5zb3J0ID09PSBmYWxzZSkge1xuXHRcdHJldHVybiByZXQ7XG5cdH1cblxuXHRyZXR1cm4gKG9wdGlvbnMuc29ydCA9PT0gdHJ1ZSA/IE9iamVjdC5rZXlzKHJldCkuc29ydCgpIDogT2JqZWN0LmtleXMocmV0KS5zb3J0KG9wdGlvbnMuc29ydCkpLnJlZHVjZSgocmVzdWx0LCBrZXkpID0+IHtcblx0XHRjb25zdCB2YWx1ZSA9IHJldFtrZXldO1xuXHRcdGlmIChCb29sZWFuKHZhbHVlKSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuXHRcdFx0Ly8gU29ydCBvYmplY3Qga2V5cywgbm90IHZhbHVlc1xuXHRcdFx0cmVzdWx0W2tleV0gPSBrZXlzU29ydGVyKHZhbHVlKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0W2tleV0gPSB2YWx1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9LCBPYmplY3QuY3JlYXRlKG51bGwpKTtcbn1cblxuZXhwb3J0cy5leHRyYWN0ID0gZXh0cmFjdDtcbmV4cG9ydHMucGFyc2UgPSBwYXJzZTtcblxuZXhwb3J0cy5zdHJpbmdpZnkgPSAob2JqZWN0LCBvcHRpb25zKSA9PiB7XG5cdGlmICghb2JqZWN0KSB7XG5cdFx0cmV0dXJuICcnO1xuXHR9XG5cblx0b3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuXHRcdGVuY29kZTogdHJ1ZSxcblx0XHRzdHJpY3Q6IHRydWUsXG5cdFx0YXJyYXlGb3JtYXQ6ICdub25lJ1xuXHR9LCBvcHRpb25zKTtcblxuXHRjb25zdCBmb3JtYXR0ZXIgPSBlbmNvZGVyRm9yQXJyYXlGb3JtYXQob3B0aW9ucyk7XG5cblx0Y29uc3Qgb2JqZWN0Q29weSA9IE9iamVjdC5hc3NpZ24oe30sIG9iamVjdCk7XG5cdGlmIChvcHRpb25zLnNraXBOdWxsKSB7XG5cdFx0Zm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMob2JqZWN0Q29weSkpIHtcblx0XHRcdGlmIChvYmplY3RDb3B5W2tleV0gPT09IHVuZGVmaW5lZCB8fCBvYmplY3RDb3B5W2tleV0gPT09IG51bGwpIHtcblx0XHRcdFx0ZGVsZXRlIG9iamVjdENvcHlba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRjb25zdCBrZXlzID0gT2JqZWN0LmtleXMob2JqZWN0Q29weSk7XG5cblx0aWYgKG9wdGlvbnMuc29ydCAhPT0gZmFsc2UpIHtcblx0XHRrZXlzLnNvcnQob3B0aW9ucy5zb3J0KTtcblx0fVxuXG5cdHJldHVybiBrZXlzLm1hcChrZXkgPT4ge1xuXHRcdGNvbnN0IHZhbHVlID0gb2JqZWN0W2tleV07XG5cblx0XHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuICcnO1xuXHRcdH1cblxuXHRcdGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGVuY29kZShrZXksIG9wdGlvbnMpO1xuXHRcdH1cblxuXHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuXHRcdFx0cmV0dXJuIHZhbHVlXG5cdFx0XHRcdC5yZWR1Y2UoZm9ybWF0dGVyKGtleSksIFtdKVxuXHRcdFx0XHQuam9pbignJicpO1xuXHRcdH1cblxuXHRcdHJldHVybiBlbmNvZGUoa2V5LCBvcHRpb25zKSArICc9JyArIGVuY29kZSh2YWx1ZSwgb3B0aW9ucyk7XG5cdH0pLmZpbHRlcih4ID0+IHgubGVuZ3RoID4gMCkuam9pbignJicpO1xufTtcblxuZXhwb3J0cy5wYXJzZVVybCA9IChpbnB1dCwgb3B0aW9ucykgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdHVybDogcmVtb3ZlSGFzaChpbnB1dCkuc3BsaXQoJz8nKVswXSB8fCAnJyxcblx0XHRxdWVyeTogcGFyc2UoZXh0cmFjdChpbnB1dCksIG9wdGlvbnMpXG5cdH07XG59O1xuIl19