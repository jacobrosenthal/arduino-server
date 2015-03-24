FROM dockerfile/nodejs
MAINTAINER Jacob Rosenthal <jakerosenthal@gmail.com>

RUN apt-get update && apt-get install -qq openjdk-6-jre avr-libc gcc-avr xvfb

RUN wget http://downloads-02.arduino.cc/arduino-1.6.1-linux64.tar.xz
RUN tar -xvf arduino-1.6.1-linux64.tar.xz
RUN sudo mv arduino-1.6.1/ /usr/local/share/arduino

RUN wget https://github.com/damellis/attiny/archive/ide-1.6.x.zip
RUN unzip ide-1.6.x.zip
RUN sudo mv attiny-ide-1.6.x/attiny /usr/local/share/arduino/hardware/

COPY . /var/www
RUN cd /var/www; npm install
EXPOSE  8000
CMD ["node", "/var/www/index.js"]