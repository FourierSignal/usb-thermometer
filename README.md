usb-thermometer
===============

Linux USB thermometer with nodejs OAuth client

May need to: sudo apt-get install -y libusb-dev libusb-1.0-0

Then will need to run 'make' from inside src to create pcsensor 

pcsensor has the following aviable options:
    -h help
    -v verbose
    -l[n] loop every 'n' seconds, default value is 5s
    -c output only in Celsius
    -f output only in Fahrenheit
    -m output for mrtg integration

to show temperature in celcius

./src/pcsensor -c

from the project root