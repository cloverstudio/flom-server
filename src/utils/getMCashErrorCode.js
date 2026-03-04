const { Const } = require("#config");

function getMCashErrorCode(code) {
  switch (code) {
    case "01":
      return Const.responsecodeMCashStatusUnknown;

    case "03":
      return Const.responsecodeMCashInvalidSender;

    case "05":
      return Const.responsecodeMCashDoNotHonor;

    case "06":
      return Const.responsecodeMCashDormantAccount;

    case "07":
      return Const.responsecodeMCashInvalidAccount;

    case "08":
      return Const.responsecodeMCashAccountNameMismatch;

    case "09":
      return Const.responsecodeMCashRequestProcessingInProgress;

    case "12":
      return Const.responsecodeMCashInvalidTransaction;

    case "13":
      return Const.responsecodeMCashInvalidAmount;

    case "14":
      return Const.responsecodeMCashInvalidBatchNumber;

    case "15":
      return Const.responsecodeMCashInvalidSessionOrRecordID;

    case "16":
      return Const.responsecodeMCashUnknownBankCodeOrRequestorID;

    case "17":
      return Const.responsecodeMCashInvalidChannel;

    case "18":
      return Const.responsecodeMCashWrongMethodCall;

    case "21":
      return Const.responsecodeMCashNoActionTaken;

    case "22":
      return Const.responsecodeMCashInvalidMerchant;

    case "25":
      return Const.responsecodeMCashUnableToLocateRecord;

    case "26":
      return Const.responsecodeMCashDuplicateRecord;

    case "30":
      return Const.responsecodeMCashFormatError;

    case "34":
      return Const.responsecodeMCashSuspectedFraud;

    case "35":
      return Const.responsecodeMCashContactSendingBank;

    case "51":
      return Const.responsecodeMCashNoSufficientFunds;

    case "57":
      return Const.responsecodeMCashTransactionNotPermittedToSender;

    case "58":
      return Const.responsecodeMCashTransactionNotPermittedOnChannel;

    case "61":
      return Const.responsecodeMCashTransferLimitExceeded;

    case "63":
      return Const.responsecodeMCashSecurityViolation;

    case "65":
      return Const.responsecodeMCashExceedsWithdrawalFrequency;

    case "68":
      return Const.responsecodeMCashResponseReceivedTooLate;

    case "69":
      return Const.responsecodeMCashUnsuccessfulAccountOrAmountBlock;

    case "70":
      return Const.responsecodeMCashUnsuccessfulAccountOrAmountUnblock;

    case "71":
      return Const.responsecodeMCashEmptyMandateReferenceNumber;

    case "91":
      return Const.responsecodeMCashBeneficiaryBankNotAvailable;

    case "92":
      return Const.responsecodeMCashRoutingError;

    case "94":
      return Const.responsecodeMCashDuplicateTransaction;

    case "96":
      return Const.responsecodeMCashSystemMalfunction;

    case "97":
      return Const.responsecodeMCashTimeoutWaitingForResponseFromDestination;

    case "0A":
      return Const.responsecodeMCashMaximumTransactionAmountSetByNIBSSExceeded;

    case "0B":
      return Const.responsecodeMCashUnknownRequestor;

    case "0C":
      return Const.responsecodeMCashPayerBlacklisted;

    case "0D":
      return Const.responsecodeMCashUnknownMerchantCode;

    case "0E":
      return Const.responsecodeMCashTransactionNotPermittedToMerchant;

    case "0F":
      return Const.responsecodeMCashMaximumTransactionAmountPermittedToMerchantExceeded;

    case "0G":
      return Const.responsecodeMCashMaximumDailyTransactionLimitPermittedToPayerExceeded;

    case "0H":
      return Const.responsecodeMCashMaximumTransactionAmountPermittedToPayerExceeded;

    case "0J":
      return Const.responsecodeMCashInvalidBVN;

    case "0K":
      return Const.responsecodeMCashMoreThanOneBVNTiedToPhoneNumber;

    case "0L":
      return Const.responsecodeMCashNoBVNTiedToAccount;

    case "0M":
      return Const.responsecodeMCashNoAccountReturned;

    case "0N":
      return Const.responsecodeMCashNameEnquiryFailed;

    case "0P":
      return Const.responsecodeMCashWrongDateOfBirth;

    case "0Q":
      return Const.responsecodeMCashPhoneNumberSwapped;

    case "0R":
      return Const.responsecodeMCashMultipleMerchantCodeRequest;

    default:
      return Const.httpCodeServerError;
  }
}

module.exports = getMCashErrorCode;
