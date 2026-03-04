function yearsFromBirthDate(dateOfBirth) {
  if (dateOfBirth === undefined || dateOfBirth === null) return 0;

  let years = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  let month = new Date().getMonth() - new Date(dateOfBirth).getMonth();
  const dateDiff = new Date().getDay() - new Date(dateOfBirth).getDay();
  if (dateDiff < 0) {
    month -= 1;
  }
  if (month < 0) {
    years -= 1;
  }

  return years;
}

module.exports = yearsFromBirthDate;
