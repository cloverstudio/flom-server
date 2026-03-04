#!/bin/bash

ffmpeg -version > /dev/null
if [ $? -ne 0 ]; then
  # The command failed, print an error message
  echo "ffmpeg not detected"
  # Exit the script with a non-zero exit status to indicate failure
  # exit 1
else
  # The command was successful, print a success message
  echo "ffmpeg detected"
fi

ffprobe -version > /dev/null
if [ $? -ne 0 ]; then
  # The command failed, print an error message
  echo "ffprobe not detected"
  # Exit the script with a non-zero exit status to indicate failure
  # exit 1
else
  # The command was successful, print a success message
  echo "ffprobe detected"
fi

fpcalc -version > /dev/null
if [ $? -ne 0 ]; then
  echo "fpcalc not detected"
else
  echo "fpcalc detected"
fi

/shared/soundalike/soundalike -version > /dev/null
if [ $? -ne 0 ]; then
  echo "soundalike not detected"
else
  echo "soundalike detected"
fi

rabbitmqctl --version > /dev/null
if [ $? -ne 0 ]; then
  echo "rabbitmq not detected"
else
  echo "rabbitmq detected"
fi

payment_dev=$(curl --write-out "%{http_code}" --silent --insecure --head --output /dev/null "https://v2.flom.dev/api/v2/payment/ping")
if [ $payment_dev != "200" ]
then
  echo "payment service (dev) not available"
else
  echo "payment service (dev) available"
fi

payment_prod=$(curl --write-out "%{http_code}" --silent --insecure --head --output /dev/null "https://v2.flom.app/api/v2/payment/ping")
if [ $payment_prod != "200" ]
then
  echo "payment service (prod) not available"
else
  echo "payment service (prod) available"
fi

msg=$(curl --write-out "%{http_code}" --silent --insecure --head --output /dev/null "https://msg.flom.app/api/v1/ping")
if [ $msg != "200" ]; then
  echo "messaging service not available"
else
  echo "messaging service available"
fi