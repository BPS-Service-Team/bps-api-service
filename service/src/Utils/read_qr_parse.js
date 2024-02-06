const readQrParse = input => {
  try {
    let filterInput = JSON.parse(input);
    const firstKeyObj = Object.keys(filterInput)[0];
    const filterValue =
      filterInput[firstKeyObj].WH +
      filterInput[firstKeyObj][firstKeyObj === 'TO' ? 'ID' : 'TO'];
    return filterValue;
  } catch (error) {
    return input;
  }
};

export default readQrParse;
