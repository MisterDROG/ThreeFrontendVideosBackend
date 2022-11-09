//function for finding amount in string type "7,22&nbsp;тыс. просмотров"
function findAmountInString(stringWithAmount) {
  const regExpNumb = /([0-9,]+)|тыс|млн|млрд/g;

  const splitStr = stringWithAmount.match(regExpNumb);

  let amount = 0;
  if (splitStr[1] && splitStr[1] == "млрд") {
    amount = Number(splitStr[0].replace(",", ".")) * 1000000000;
  } else if (splitStr[1] && splitStr[1] == "млн") {
    amount = Number(splitStr[0].replace(",", ".")) * 1000000;
  } else if (splitStr[1] && splitStr[1] == "тыс") {
    amount = Number(splitStr[0].replace(",", ".")) * 1000;
  } else {
    amount = Number(splitStr[0].replace(",", ".").split(" ")[0]);
  }

  return amount;
}

module.exports = findAmountInString;
