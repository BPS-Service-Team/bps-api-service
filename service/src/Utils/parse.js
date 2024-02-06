export function stringSeparate(name = '') {
  let words = name.split(' '),
    clip = '';
  for (let word of words) {
    clip += word[0];
  }
  return clip.toLocaleUpperCase();
}

export const getFileType = (name = '') => {
  let names = name.split('.');
  return names[names.length - 1];
};
export const parseNaturalStr = s =>
  (' ' + s + ' ')
    .replace(/[\s]+/g, ' ')
    .toLowerCase()
    .replace(/[\d]+/, function (d) {
      d = '' + 1e20 + d;
      return d.substring(d.length - 20);
    });

export const naturalSort = (arr = [], mode = 1) => {
  if (mode === -1) {
    return arr.sort(function (b, a) {
      return parseNaturalStr(a?.RealName).localeCompare(
        parseNaturalStr(b?.RealName)
      );
    });
  }
  return arr.sort(function (a, b) {
    return parseNaturalStr(a?.RealName).localeCompare(
      parseNaturalStr(b?.RealName)
    );
  });
};
