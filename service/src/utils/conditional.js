/**
 * Check individual values
 *
 * @param {object} oValue1 - First value
 * @param {object} oValue2 - Second value
 * @returns {boolean}
 */
const conditionItem = (oValue1, oValue2) => {
  if (oValue1 === null || oValue1 === undefined) {
    return true;
  } else if (typeof oValue1 === 'string') {
    if (oValue1 === 'null' || oValue1 === 'undefined' || oValue1 === '') {
      return true;
    } else if (oValue2 === null || oValue2 === undefined) {
      return true;
    } else if (oValue1.toLowerCase() === oValue2.toLowerCase()) {
      return true;
    }
  } else if (oValue2 === null || oValue2 === undefined) {
    return true;
  } else if (typeof oValue2 === 'string') {
    if (oValue2 === 'null' || oValue2 === 'undefined' || oValue2 === '') {
      return true;
    } else if (oValue2.toLowerCase() === oValue1.toLowerCase()) {
      return true;
    }
  } else if (oValue2 === oValue1) {
    return true;
  }

  return false;
};

/**
 * Is responsible to check per key is source it's equal to target
 *
 * @param {object} oSource - Source object
 * @param {object} oTarget - Target object
 * @param {array} aKeys - Keys to compare
 * @returns {boolean}
 */
const iterateKeyCond = (oSource, oTarget, aKeys) => {
  for (let oKey of aKeys) {
    if (typeof oKey === 'string') {
      if (!conditionItem(oSource[oKey], oTarget[oKey])) {
        return false;
      }
    } else if (Array.isArray(oKey)) {
      if (!conditionItem(oSource[oKey[0]], oTarget[oKey[1]])) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Check exactly the same value on two objects
 *
 * @param {object} oSource - Source object
 * @param {object} oTarget - Target object
 * @param {array} aKeys - Keys to compare
 * @returns {boolean}
 */
const iterateKeyExactly = (oSource, oTarget, aKeys) => {
  for (let oKey of aKeys) {
    if (typeof oKey === 'string') {
      if (oSource[oKey] != oTarget[oKey]) {
        return false;
      }
    } else if (Array.isArray(oKey)) {
      if (oSource[oKey[0]] != oTarget[oKey[1]]) {
        return false;
      }
    }
  }

  return true;
};

module.exports = {
  iterateKeyCond,
  iterateKeyExactly,
};
